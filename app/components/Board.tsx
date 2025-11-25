'use client';
import { useMemo, useState } from 'react';
import { useAppStore, BoardActivity } from '../../lib/store-supabase';
import { toast } from '../../lib/toast';
import ProjectModal from './ProjectModal';
import DataSync from './DataSync';

const COLUMNS: { key: BoardActivity['status']; title: string }[] = [
  { key: 'backlog', title: 'Backlog' },
  { key: 'todo', title: 'A Fazer' },
  { key: 'doing', title: 'Em Progresso' },
  { key: 'done', title: 'Concluído' },
  { key: 'historical', title: 'Projetos Históricos' },
];

// function fmtDate(iso?: string) {
//   if (!iso) return '';
//   try {
//     return new Date(iso).toLocaleDateString('pt-BR');
//   } catch {
//     return iso;
//   }
// }

export default function Board() {
  const { boardActivities, collaborators, projects, addBoardActivity, updateBoardActivity, deleteBoardActivity } = useAppStore(s => ({
    boardActivities: s.boardActivities,
    collaborators: s.collaborators,
    projects: s.projects,
    addBoardActivity: s.addBoardActivity,
    updateBoardActivity: s.updateBoardActivity,
    deleteBoardActivity: s.deleteBoardActivity,
  }));

  const [clientFilter, setClientFilter] = useState<string>('');

  // Modal de projeto
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Novo card
  const [openNew, setOpenNew] = useState(false);
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [client, setClient] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [subtasks, setSubtasks] = useState<string[]>(['']);

  // Modal de edição
  const [editingCard, setEditingCard] = useState<BoardActivity | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState<string>('');
  const [editClient, setEditClient] = useState('');
  const [editProjectId, setEditProjectId] = useState<string>('');
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
    addBoardActivity(title.trim(), {
      status: 'backlog',
      assigneeId: assigneeId || undefined,
      client: client || undefined,
      projectId: projectId || undefined,
      subtasks: validSubtasks.length > 0 ? validSubtasks : undefined,
    });
    toast.success('Tarefa adicionada com sucesso!');
    setTitle('');
    setAssigneeId('');
    setClient('');
    setProjectId('');
    setSubtasks(['']);
    setOpenNew(false);
  };

  const openEditModal = (card: BoardActivity) => {
    setEditingCard(card);
    setEditTitle(card.title);
    setEditAssigneeId(card.assigneeId || '');
    setEditClient(card.client || '');
    setEditProjectId(card.projectId || '');
    setEditSubtasks(card.subtasks && card.subtasks.length > 0 ? card.subtasks : ['']);
  };

  const closeEditModal = () => {
    setEditingCard(null);
    setEditTitle('');
    setEditAssigneeId('');
    setEditClient('');
    setEditProjectId('');
    setEditSubtasks(['']);
  };

  const saveEdit = () => {
    if (!editingCard || !editTitle.trim()) return;
    const validSubtasks = editSubtasks.filter(s => s.trim().length > 0);
    updateBoardActivity(editingCard.id, {
      title: editTitle.trim(),
      assigneeId: editAssigneeId || undefined,
      client: editClient || undefined,
      projectId: editProjectId || undefined,
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
    updateBoardActivity(id, { status });
    toast.success(`Tarefa movida para ${COLUMNS.find(c => c.key === status)?.title}`);
  };

  // Filtrar atividades por cliente
  const filteredActivities = useMemo(() => {
    if (!clientFilter) return boardActivities;
    return boardActivities.filter(activity => 
      activity.client?.toLowerCase().includes(clientFilter.toLowerCase()) ||
      (!activity.client && clientFilter === 'sem-cliente')
    );
  }, [boardActivities, clientFilter]);

  // Obter lista única de clientes
  const availableClients = useMemo(() => {
    const clients = new Set<string>();
    boardActivities.forEach(activity => {
      if (activity.client) {
        clients.add(activity.client);
      }
    });
    return Array.from(clients).sort();
  }, [boardActivities]);

  const byCol = useMemo(() => {
    const map: Record<BoardActivity['status'], BoardActivity[]> = {
      backlog: [],
      todo: [],
      doing: [],
      done: [],
      historical: [],
    };
    for (const a of filteredActivities) {
      const status: BoardActivity['status'] = a.status || 'backlog';
      if (!map[status]) {
        map[status] = [];
      }
      map[status].push(a);
    }
    return map;
  }, [filteredActivities]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Arraste as cartas entre colunas para mudar o status.
          </div>
          
          {/* Filtro por Cliente */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filtrar por cliente:</label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="border rounded-lg px-3 py-1 text-sm"
            >
              <option value="">Todos os clientes</option>
              {availableClients.map(client => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
              <option value="sem-cliente">Sem cliente</option>
            </select>
            
            {clientFilter && (
              <button
                onClick={() => setClientFilter('')}
                className="text-xs text-gray-500 hover:text-gray-700"
                title="Limpar filtro"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Indicador de filtro ativo */}
          {clientFilter && (
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Filtrado: {clientFilter === 'sem-cliente' ? 'Sem cliente' : clientFilter}
              ({filteredActivities.length} tarefa{filteredActivities.length !== 1 ? 's' : ''})
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-xl border border-blue-500 text-blue-500 hover:bg-blue-50"
            onClick={() => setShowProjectModal(true)}
          >
            + Novo Projeto
          </button>
          <button
            className="px-3 py-2 rounded-xl bg-black text-white"
            onClick={() => setOpenNew((v) => !v)}
          >
            + Nova tarefa
          </button>
        </div>
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
              placeholder="Cliente/Projeto"
              value={client}
              onChange={(e) => {
                setClient(e.target.value);
                // Auto-seleciona projeto se existe um com mesmo nome do cliente
                const matchingProject = projects.find(p => p.client === e.target.value || p.name === e.target.value);
                if (matchingProject) {
                  setProjectId(matchingProject.id);
                }
              }}
            />
            <select
              className="border rounded-xl p-2"
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
            <select
              className="border rounded-xl p-2"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Sem projeto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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
                            deleteBoardActivity(a.id);
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

      <DataSync />

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
              <select
                className="border rounded-xl p-2"
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
              <select
                className="border rounded-xl p-2"
                value={editProjectId}
                onChange={(e) => setEditProjectId(e.target.value)}
              >
                <option value="">Sem projeto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
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

      {/* Modal de Projeto */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSuccess={() => {
          setShowProjectModal(false);
          toast.success('Projeto criado! Agora você pode vinculá-lo às tarefas.');
        }}
      />
    </div>
  );
}
