import { NextRequest, NextResponse } from 'next/server';
import * as ort from 'onnxruntime-node';
import path from 'path';

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
