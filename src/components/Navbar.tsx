'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BatteryIcon from '@/components/icons/BatteryIcon';

type NavbarProps = {
  userName: string;
  userEmail: string;
};

export default function Navbar({ userName, userEmail }: NavbarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const initials =
    userName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-black/80 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          title="Log out"
          aria-label="Log out"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          {loggingOut ? (
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12H9m9 0l-3-3m3 3l-3 3"
              />
            </svg>
          )}
        </button>

        <div className="hidden items-center gap-2 border-l border-zinc-200 pl-3 dark:border-zinc-800 sm:flex">
          <BatteryIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            BMS Dashboard
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {userName}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {userEmail}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white dark:bg-indigo-500">
          {initials}
        </div>
      </div>
    </header>
  );
}
