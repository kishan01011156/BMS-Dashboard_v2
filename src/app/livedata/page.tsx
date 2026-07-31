'use client';

import { useEffect, useState } from 'react';

type LiveData = {
    cell_voltage: number;
    pack_voltage: number;
    current: number;
    battery_temp: number;
    state_of_charge: number;
    cycle_count: number;
    charging_or_discharging: number;
    generated_at: string;
};

type PredictionResult = {
    success: boolean;
    predictedSoh: number;
    anyFaultActive: boolean;
    faults: string[];
};

// Cookie helper functions
function getCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=${value}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
}

export default function LiveDataPage() {
    const [data, setData] = useState<LiveData | null>(null);
    const [isCookieLoaded, setIsCookieLoaded] = useState(false);

    // Health Prediction States
    const [checkingHealth, setCheckingHealth] = useState(false);
    const [healthResult, setHealthResult] = useState<PredictionResult | null>(null);
    const [healthError, setHealthError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const generateRandomData = (): LiveData => {
        // Generate values adhering to specified ranges (rounded to 1 decimal place)
        const cell_voltage = parseFloat((Math.random() * 5).toFixed(1)); // range 0-5
        const pack_voltage = parseFloat((Math.random() * 50).toFixed(1)); // range 0-50
        const current = parseFloat((Math.random() * 400 - 200).toFixed(1)); // range -200 to 200
        const battery_temp = parseFloat((Math.random() * 50).toFixed(1)); // range 0 to 50
        const state_of_charge = parseFloat((Math.random() * 100).toFixed(1)); // range 0 to 100
        const cycle_count = Math.floor(Math.random() * 1000) + 1;
        const charging_or_discharging = Math.random() > 0.5 ? 1 : 0; // 0: no charging, 1: charging

        return {
            cell_voltage,
            pack_voltage,
            current,
            battery_temp,
            state_of_charge,
            cycle_count,
            charging_or_discharging,
            generated_at: new Date().toISOString(),
        };
    };

    const loadOrGenerateData = (forceRefresh = false) => {
        const cookieName = 'bms_live_data';
        const cached = getCookie(cookieName);

        if (cached && !forceRefresh) {
            try {
                const parsed = JSON.parse(decodeURIComponent(cached)) as LiveData;
                setData(parsed);
                setIsCookieLoaded(true);
                return;
            } catch (e) {
                console.error('Failed to parse cached cookie data', e);
            }
        }

        // Generate new random data
        const newData = generateRandomData();
        setData(newData);
        setIsCookieLoaded(false);

        // Save in cookies for 1 hour (3600 seconds)
        setCookie(cookieName, encodeURIComponent(JSON.stringify(newData)), 3600);
    };

    const checkHealthStatus = async () => {
        if (!data) return;
        setCheckingHealth(true);
        setHealthError(null);
        setHealthResult(null);
        setIsModalOpen(true);

        try {
            const response = await fetch('/api/finalmodelprediction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cellVoltage: data.cell_voltage,
                    packVoltage: data.pack_voltage,
                    current: data.current,
                    temp: data.battery_temp,
                    soc: data.state_of_charge,
                    cycleCount: data.cycle_count,
                    charging: data.charging_or_discharging,
                }),
            });

            const resultData = await response.json();
            if (!response.ok) {
                throw new Error(resultData.error || 'Prediction failed');
            }

            setHealthResult(resultData);
        } catch (err: any) {
            setHealthError(err.message || 'An error occurred during prediction');
        } finally {
            setCheckingHealth(false);
        }
    };

    useEffect(() => {
        loadOrGenerateData();
    }, []);

    if (!data) {
        return (
            <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="flex flex-col items-center gap-3">
                    <svg className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Loading battery metrics...</span>
                </div>
            </div>
        );
    }

    // Calculate colors for the State of Charge (SOC) progress ring
    const strokeDashoffset = 251.2 - (251.2 * data.state_of_charge) / 100;
    const isCharging = data.charging_or_discharging === 1;

    // Formatting date for cookie metadata
    const generatedTime = new Date(data.generated_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return (
        <div className="flex-1 bg-zinc-50 py-10 px-4 dark:bg-zinc-950 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Live Telemetry Data
                        </h1>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Real-time monitoring of battery metrics. Data is generated randomly and persisted in the cookies for 1 hour.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Check Health Status Button */}
                        <button
                            onClick={checkHealthStatus}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition active:scale-[0.98] cursor-pointer"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Check Health Status
                        </button>

                        {/* Force Regenerate Button */}
                        <button
                            onClick={() => loadOrGenerateData(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition active:scale-[0.98] cursor-pointer"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Force Regenerate
                        </button>
                    </div>
                </div>

                {/* Source Badge */}
                <div className="mb-6 flex items-center gap-2">
                    {isCookieLoaded ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                            Retrieved from Session Cookie (Valid for 1 Hour)
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                            Newly Generated & Cached in Cookie
                        </span>
                    )}
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        Generated at {generatedTime}
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Circular SOC Visualizer Card */}
                    <div className="md:col-span-1 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50 flex flex-col items-center justify-center">
                        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-6">
                            State of Charge
                        </h3>

                        <div className="relative flex items-center justify-center">
                            {/* Outer Glow Ring for Charging */}
                            {isCharging && (
                                <div className="absolute h-36 w-36 rounded-full border-4 border-indigo-500/20 animate-ping" />
                            )}

                            <svg className="w-36 h-36 transform -rotate-90">
                                <circle
                                    cx="72"
                                    cy="72"
                                    r="40"
                                    className="stroke-zinc-100 dark:stroke-zinc-800"
                                    strokeWidth="8"
                                    fill="transparent"
                                />
                                <circle
                                    cx="72"
                                    cy="72"
                                    r="40"
                                    className={`${isCharging
                                        ? 'stroke-indigo-600 dark:stroke-indigo-400'
                                        : 'stroke-emerald-500 dark:stroke-emerald-400'
                                        } transition-all duration-500`}
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray="251.2"
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                />
                            </svg>

                            <div className="absolute text-center">
                                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                                    {data.state_of_charge.toFixed(1)}%
                                </span>
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block font-medium uppercase mt-0.5">
                                    {isCharging ? 'Charging' : 'Idle / Discharging'}
                                </span>
                            </div>
                        </div>

                        {/* Charging State Indicator Badge */}
                        <div className={`mt-6 w-full py-2 px-4 rounded-xl text-center text-xs font-semibold border ${isCharging
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200/55 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800/60'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200/50 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-800/40'
                            }`}>
                            {isCharging ? (
                                <span className="flex items-center justify-center gap-1.5">
                                    <svg className="h-4 w-4 animate-bounce text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Active Charge Stream (1)
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-1.5">
                                    <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    Disconnected / Discharging (0)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Grid Stats Panel */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Cell Voltage */}
                        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50 flex flex-col justify-between">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Cell Voltage</span>
                            <div className="mt-3 flex items-baseline gap-1.5">
                                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                                    {data.cell_voltage.toFixed(1)}
                                </span>
                                <span className="text-sm font-medium text-zinc-400">V</span>
                            </div>
                            <div className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                                Range limit: 0 - 5.0 V
                            </div>
                        </div>

                        {/* Pack Voltage */}
                        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50 flex flex-col justify-between">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Pack Voltage</span>
                            <div className="mt-3 flex items-baseline gap-1.5">
                                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                                    {data.pack_voltage.toFixed(1)}
                                </span>
                                <span className="text-sm font-medium text-zinc-400">V</span>
                            </div>
                            <div className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                                Range limit: 0 - 50.0 V
                            </div>
                        </div>

                        {/* Current */}
                        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50 flex flex-col justify-between">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Current Flow</span>
                            <div className="mt-3 flex items-baseline gap-1.5">
                                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                                    {data.current.toFixed(1)}
                                </span>
                                <span className="text-sm font-medium text-zinc-400">A</span>
                            </div>
                            <div className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                                Range limit: -200.0 - 200.0 A
                            </div>
                        </div>

                        {/* Battery Temp */}
                        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50 flex flex-col justify-between">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Battery Temp</span>
                            <div className="mt-3 flex items-baseline gap-1.5">
                                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                                    {data.battery_temp.toFixed(1)}
                                </span>
                                <span className="text-sm font-medium text-zinc-400">°C</span>
                            </div>
                            <div className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                                Range limit: 0 - 50.0 °C
                            </div>
                        </div>

                        {/* Cycle Count */}
                        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50 flex flex-col justify-between sm:col-span-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Cycle Count</span>
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                    Lifetime Metric
                                </span>
                            </div>
                            <div className="mt-3 flex items-baseline gap-1.5">
                                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                                    {data.cycle_count}
                                </span>
                                <span className="text-sm font-medium text-zinc-400">cycles</span>
                            </div>
                            <div className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                                Measures total equivalent charge-discharge cycles.
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Health Status Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm transition-all">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 dark:border-zinc-800">
                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Battery Health Diagnostics
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {checkingHealth && (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="relative flex items-center justify-center h-16 w-16 mb-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20"></span>
                                        <svg className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Checking health metrics...</p>
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Analyzing live telemetry from cookies</p>
                                </div>
                            )}

                            {healthError && (
                                <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/20 p-4 text-sm text-red-800 dark:text-red-400">
                                    <div className="flex gap-2">
                                        <svg className="h-5 w-5 shrink-0 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <div>
                                            <span className="font-bold">Inference Error:</span> {healthError}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {healthResult && (
                                <div className="space-y-6">
                                    {/* SOH Stat */}
                                    <div className="text-center p-5 bg-zinc-50 rounded-xl dark:bg-zinc-800/40 border border-zinc-150 dark:border-zinc-800/50">
                                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">State of Health (SOH)</span>
                                        <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                                            {(healthResult.predictedSoh).toFixed(2)}%
                                        </span>
                                    </div>

                                    {/* Diagnostic Status */}
                                    <div>
                                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2.5">System Status</span>

                                        {healthResult.anyFaultActive ? (
                                            <div className="space-y-3">
                                                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 p-3 text-sm text-amber-800 dark:text-amber-400 flex gap-2">
                                                    <svg className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    <div>
                                                        <p className="font-bold">Faults Detected!</p>
                                                        <p className="text-xs opacity-90 mt-0.5">Please check active warning flags below.</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {healthResult.faults.map((fault) => (
                                                        <span
                                                            key={fault}
                                                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-500/10 animate-pulse"
                                                        >
                                                            {fault}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-400 flex gap-2.5">
                                                <svg className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div>
                                                    <p className="font-bold">System Safe & Healthy</p>
                                                    <p className="text-xs opacity-90 mt-0.5">No critical issues or warnings detected by the model classifier.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-zinc-150 dark:border-zinc-800 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-semibold rounded-lg text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
