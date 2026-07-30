'use client';

import { useState } from 'react';

export default function SimulatorPage() {
  // Simulator input states
  const [cellVoltage, setCellVoltage] = useState<number>(3.7);
  const [packVoltage, setPackVoltage] = useState<number>(44.4);
  const [current, setCurrent] = useState<number>(0.0);
  const [temp, setTemp] = useState<number>(25.0);
  const [soc, setSoc] = useState<number>(80.0);
  const [cycleCount, setCycleCount] = useState<number>(100);
  const [charging, setCharging] = useState<number>(0);

  // Prediction output states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    predictedSoh: number;
    anyFaultActive: boolean;
    faults: string[];
  } | null>(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/finalmodelprediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cellVoltage,
          packVoltage,
          current,
          temp,
          soc,
          cycleCount,
          charging,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Prediction failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-zinc-50 py-10 px-4 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Battery Condition Simulator
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Simulate battery cell variables in real time and run AI model prediction to calculate State of Health (SOH) and detect potential battery faults.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Controls Panel */}
          <div className="lg:col-span-2 space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Simulation Parameters
            </h2>

            <div className="space-y-6">
              {/* Cell Voltage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <label htmlFor="cell_voltage" className="text-zinc-700 dark:text-zinc-300">
                    Cell Voltage (V)
                  </label>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    {cellVoltage.toFixed(1)} V
                  </span>
                </div>
                <input
                  id="cell_voltage"
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={cellVoltage}
                  onChange={(e) => setCellVoltage(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>0.0 V</span>
                  <span>2.5 V</span>
                  <span>5.0 V</span>
                </div>
              </div>

              {/* Pack Voltage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <label htmlFor="pack_voltage" className="text-zinc-700 dark:text-zinc-300">
                    Pack Voltage (V)
                  </label>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    {packVoltage.toFixed(1)} V
                  </span>
                </div>
                <input
                  id="pack_voltage"
                  type="range"
                  min="0"
                  max="50"
                  step="0.1"
                  value={packVoltage}
                  onChange={(e) => setPackVoltage(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>0.0 V</span>
                  <span>25.0 V</span>
                  <span>50.0 V</span>
                </div>
              </div>

              {/* Current */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <label htmlFor="current" className="text-zinc-700 dark:text-zinc-300">
                    Current (A)
                  </label>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    {current.toFixed(1)} A
                  </span>
                </div>
                <input
                  id="current"
                  type="range"
                  min="-200"
                  max="200"
                  step="0.1"
                  value={current}
                  onChange={(e) => setCurrent(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>-200 A (Discharge)</span>
                  <span>0 A</span>
                  <span>200 A (Charge)</span>
                </div>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <label htmlFor="battery_temp" className="text-zinc-700 dark:text-zinc-300">
                    Battery Temperature (°C)
                  </label>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    {temp.toFixed(1)} °C
                  </span>
                </div>
                <input
                  id="battery_temp"
                  type="range"
                  min="0"
                  max="50"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>0 °C</span>
                  <span>25 °C</span>
                  <span>50 °C</span>
                </div>
              </div>

              {/* State of Charge (SOC) */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <label htmlFor="state_of_charge" className="text-zinc-700 dark:text-zinc-300">
                    State of Charge (SOC) (%)
                  </label>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    {soc.toFixed(1)}%
                  </span>
                </div>
                <input
                  id="state_of_charge"
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={soc}
                  onChange={(e) => setSoc(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>0% (Empty)</span>
                  <span>50%</span>
                  <span>100% (Full)</span>
                </div>
              </div>

              {/* Cycle Count & Charging Boolean (Side-by-side) */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Cycle Count */}
                <div className="space-y-2">
                  <label htmlFor="cycle_count" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Cycle Count
                  </label>
                  <input
                    id="cycle_count"
                    type="number"
                    min="0"
                    max="10000"
                    value={cycleCount}
                    onChange={(e) => setCycleCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-950 font-medium transition dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Charging / Discharging Toggle */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Charging State
                  </label>
                  <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
                    <button
                      type="button"
                      onClick={() => setCharging(0)}
                      className={`flex-1 text-center py-1.5 text-sm font-medium rounded-md transition-all ${charging === 0
                          ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-zinc-50'
                          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                        }`}
                    >
                      No Charging (0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCharging(1)}
                      className={`flex-1 text-center py-1.5 text-sm font-medium rounded-md transition-all ${charging === 1
                          ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
                          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                        }`}
                    >
                      Charging (1)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Predict Button */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 mt-6">
              <button
                type="button"
                onClick={handlePredict}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 font-semibold shadow-sm shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.99] transition disabled:opacity-75 disabled:pointer-events-none dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {loading ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Running Diagnostics...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.982-11.795H14l1-6.197H6.018L6 12h5.813z" />
                    </svg>
                    Predict Diagnostics
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50 min-h-[350px] flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Prediction Results
                </h2>

                {error && (
                  <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-400 border border-red-200/20">
                    <div className="flex gap-2">
                      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <span className="font-semibold text-red-900 dark:text-red-200">Error:</span> {error}
                      </div>
                    </div>
                  </div>
                )}

                {!result && !error && !loading && (
                  <div className="flex flex-col items-center justify-center text-center py-12 px-4 text-zinc-500 dark:text-zinc-400">
                    <svg className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">No active diagnostics run</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Adjust sliders and click Predict to view health metrics.</p>
                  </div>
                )}

                {loading && (
                  <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                    <div className="relative flex items-center justify-center h-16 w-16 mb-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20"></span>
                      <svg className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Processing variables...</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Running ONNX model inference</p>
                  </div>
                )}

                {result && (
                  <div className="space-y-6">
                    {/* SOH Stat */}
                    <div className="text-center p-4 bg-zinc-50 rounded-xl dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">State of Health (SOH)</span>
                      <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                        {(result.predictedSoh).toFixed(2)}%
                      </span>
                    </div>

                    {/* Status / Faults Alert */}
                    <div>
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Diagnostic Status</span>

                      {result.anyFaultActive ? (
                        <div className="space-y-2">
                          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 p-3 text-sm text-amber-800 dark:text-amber-400 flex gap-2">
                            <svg className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                              <p className="font-semibold">Fault Conditions Detected!</p>
                              <p className="text-xs opacity-90 mt-0.5">Please check active battery warning labels below.</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {result.faults.map((fault) => (
                              <span
                                key={fault}
                                className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/10"
                              >
                                {fault}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-400 flex gap-2.5">
                          <svg className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="font-semibold">System Safe & Healthy</p>
                            <p className="text-xs opacity-90 mt-0.5">No warnings or fault conditions detected by the classifier.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {result && (
                <div className="text-center pt-4 border-t border-zinc-150 dark:border-zinc-800 mt-4 text-[10px] text-zinc-400 dark:text-zinc-500">
                  Prediction calculated via local ONNX runtime.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
