import { NextResponse } from 'next/server';

function getRandomFloat(min: number, max: number): number {
  const val = Math.random() * (max - min) + min;
  return Math.round(val * 10) / 10;
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function GET() {
  const cellVoltage = getRandomFloat(0, 5);
  const packVoltage = getRandomFloat(0, 50);
  const current = getRandomFloat(-200, 200);
  const temp = getRandomFloat(0, 50);
  const soc = getRandomFloat(0, 100);
  const cycleCount = getRandomInt(0, 1000);
  const charging = Math.random() > 0.5 ? 1 : 0;

  return NextResponse.json({
    // Camel case for backend API compatibility
    cellVoltage,
    packVoltage,
    current,
    temp,
    soc,
    cycleCount,
    charging,

    // Snake case as specified in requirements
    cell_voltage: cellVoltage,
    pack_voltage: packVoltage,
    battery_temp: temp,
    state_of_charge: soc,
    cycle_count: cycleCount,
    charging_or_discharging: charging,
  });
}
