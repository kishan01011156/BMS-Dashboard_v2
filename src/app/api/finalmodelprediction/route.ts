import { NextRequest, NextResponse } from 'next/server';
import * as ort from 'onnxruntime-node';
import path from 'path';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// Cache the inference sessions globally so we don't reload files on every request.
let sohSession: ort.InferenceSession | null = null;
let faultSession: ort.InferenceSession | null = null;

const FAULT_LABELS = [
  'Cell Overvoltage',
  'Cell Undervoltage',
  'Cell Voltage Imbalance',
  'Pack Overvoltage',
  'Pack Undervoltage',
  'Battery Overtemperature',
  'Battery Undertemperature',
  'Charge Overcurrent',
  'Discharge Overcurrent',
  'Short Circuit',
  'Thermal Runaway Warning',
];

async function getSohSession(): Promise<ort.InferenceSession> {
  if (!sohSession) {
    const modelPath = path.join(process.cwd(), 'src', 'lib', 'soh_model.onnx');
    sohSession = await ort.InferenceSession.create(modelPath);
  }
  return sohSession;
}

async function getFaultSession(): Promise<ort.InferenceSession> {
  if (!faultSession) {
    const modelPath = path.join(process.cwd(), 'src', 'lib', 'fault_model.onnx');
    faultSession = await ort.InferenceSession.create(modelPath);
  }
  return faultSession;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user session
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active session found' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      cellVoltage,
      packVoltage,
      current,
      temp,
      soc,
      cycleCount,
      charging,
    } = body;

    // Validate inputs
    const missingFields: string[] = [];
    if (cellVoltage === undefined) missingFields.push('cellVoltage');
    if (packVoltage === undefined) missingFields.push('packVoltage');
    if (current === undefined) missingFields.push('current');
    if (temp === undefined) missingFields.push('temp');
    if (soc === undefined) missingFields.push('soc');
    if (cycleCount === undefined) missingFields.push('cycleCount');
    if (charging === undefined) missingFields.push('charging');

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields,
          dummyDataExample: {
            cellVoltage: 3.8,
            packVoltage: 45.6,
            current: -1.2,
            temp: 28.5,
            soc: 80.0,
            cycleCount: 150,
            charging: 0,
          },
        },
        { status: 400 }
      );
    }

    // Load both models
    const [sSession, fSession] = await Promise.all([
      getSohSession(),
      getFaultSession(),
    ]);

    // Prepare inputs as float32 array
    const inputsArray = new Float32Array([
      Number(cellVoltage),
      Number(packVoltage),
      Number(current),
      Number(temp),
      Number(soc),
      Number(cycleCount),
      Number(charging),
    ]);

    // Create the tensors (both models have 'float_input' as input name with shape [1, 7])
    const inputTensorSoh = new ort.Tensor('float32', inputsArray, [1, 7]);
    const inputTensorFault = new ort.Tensor('float32', inputsArray.slice(), [1, 7]);

    // Run inference in parallel
    const [sohResults, faultResults] = await Promise.all([
      sSession.run({ float_input: inputTensorSoh }),
      fSession.run({ float_input: inputTensorFault }),
    ]);

    // Retrieve predicted SOH
    const predictedSoh = sohResults.variable.data[0];

    // Retrieve predicted fault outputs
    const faultOutputData = faultResults.variable.data as Float32Array;

    // Map output scores to active fault labels
    const activeFaults: string[] = [];
    let anyFaultActive = false;

    FAULT_LABELS.forEach((label, index) => {
      const score = Number(faultOutputData[index] ?? 0);
      const active = score > 0.5;
      if (active) {
        anyFaultActive = true;
        activeFaults.push(label);
      }
    });

    const now = new Date().toISOString();
    let batteryId: string;

    // Find or create battery for user
    const { data: existingBattery } = await supabaseAdmin
      .from('batteries')
      .select('id')
      .eq('user_id', session.userId)
      .maybeSingle();

    if (existingBattery) {
      batteryId = existingBattery.id;
      // Update battery metrics and SOH
      const { error: updateError } = await supabaseAdmin
        .from('batteries')
        .update({
          cell_voltage: Number(cellVoltage),
          pack_voltage: Number(packVoltage),
          current: Number(current),
          battery_temp: Number(temp),
          state_of_charge: Number(soc),
          cycle_count: Number(cycleCount),
          charging_or_discharging: Number(charging),
          SoH: Number(predictedSoh),
          updated_at: now,
        })
        .eq('id', batteryId);

      if (updateError) {
        console.error('Error updating battery in DB:', updateError);
        throw new Error(`Failed to update battery in database: ${updateError.message}`);
      }
    } else {
      batteryId = crypto.randomUUID();
      // Insert new battery record
      const { error: insertError } = await supabaseAdmin
        .from('batteries')
        .insert({
          id: batteryId,
          user_id: session.userId,
          cell_voltage: Number(cellVoltage),
          pack_voltage: Number(packVoltage),
          current: Number(current),
          battery_temp: Number(temp),
          state_of_charge: Number(soc),
          cycle_count: Number(cycleCount),
          charging_or_discharging: Number(charging),
          SoH: Number(predictedSoh),
          created_at: now,
          updated_at: now,
        });

      if (insertError) {
        console.error('Error inserting battery into DB:', insertError);
        throw new Error(`Failed to insert battery in database: ${insertError.message}`);
      }
    }

    // Map output scores to causes payload
    const causesPayload = {
      battery_id: batteryId,
      cell_overvoltage: false,
      cell_undervoltage: false,
      cell_voltage_imbalance: false,
      pack_overvoltage: false,
      pack_undervoltage: false,
      battery_over_temperature: false,
      battery_under_temperature: false,
      charge_over_current: false,
      discharge_over_current: false,
      short_circuit: false,
      thermal_runaway_warning: false,
      updated_at: now,
    };

    FAULT_LABELS.forEach((label, index) => {
      const score = Number(faultOutputData[index] ?? 0);
      const active = score > 0.5;

      if (label === 'Cell Overvoltage') causesPayload.cell_overvoltage = active;
      else if (label === 'Cell Undervoltage') causesPayload.cell_undervoltage = active;
      else if (label === 'Cell Voltage Imbalance') causesPayload.cell_voltage_imbalance = active;
      else if (label === 'Pack Overvoltage') causesPayload.pack_overvoltage = active;
      else if (label === 'Pack Undervoltage') causesPayload.pack_undervoltage = active;
      else if (label === 'Battery Overtemperature') causesPayload.battery_over_temperature = active;
      else if (label === 'Battery Undertemperature') causesPayload.battery_under_temperature = active;
      else if (label === 'Charge Overcurrent') causesPayload.charge_over_current = active;
      else if (label === 'Discharge Overcurrent') causesPayload.discharge_over_current = active;
      else if (label === 'Short Circuit') causesPayload.short_circuit = active;
      else if (label === 'Thermal Runaway Warning') causesPayload.thermal_runaway_warning = active;
    });

    const { data: existingCause } = await supabaseAdmin
      .from('causes')
      .select('id')
      .eq('battery_id', batteryId)
      .maybeSingle();

    if (existingCause) {
      const { error: updateCauseError } = await supabaseAdmin
        .from('causes')
        .update({
          ...causesPayload,
          updated_at: now,
        })
        .eq('id', existingCause.id);

      if (updateCauseError) {
        console.error('Error updating causes in DB:', updateCauseError);
        throw new Error(`Failed to update causes in database: ${updateCauseError.message}`);
      }
    } else {
      const { error: insertCauseError } = await supabaseAdmin
        .from('causes')
        .insert({
          id: crypto.randomUUID(),
          ...causesPayload,
          created_at: now,
          updated_at: now,
        });

      if (insertCauseError) {
        console.error('Error inserting causes into DB:', insertCauseError);
        throw new Error(`Failed to insert causes in database: ${insertCauseError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      predictedSoh: Number(predictedSoh),
      anyFaultActive,
      faults: activeFaults,
    });
  } catch (error: any) {
    console.error('Error during battery final model prediction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error during final prediction',
      },
      { status: 500 }
    );
  }
}
