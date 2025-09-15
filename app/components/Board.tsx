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
  const [subtasks, setSubtasks] = useState<string[]>(['']);

  // Modal de edição
  const [editingCard, setEditingCard] = useState<BoardActivity | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPoints, setEditPoints] = useState<number | ''>('');
  const [editAssigneeId, setEditAssigneeId] = useState<string>('');
  const [editClient, setEditClient] = useState('');
  const [editSubtasks, setEditSubtasks] = useState<string[]>(['']);

  const canAdd = title.trim().length > 0;

  const addSubtask = () => {
    setSubtasks([...subtasks, '']);
  };

  const updateSubtask = (index: number, value: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = value;
    setSubtasks(newSubtasks);
  };

  const removeSubtask = (index: number) => {
    if (subtasks.length > 1) {
      setSubtasks(subtasks.filter((_, i) => i !== index));
    }
  };

  const onAdd = () => {
    if (!canAdd) return;
    const validSubtasks = subtasks.filter(s => s.trim().length > 0);
    add(title.trim(), {
      status: 'todo',
      points: typeof points === 'number' ? points : undefined,
      assigneeId: assigneeId || undefined,
      client: client || undefined,
      subtasks: validSubtasks.length > 0 ? validSubtasks : undefined,
    });
    toast.success('Tarefa adicionada com sucesso!');
    setTitle('');
    setPoints('');
    setAssigneeId('');
    setClient('');
    setSubtasks(['']);
    setOpenNew(false);
  };

  const openEditModal = (card: BoardActivity) => {
    setEditingCard(card);
    setEditTitle(card.title);
    setEditPoints(card.points || '');
    setEditAssigneeId(card.assigneeId || '');
    setEditClient(card.client || '');
    setEditSubtasks(card.subtasks && card.subtasks.length > 0 ? card.subtasks : ['']);
  };

  const closeEditModal = () => {
    setEditingCard(null);
    setEditTitle('');
    setEditPoints('');
    setEditAssigneeId('');
    setEditClient('');
    setEditSubtasks(['']);
  };

  const saveEdit = () => {
    if (!editingCard || !editTitle.trim()) return;
    const validSubtasks = editSubtasks.filter(s => s.trim().length > 0);
    updateActivity(editingCard.id, {
      title: editTitle.trim(),
      points: typeof editPoints === 'number' ? editPoints : undefined,
      assigneeId: editAssigneeId || undefined,
      client: editClient || undefined,
      subtasks: validSubtasks.length > 0 ? validSubtasks : undefined,
    });
    toast.success('Tarefa atualizada com sucesso!');
    closeEditModal();
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
          
          {/* Subtarefas */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtarefas (opcional)
            </label>
            <div className="space-y-2">
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className="flex-1 border rounded-xl p-2 text-sm"
                    placeholder={`Subtarefa ${index + 1}`}
                    value={subtask}
                    onChange={(e) => updateSubtask(index, e.target.value)}
                  />
                  {subtasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubtask(index)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSubtask}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Adicionar subtarefa
              </button>
            </div>
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
                      {a.subtasks && a.subtasks.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {a.subtasks.map((subtask, idx) => (
                            <div key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                              {subtask}
                            </div>
                          ))}
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
                          onClick={() => openEditModal(a)}
                          className="ml-auto px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          Editar
                        </button>
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

      {/* Modal de Edição */}
      {editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Editar Tarefa</h3>
            
            <div className="grid md:grid-cols-6 gap-3 mb-4">
              <input
                className="md:col-span-2 border rounded-xl p-2"
                placeholder="Título *"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <input
                className="border rounded-xl p-2"
                placeholder="Cliente"
                value={editClient}
                onChange={(e) => setEditClient(e.target.value)}
              />
              <div className="flex gap-3">
                <input
                  className="w-24 border rounded-xl p-2"
                  type="number"
                  min={0}
                  placeholder="pts"
                  value={editPoints}
                  onChange={(e) => setEditPoints(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <select
                className="border rounded-xl p-2 md:col-span-2"
                value={editAssigneeId}
                onChange={(e) => setEditAssigneeId(e.target.value)}
              >
                <option value="">Sem owner</option>
                {collaborators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subtarefas no Modal de Edição */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtarefas
              </label>
              <div className="space-y-2">
                {editSubtasks.map((subtask, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      className="flex-1 border rounded-xl p-2 text-sm"
                      placeholder={`Subtarefa ${index + 1}`}
                      value={subtask}
                      onChange={(e) => {
                        const newSubtasks = [...editSubtasks];
                        newSubtasks[index] = e.target.value;
                        setEditSubtasks(newSubtasks);
                      }}
                    />
                    {editSubtasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (editSubtasks.length > 1) {
                            setEditSubtasks(editSubtasks.filter((_, i) => i !== index));
                          }
                        }}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEditSubtasks([...editSubtasks, ''])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Adicionar subtarefa
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button 
                className="px-3 py-2 rounded-xl border" 
                onClick={closeEditModal}
              >
                Cancelar
              </button>
              <button
                className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50"
                onClick={saveEdit}
                disabled={!editTitle.trim()}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
