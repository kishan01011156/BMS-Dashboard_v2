import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

/**
 * Centralized session check for Server Components, Server Actions and
 * Route Handlers. Redirects to /login when no valid session exists.
 */
export const verifySession = cache(async () => {
  const session = await getSession();

  if (!session?.userId) {
    redirect('/login');
  }

  return session;
});
