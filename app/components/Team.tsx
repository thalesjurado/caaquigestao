// app/components/Team.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAppStore, Collaborator, OKR } from '../../lib/store-supabase';
import { toast } from '../../lib/toast';
import { 
  hasPermission, 
  getAccessLevelFromPosition, 
  ACCESS_LEVEL_LABELS, 
  SUGGESTED_POSITIONS,
  type AccessLevel 
} from '../../lib/permissions';

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

function Row({ c, count, currentUserAccessLevel }: { c: Collaborator; count: number; currentUserAccessLevel: AccessLevel }) {
  const update = useAppStore((s) => s.updateCollaborator);
  const del = useAppStore((s) => s.deleteCollaborator);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(c.name);
  const [role, setRole] = useState(c.role ?? '');
  const [email, setEmail] = useState(c.email ?? '');
  const [position, setPosition] = useState(c.position ?? '');
  const [hourlyRate, setHourlyRate] = useState(c.hourlyRate?.toString() ?? '');
  
  const canViewHourlyRates = hasPermission(currentUserAccessLevel, 'viewHourlyRates');
  const canEditHourlyRates = hasPermission(currentUserAccessLevel, 'editHourlyRates');

  const save = () => {
    if (!name.trim() || !position.trim()) return;
    
    const accessLevel = getAccessLevelFromPosition(position);
    const updatedData: Partial<Collaborator> = {
      name,
      role,
      email,
      position,
      accessLevel,
    };
    
    // Só inclui hourlyRate se o usuário tem permissão para editá-lo
    if (canEditHourlyRates && hourlyRate.trim()) {
      const rate = parseFloat(hourlyRate);
      if (!isNaN(rate) && rate > 0) {
        updatedData.hourlyRate = rate;
      }
    }
    
    update(c.id, updatedData);
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
        <div className="flex-1 grid md:grid-cols-2 lg:grid-cols-4 gap-2">
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Nome *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="border rounded-xl px-3 py-2"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          >
            <option value="">Selecione o cargo *</option>
            {SUGGESTED_POSITIONS.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Email (opcional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {canEditHourlyRates && (
            <input
              className="border rounded-xl px-3 py-2"
              placeholder="Valor/hora (R$)"
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
          )}
        </div>
      ) : (
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-medium">{c.name}</div>
            <span className="text-xs px-2 py-0.5 rounded-full border">
              {count} atividade{count === 1 ? '' : 's'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              c.accessLevel === 'executive' ? 'bg-purple-100 text-purple-800' :
              c.accessLevel === 'management' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {ACCESS_LEVEL_LABELS[c.accessLevel]}
            </span>
          </div>
          <div className="text-sm text-gray-600">{c.position || 'Cargo não definido'}</div>
          {c.email && <div className="text-sm text-gray-600">{c.email}</div>}
          {canViewHourlyRates && c.hourlyRate && (
            <div className="text-sm text-green-600 font-medium">
              R$ {c.hourlyRate.toFixed(2)}/hora
            </div>
          )}
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
  const loadAllData = useAppStore((s) => s.loadAllData);
  const setCollaborators = useAppStore((s) => s.setCollaborators);

  const counts = useAssigneeCounts(okrs);

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  // Para demonstração, vou assumir que o usuário atual é executive
  // Em uma implementação real, isso viria de um contexto de autenticação
  const currentUserAccessLevel: AccessLevel = 'executive';
  
  const canAdd = !!name.trim() && !!position.trim();
  const canEditHourlyRates = hasPermission(currentUserAccessLevel, 'editHourlyRates');

  const handleAdd = () => {
    if (!canAdd) return;
    
    const accessLevel = getAccessLevelFromPosition(position);
    const newCollaborator: Omit<Collaborator, 'id'> = {
      name: name.trim(),
      role: position.trim(), // Usar position como role por compatibilidade
      email: email.trim() || '',
      position: position.trim(),
      accessLevel,
    };
    
    // Só inclui hourlyRate se o usuário tem permissão e forneceu um valor
    if (canEditHourlyRates && hourlyRate.trim()) {
      const rate = parseFloat(hourlyRate);
      if (!isNaN(rate) && rate > 0) {
        newCollaborator.hourlyRate = rate;
      }
    }
    
    add(newCollaborator);
    toast.success('Colaborador adicionado');
    setName('');
    setPosition('');
    setEmail('');
    setHourlyRate('');
  };

  const debug = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).has('debug'));
  const [debugLS, setDebugLS] = useState<string>('');
  const readLocal = () => {
    try {
      const v = localStorage.getItem('caaqui_collaborators');
      setDebugLS(v || '(vazio)');
    } catch {
      setDebugLS('(erro ao ler localStorage)');
    }
  };
  const forceLoadFromLocal = () => {
    try {
      const raw = localStorage.getItem('caaqui_collaborators');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const data = Array.isArray(parsed?.data) ? parsed.data : [];
      if (Array.isArray(data)) setCollaborators(data as any);
    } catch {}
  };

  // Auto-hidratacao: se após o carregamento global a lista estiver vazia, tenta popular do localStorage
  useEffect(() => {
    if (cols.length === 0) {
      forceLoadFromLocal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols.length]);

  return (
    <section className="space-y-4">
      {debug && (
        <div className="text-xs text-gray-600 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 rounded-full border">Total colaboradores: {cols.length}</span>
            <button
              className="px-2 py-1 rounded border"
              onClick={() => loadAllData()}
              title="Recarregar dados do armazenamento/local/Supabase"
            >
              Recarregar dados
            </button>
            <button
              className="px-2 py-1 rounded border"
              onClick={readLocal}
              title="Ler localStorage (caaqui_collaborators)"
            >
              Ver localStorage
            </button>
            <button
              className="px-2 py-1 rounded border"
              onClick={forceLoadFromLocal}
              title="Forçar carregar do localStorage para o estado"
            >
              Forçar carregar do local
            </button>
          </div>
          {debugLS && (
            <pre className="mt-1 max-h-40 overflow-auto bg-gray-50 p-2 rounded border text-[10px] whitespace-pre-wrap break-all">{debugLS}</pre>
          )}
        </div>
      )}
      <header className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Nome do colaborador *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <select
          className="border rounded-xl px-3 py-2"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        >
          <option value="">Selecione o cargo *</option>
          {SUGGESTED_POSITIONS.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Email (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        {canEditHourlyRates && (
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Valor/hora (R$)"
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        )}
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
          <Row key={c.id} c={c} count={counts.get(c.id) || 0} currentUserAccessLevel={currentUserAccessLevel} />
        ))}
        {cols.length === 0 && (
          <li className="text-sm text-gray-500">Nenhum colaborador ainda — adicione acima.</li>
        )}
      </ul>
    </section>
  );
}

