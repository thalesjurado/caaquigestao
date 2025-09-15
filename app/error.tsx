'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error('[App Error Boundary]', error);
  }, [error]);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Ops! Algo quebrou no cliente.</h1>
      <p className="text-sm text-gray-600">{error.message}</p>
      {error.stack && (
        <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">{error.stack}</pre>
      )}
      <button className="px-3 py-2 rounded-xl border" onClick={() => reset()}>
        Tentar novamente
      </button>
    </main>
  );
}
