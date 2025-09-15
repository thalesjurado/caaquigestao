// app/components/Team.tsx
'use client';

import { useMemo, useState } from 'react';
import { useAppStore, Collaborator, OKR } from '../../lib/store';
import { toast } from '../../lib/toast';

function useAssigneeCounts(okrs: OKR[]) {
  return useMemo(() => {
    const m = new Map<string, number>();
    okrs.forEach((o) =>
      o.activities.forEach((a) => {
        if (a.assigneeId) m.set(a.assigneeId, (m.get(a.assigneeId) || 0) + 1);
      })
    );
    return m;
  }, [okrs]);
}

function Row({ c, count }: { c: Collaborator; count: number }) {
  const update = useAppStore((s) => s.updateCollaborator);
  const del = useAppStore((s) => s.deleteCollaborator);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(c.name);
  const [role, setRole] = useState(c.role ?? '');
  const [email, setEmail] = useState(c.email ?? '');

  const save = () => {
    if (!name.trim()) return;
    update(c.id, { name, role, email });
    toast.success('Colaborador atualizado');
    setEdit(false);
  };

  const onRemove = () => {
    const msg =
      count > 0
        ? `Remover ${c.name}? ${count} atividade(s) atribuída(s) a ele(a) serão DESASSOCIADAS.`
        : `Remover ${c.name}?`;
    if (window.confirm(msg)) {
      del(c.id);
      toast.success('Colaborador removido');
    }
  };

  return (
    <li className="border rounded-2xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {edit ? (
        <div className="flex-1 grid md:grid-cols-3 gap-2">
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Função/Role (opcional)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Email (opcional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      ) : (
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-medium">{c.name}</div>
            <span className="text-xs px-2 py-0.5 rounded-full border">
              {count} atividade{count === 1 ? '' : 's'}
            </span>
          </div>
          <div className="text-sm text-gray-600">{c.role || 'Sem função definida'}</div>
          {c.email && <div className="text-sm text-gray-600">{c.email}</div>}
        </div>
      )}

      <div className="flex items-center gap-2">
        {edit ? (
          <>
            <button className="px-3 py-2 rounded-xl bg-black text-white" onClick={save}>
              Salvar
            </button>
            <button className="px-3 py-2 rounded-xl border" onClick={() => setEdit(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button className="px-3 py-2 rounded-xl border" onClick={() => setEdit(true)}>
              Editar
            </button>
            <button
              className="px-3 py-2 rounded-xl bg-red-600 text-white"
              onClick={onRemove}
              title="Remover colaborador"
            >
              Remover
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export default function Team() {
  const cols = useAppStore((s) => s.collaborators);
  const add = useAppStore((s) => s.addCollaborator);
  const okrs = useAppStore((s) => s.okrs);

  const counts = useAssigneeCounts(okrs);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');

  const canAdd = !!name.trim();

  const handleAdd = () => {
    if (!canAdd) return;
    add(name.trim(), role.trim() || undefined, email.trim() || undefined);
    toast.success('Colaborador adicionado');
    setName('');
    setRole('');
    setEmail('');
  };

  return (
    <section className="space-y-4">
      <header className="grid md:grid-cols-4 gap-2">
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Nome do colaborador *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Função/Role (opcional)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Email (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
          onClick={handleAdd}
          disabled={!canAdd}
        >
          Adicionar
        </button>
      </header>

      <ul className="space-y-3">
        {cols.map((c) => (
          <Row key={c.id} c={c} count={counts.get(c.id) || 0} />
        ))}
        {cols.length === 0 && (
          <li className="text-sm text-gray-500">Nenhum colaborador ainda — adicione acima.</li>
        )}
      </ul>
    </section>
  );
}

