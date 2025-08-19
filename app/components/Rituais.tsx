'use client';

import { useEffect, useState } from 'react';
import { useAppStore, Ritual } from '../../lib/store';

function RitualItem({ ritual }: { ritual: Ritual }) {
  const [notes, setNotes] = useState(ritual.notes ?? '');
  const update = useAppStore((s) => s.updateRitual);
  const deleteRitual = useAppStore((s) => s.deleteRitual);

  // Sincroniza caso o estado global mude (ex.: hidratação do persist)
  useEffect(() => {
    setNotes(ritual.notes ?? '');
  }, [ritual.notes]);

  const save = () => {
    update(ritual.id, { notes });
  };

  return (
    <div className="rounded-2xl border p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{ritual.title}</h3>
        <button
          className="text-red-600 text-sm hover:underline"
          onClick={() => deleteRitual(ritual.id)}
          title="Excluir ritual"
        >
          Excluir
        </button>
      </div>

      <textarea
        className="w-full border rounded p-2 text-sm min-h-[100px]"
        placeholder="Anotações do ritual..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
      />

      <div className="mt-2 flex gap-2">
        <button
          className="bg-black text-white rounded px-3 py-1 text-sm"
          onClick={save}
        >
          Salvar notas
        </button>
      </div>
    </div>
  );
}

export default function Rituais() {
  const rituals = useAppStore((s) => s.rituals);
  const addRitual = useAppStore((s) => s.addRitual);

  const [title, setTitle] = useState('');

  const onAdd = () => {
    if (!title.trim()) return;
    addRitual(title);
    setTitle('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="Novo ritual (ex.: Reunião Geral caaqui)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onAdd();
          }}
        />
        <button
          className="bg-black text-white rounded px-3 py-1 text-sm disabled:opacity-50"
          disabled={!title.trim()}
          onClick={onAdd}
        >
          Adicionar
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {rituals.map((r) => (
          <RitualItem key={r.id} ritual={r} />
        ))}
      </div>

      {rituals.length === 0 && (
        <p className="text-sm text-gray-500">Nenhum ritual criado ainda.</p>
      )}
    </div>
  );
}
