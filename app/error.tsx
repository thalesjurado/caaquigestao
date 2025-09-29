'use client';
import { useEffect, useMemo } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  const isChunkLoadError = useMemo(() => {
    const msg = `${error?.name || ''} ${error?.message || ''}`.toLowerCase();
    return msg.includes('chunkloaderror') || msg.includes('loading chunk') || msg.includes('failed to fetch dynamically imported module');
  }, [error]);

  useEffect(() => {
    console.error('[App Error Boundary]', error);
    // Se for erro de chunk/código dividido, tenta recarregar apenas uma vez
    if (isChunkLoadError) {
      const alreadyTried = sessionStorage.getItem('retry-after-chunk-error');
      if (!alreadyTried) {
        sessionStorage.setItem('retry-after-chunk-error', '1');
        // Força recarregar sem cache
        window.location.reload();
      } else {
        // Limpa a flag para futuras sessões
        sessionStorage.removeItem('retry-after-chunk-error');
      }
    }
  }, [error, isChunkLoadError]);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Ops! Algo quebrou no cliente.</h1>
      {isChunkLoadError ? (
        <p className="text-sm text-gray-700">
          Detectamos um problema ao carregar um arquivo do app (ChunkLoadError). Isso costuma acontecer logo após um novo deploy.
          Tente recarregar a página. Se o problema persistir, limpe o cache do navegador.
        </p>
      ) : (
        <p className="text-sm text-gray-600">{error.message}</p>
      )}
      {error.stack && !isChunkLoadError && (
        <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">{error.stack}</pre>
      )}
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded-xl border" onClick={() => reset()}>
          Tentar novamente
        </button>
        <button
          className="px-3 py-2 rounded-xl border"
          onClick={() => window.location.reload()}
        >
          Recarregar página
        </button>
      </div>
    </main>
  );
}
