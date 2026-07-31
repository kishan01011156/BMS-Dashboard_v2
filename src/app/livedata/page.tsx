'use client';

import { useState, useEffect } from 'react';

type DummyData = {
    cellVoltage: number;
    packVoltage: number;
    current: number;
    temp: number;
    soc: number;
    cycleCount: number;
    charging: number;

    cell_voltage: number;
    pack_voltage: number;
    battery_temp: number;
    state_of_charge: number;
    cycle_count: number;
    charging_or_discharging: number;
};

type PredictionResult = {
    success: boolean;
    predictedSoh: number;
    anyFaultActive: boolean;
    faults: string[];
};

export default function LiveDataPage() {
    const [data, setData] = useState<DummyData | null>(null);
    const [loadingData, setLoadingData] = useState<boolean>(true);
    const [checkingHealth, setCheckingHealth] = useState<boolean>(false);
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch initial random dummy data
    const fetchLiveData = async () => {
        setLoadingData(true);
        setError(null);
        try {
            const res = await fetch('/api/dummydata');
            if (!res.ok) throw new Error('Failed to fetch live data');
            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message || 'Error fetching data');
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        fetchLiveData();
    }, []);

    // Check health by posting to finalmodelprediction
    const handleCheckHealth = async () => {
        if (!data) return;
        setCheckingHealth(true);
        setError(null);
        try {
            const res = await fetch('/api/finalmodelprediction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cellVoltage: data.cellVoltage,
                    packVoltage: data.packVoltage,
                    current: data.current,
                    temp: data.temp,
                    soc: data.soc,
                    cycleCount: data.cycleCount,
                    charging: data.charging,
                }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to check health');

            setPrediction(json);
            setModalOpen(true);
        } catch (err: any) {
            setError(err.message || 'Error checking health');
        } finally {
            setCheckingHealth(false);
        }
    };

    return (
        <div className="flex-1 bg-zinc-50 py-10 px-4 dark:bg-zinc-950 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Live Battery Telemetry
                        </h1>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Real-time feed of simulated battery cell, pack, thermal, and state values.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchLiveData}
                        disabled={loadingData || checkingHealth}
                        className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition shadow-sm active:scale-98"
                    >
                        <svg className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
                        </svg>
                        Simulate New Data
                    </button>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-400 border border-red-200/10 flex gap-2">
                        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <span className="font-semibold">Error:</span> {error}
                        </div>
                    </div>
                )}

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                    {/* Card: Cell Voltage */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40">
                        <div className="flex items-center justify-between mb-3 text-zinc-500 dark:text-zinc-400">
                            <span className="text-sm font-medium">Cell Voltage</span>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                        </div>
                        {loadingData ? (
                            <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                        ) : (
                            <p className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                                {data?.cellVoltage.toFixed(1)} <span className="text-lg font-normal text-zinc-500">V</span>
                            </p>
                        )}
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Range: 0.0 - 5.0 V</p>
                    </div>

                    {/* Card: Pack Voltage */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40">
                        <div className="flex items-center justify-between mb-3 text-zinc-500 dark:text-zinc-400">
                            <span className="text-sm font-medium">Pack Voltage</span>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                        </div>
                        {loadingData ? (
                            <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                        ) : (
                            <p className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                                {data?.packVoltage.toFixed(1)} <span className="text-lg font-normal text-zinc-500">V</span>
                            </p>
                        )}
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Range: 0.0 - 50.0 V</p>
                    </div>

                    {/* Card: Current */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40">
                        <div className="flex items-center justify-between mb-3 text-zinc-500 dark:text-zinc-400">
                            <span className="text-sm font-medium">Current</span>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0l-4.5 4.5M21 7.5H7.5" />
                            </svg>
                        </div>
                        {loadingData ? (
                            <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                        ) : (
                            <p className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                                {data?.current.toFixed(1)} <span className="text-lg font-normal text-zinc-500">A</span>
                            </p>
                        )}
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Range: -200.0 - 200.0 A</p>
                    </div>

                    {/* Card: Battery Temperature */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40">
                        <div className="flex items-center justify-between mb-3 text-zinc-500 dark:text-zinc-400">
                            <span className="text-sm font-medium">Battery Temperature</span>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18" />
                            </svg>
                        </div>
                        {loadingData ? (
                            <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                        ) : (
                            <p className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                                {data?.temp.toFixed(1)} <span className="text-lg font-normal text-zinc-500">°C</span>
                            </p>
                        )}
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">Range: 0.0 - 50.0 °C</p>
                    </div>

                    {/* Card: State of Charge (SOC) */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40">
                        <div className="flex items-center justify-between mb-3 text-zinc-500 dark:text-zinc-400">
                            <span className="text-sm font-medium">State of Charge</span>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M3.75 18h15A2.25 2.25 0 0021 15.75v-6.75A2.25 2.25 0 0018.75 6.75h-15A2.25 2.25 0 001.5 9v6.75A2.25 2.25 0 003.75 18z" />
                            </svg>
                        </div>
                        {loadingData ? (
                            <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                        ) : (
                            <div className="space-y-2">
                                <p className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                                    {data?.soc.toFixed(1)}%
                                </p>
                                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                                    <div
                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${data?.soc}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card: Cycle Count & Charging */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Cycle Count</span>
                                {loadingData ? (
                                    <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                                ) : (
                                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-mono">
                                        {data?.cycleCount}
                                    </p>
                                )}
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">State</span>
                                {loadingData ? (
                                    <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                                ) : (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${data?.charging === 1
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                                            : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                                        }`}>
                                        {data?.charging === 1 ? 'Charging (1)' : 'Idle/Discharging (0)'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-4">Simulated telemetry parameters</p>
                    </div>
                </div>

                {/* Action Button: Check Health */}
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={handleCheckHealth}
                        disabled={loadingData || checkingHealth || !data}
                        className="w-full sm:w-72 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-white bg-indigo-600 hover:bg-indigo-500 font-bold tracking-wide shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                        {checkingHealth ? (
                            <>
                                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                Evaluating Health...
                            </>
                        ) : (
                            <>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Check Health
                            </>
                        )}
                    </button>
                </div>

                {/* Modal Overlay / Popup */}
                {modalOpen && prediction && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm transition-opacity duration-350">
                        <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800">

                            {/* Close Button */}
                            <button
                                onClick={() => setModalOpen(false)}
                                className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition"
                                aria-label="Close modal"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Title */}
                            <div className="text-center mb-6">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-3">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                                    Health Check Diagnostics
                                </h3>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                    Classifier prediction from live data parameters
                                </p>
                            </div>

                            {/* Body Details */}
                            <div className="space-y-5">
                                {/* State of Health */}
                                <div className="text-center p-4 bg-zinc-50 rounded-2xl dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">State of Health (SOH)</span>
                                    <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                                        {(prediction.predictedSoh).toFixed(2)}%
                                    </span>
                                </div>

                                {/* Causes & Diagnostics Alert */}
                                <div>
                                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Conditions Detected</span>

                                    {prediction.anyFaultActive ? (
                                        <div className="space-y-3">
                                            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-400 flex gap-2">
                                                <svg className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                <div>
                                                    <p className="font-semibold">BMS Warning Active</p>
                                                    <p className="opacity-90 mt-0.5">The battery classifier identified the following faults:</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                                                {prediction.faults.map((fault) => (
                                                    <span
                                                        key={fault}
                                                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/10"
                                                    >
                                                        {fault}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 p-4 text-xs text-emerald-800 dark:text-emerald-400 flex gap-2.5">
                                            <svg className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <p className="font-semibold">Status: Normal / Healthy</p>
                                                <p className="opacity-90 mt-0.5">No critical issues or warnings detected from these telemetry values.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Close Action */}
                            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="w-full py-2.5 px-4 rounded-xl text-center text-sm font-semibold border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                                >
                                    Dismiss Report
                                </button>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
