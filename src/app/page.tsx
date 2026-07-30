import { verifySession } from '@/lib/dal';

export default async function Home() {
  const session = await verifySession();
  const firstName = session.name.trim().split(/\s+/)[0] || session.name;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Welcome, {firstName}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {session.email}
        </p>
      </main>
    </div>
  );
}
