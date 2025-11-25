'use client';

import Link from 'next/link';
import { useAppStore } from '../../lib/store-supabase';

export default function ProjectsPage() {
  const { projects, boardActivities, collaborators } = useAppStore();
  const board = boardActivities ?? [];
  type Activity = typeof board[number];

  const groups = new Map<string, Activity[]>();
  for (const a of board) {
    const key = a.client ?? 'Projeto Único';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projetos</h1>
        <Link href="/" className="text-sm underline">Voltar</Link>
      </div>

      {[...groups.entries()].map(([name, tasks]) => (
        <section key={name} className="rounded-2xl border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">{name}</h2>
            <span className="text-sm text-gray-600">
              {tasks.length} tarefa(s)
            </span>
          </div>
          <ul className="space-y-2">
            {tasks.map((t: Activity) => {
              const owner = collaborators.find(c => c.id === t.assigneeId);
              return (
                <li key={t.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-gray-600">
                      Status: {(t as any).status ?? '—'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Responsável</div>
                    <div className="font-medium">{owner?.name ?? '—'}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
