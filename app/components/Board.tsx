'use client';
import { useMemo, useState } from 'react';
import { useAppStore, BoardActivity } from '../../lib/store';
import { toast } from '../../lib/toast';

const COLUMNS: { key: BoardActivity['status']; title: string }[] = [
  { key: 'todo', title: 'A Fazer' },
  { key: 'doing', title: 'Em Progresso' },
  { key: 'done', title: 'Concluído' },
];

function fmtDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return iso;
  }
}

export default function Board() {
  const activities = useAppStore((s) => s.boardActivities);
  const updateActivity = useAppStore((s) => s.updateBoardActivity);
  const add = useAppStore((s) => s.addBoardActivity);
  const del = useAppStore((s) => s.deleteBoardActivity);
  const collaborators = useAppStore((s) => s.collaborators);

  // Novo card
  const [openNew, setOpenNew] = useState(false);
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState<number | ''>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [client, setClient] = useState('');

  const canAdd = title.trim().length > 0;

  const onAdd = () => {
    if (!canAdd) return;
    add(title.trim(), {
      status: 'todo',
      points: typeof points === 'number' ? points : undefined,
      assigneeId: assigneeId || undefined,
      client: client || undefined,
    });
    toast.success('Tarefa adicionada com sucesso!');
    setTitle('');
    setPoints('');
    setAssigneeId('');
    setClient('');
    setOpenNew(false);
  };

  // DnD
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDrop = (e: React.DragEvent, status: BoardActivity['status']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    updateActivity(id, { status });
    toast.success(`Tarefa movida para ${COLUMNS.find(c => c.key === status)?.title}`);
  };

  const byCol = useMemo(() => {
    const map: Record<BoardActivity['status'], typeof activities> = {
      todo: [],
      doing: [],
      done: [],
    };
    for (const a of activities) map[a.status].push(a);
    return map;
  }, [activities]);

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="text-sm text-gray-600">
          Arraste as cartas entre colunas para mudar o status.
        </div>
        <button
          className="ml-auto px-3 py-2 rounded-xl bg-black text-white"
          onClick={() => setOpenNew((v) => !v)}
        >
          + Nova tarefa
        </button>
      </div>

      {openNew && (
        <div className="rounded-2xl border p-3 bg-white">
          <div className="grid md:grid-cols-6 gap-3">
            <input
              className="md:col-span-2 border rounded-xl p-2"
              placeholder="Título *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="border rounded-xl p-2"
              placeholder="Cliente"
              value={client}
              onChange={(e) => setClient(e.target.value)}
            />
            <div className="flex gap-3">
              <input
                className="w-24 border rounded-xl p-2"
                type="number"
                min={0}
                placeholder="pts"
                value={points}
                onChange={(e) => setPoints(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <select
              className="border rounded-xl p-2 md:col-span-2"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Sem owner</option>
              {collaborators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex gap-2 justify-end">
            <button className="px-3 py-2 rounded-xl border" onClick={() => setOpenNew(false)}>
              Cancelar
            </button>
            <button
              className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50"
              onClick={onAdd}
              disabled={!canAdd}
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {COLUMNS.map((col) => {
          const list = byCol[col.key];
          return (
            <section
              key={col.key}
              className="bg-gray-50 rounded-2xl p-3"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.key)}
            >
              <header className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{col.title}</h3>
                <span className="text-xs text-gray-500">{list.length}</span>
              </header>

              <div className="space-y-3 min-h-8">
                {list.map((a) => {
                  const owner = collaborators.find((c) => c.id === a.assigneeId);
                  return (
                    <article
                      key={a.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, a.id)}
                      className="rounded-2xl border p-3 bg-white shadow-sm"
                    >
                      <div className="font-medium leading-snug">
                        {a.title}
                      </div>
                      {a.client && (
                        <div className="text-xs text-gray-600 mt-1">
                          <span>{a.client}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                        {owner && <span>{owner.name}</span>}
                        {typeof a.points === 'number' && (
                          <span className="px-2 py-1 rounded-full bg-gray-100">
                            {a.points} pts
                          </span>
                        )}
                        <button
                          className="ml-1 px-2 py-1 rounded-lg border text-gray-600 hover:bg-gray-50"
                          title="Remover"
                          onClick={() => {
                            del(a.id);
                            toast.success('Tarefa removida');
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </article>
                  );
                })}
                {list.length === 0 && (
                  <div className="text-sm text-gray-500">Sem itens.</div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <div className="text-xs text-gray-600">
        MVP local-first: dados salvos no seu navegador. Use Exportar para backup/compartilhar.
      </div>
    </div>
  );
}
