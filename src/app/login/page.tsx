'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import BatteryIcon from '@/components/icons/BatteryIcon';

type GoogleCredentialResponse = {
  credential: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const handleCredentialResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      setError(null);
      setSubmitting(true);

      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Sign-in failed');
        }

        router.push('/');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign-in failed');
        setSubmitting(false);
      }
    },
    [router]
  );

  const initializeGoogle = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!window.google || !buttonRef.current || !clientId) {
      setError('Google Sign-In is not configured.');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 320,
      shape: 'pill',
      text: 'signin_with',
    });

    setGoogleReady(true);
  }, [handleCredentialResponse]);

  return (
    <div className="flex min-h-screen flex-1 bg-zinc-50 dark:bg-black">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogle}
      />

      {/* Branding panel */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-slate-400/20 blur-3xl"
        />

        <div className="flex items-center gap-2.5">
          <BatteryIcon className="h-7 w-7" />
          <span className="text-lg font-semibold tracking-tight">
            BMS Dashboard
          </span>
        </div>

        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-semibold leading-tight text-balance">
            Battery management, monitored in real time.
          </h1>
          <p className="text-indigo-100/80">
            Track cell health, state of charge, cycle count, and fault
            diagnostics across your battery fleet from a single, secure
            dashboard.
          </p>
        </div>

        <p className="text-sm text-indigo-100/60">
          &copy; {new Date().getFullYear()} BMS Dashboard. All rights
          reserved.
        </p>
      </div>

      {/* Sign-in panel */}
      <div className="flex w-full flex-1 items-center justify-center px-6 py-12 lg:w-[460px] lg:flex-none">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2 lg:hidden">
              <BatteryIcon className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                BMS Dashboard
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Welcome back
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Sign in with your Google account to access the dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex min-h-[44px] flex-col items-center gap-4">
              <div ref={buttonRef} />

              {!googleReady && !error && (
                <div className="h-11 w-full max-w-[320px] animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              )}

              {submitting && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Signing you in&hellip;
                </p>
              )}

              {error && (
                <p className="w-full rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
            Access is restricted to authorized personnel only.
          </p>
        </div>
      </div>
    </div>
  );
}
