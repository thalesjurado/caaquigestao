'use client';

import { useState, useMemo } from 'react';
import { useAppStore, OKR } from '../../lib/store';
import { toast } from '../../lib/toast';

function AssigneeSelect({
  value,
  onChange,
}: {
  value?: string;
  onChange: (id?: string) => void;
}) {
  const collaborators = useAppStore((s) => s.collaborators);
  return (
    <select
      className="border rounded px-2 py-1 text-sm"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      <option value="">— sem responsável —</option>
      {collaborators.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

function OKRCard({ okr }: { okr: OKR }) {
  const [task, setTask] = useState('');
  const addOKRActivity = useAppStore((s) => s.addOKRActivity);
  const deleteOKRActivity = useAppStore((s) => s.deleteOKRActivity);
  const updateOKRActivity = useAppStore((s) => s.updateOKRActivity);
  const deleteOKR = useAppStore((s) => s.deleteOKR);

  const canAdd = okr.activities.length < 5 && task.trim().length > 0;

  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{okr.title}</h3>
        <button
          className="text-red-600 text-sm hover:underline"
          onClick={() => {
            deleteOKR(okr.id);
            toast.success('OKR excluído');
          }}
          title="Excluir OKR"
        >
          Excluir
        </button>
      </div>

      <ul className="space-y-2 mb-3">
        {okr.activities.map((a) => (
          <li key={a.id} className="flex items-center gap-2">
            <span className="flex-1">{a.title}</span>
            <AssigneeSelect
              value={a.assigneeId}
              onChange={(assigneeId) => updateOKRActivity(okr.id, a.id, { assigneeId })}
            />
            <button
              className="text-red-500 text-sm hover:underline"
              onClick={() => {
                deleteOKRActivity(okr.id, a.id);
                toast.success('Atividade removida');
              }}
              title="Excluir atividade"
            >
              Remover
            </button>
          </li>
        ))}
        {okr.activities.length === 0 && (
          <li className="text-sm text-gray-500">Sem atividades ainda.</li>
        )}
      </ul>

      <div className="flex items-center gap-2">
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
          placeholder="Nova atividade (máx. 5 por OKR)"
        />
        <button
          className="bg-black text-white rounded px-3 py-1 text-sm disabled:opacity-50"
          disabled={!canAdd}
          onClick={() => {
            addOKRActivity(okr.id, task);
            toast.success('Atividade adicionada ao OKR');
            setTask('');
          }}
        >
          Adicionar
        </button>
      </div>
      {okr.activities.length >= 5 && (
        <p className="text-xs text-amber-600 mt-1">Limite de 5 atividades atingido.</p>
      )}
    </div>
  );
}

export default function OKRs() {
  const okrs = useAppStore((s) => s.okrs);
  const addOKR = useAppStore((s) => s.addOKR);

  const [title, setTitle] = useState('');

  const canAdd = okrs.length < 5 && title.trim().length > 0;

  const info = useMemo(
    () => ({
      count: okrs.length,
      remaining: Math.max(0, 5 - okrs.length),
    }),
    [okrs.length]
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
          placeholder="Novo OKR (máx. 5)"
        />
        <button
          className="bg-black text-white rounded px-3 py-1 text-sm disabled:opacity-50"
          disabled={!canAdd}
          onClick={() => {
            addOKR({
              title: title.trim(),
              description: '',
              progress: 0,
              activities: []
            });
            toast.success('OKR criado com sucesso');
            setTitle('');
          }}
        >
          Criar OKR
        </button>
      </div>
      <p className="text-xs text-gray-500">
        OKRs: {info.count} • Restantes: {info.remaining}
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {okrs.map((okr) => (
          <OKRCard key={okr.id} okr={okr} />
        ))}
      </div>

      {okrs.length >= 5 && (
        <p className="text-xs text-amber-600">Limite de 5 OKRs atingido.</p>
      )}
    </div>
  );
}
