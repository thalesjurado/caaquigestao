'use client';

import { useEffect, useState } from 'react';
import { useAppStore, Ritual } from '../../lib/store-supabase';
import { toast } from '../../lib/toast';

function RitualItem({ ritual }: { ritual: Ritual }) {
  const [notes, setNotes] = useState(ritual.content ?? '');
  const update = useAppStore((s) => s.updateRitual);
  const deleteRitual = useAppStore((s) => s.deleteRitual);
  const projects = useAppStore((s) => s.projects);

  useEffect(() => {
    setNotes(ritual.content ?? '');
  }, [ritual.content]);

  const save = () => {
    update(ritual.id, { content: notes });
    toast.success('Notas do ritual salvas');
  };

  const exportMarkdown = () => {
    const lines = [
      `# ${ritual.title}`,
      '',
      `${new Date().toLocaleString()}`,
      '',
      notes || ''
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ritual.title.replace(/[^a-z0-9-_]+/gi, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Ata exportada em .md');
  };

  const exportPdf = () => {
    const title = ritual.title;
    const date = new Date().toLocaleString();
    const content = (notes || '').replace(/\n/g, '<br/>');
    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title} - Ata</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111; }
            h1 { margin: 0 0 8px; font-size: 20px; }
            .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
            .content { font-size: 14px; line-height: 1.5; white-space: normal; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">${date}</div>
          <div class="content">${content}</div>
          <script>window.onload = () => { window.print(); }<\/script>
        </body>
      </html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="rounded-2xl border p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{ritual.title}</h3>
        <button
          className="text-red-600 text-sm hover:underline"
          onClick={() => {
            deleteRitual(ritual.id);
            toast.success('Ritual excluído');
          }}
          title="Excluir ritual"
        >
          Excluir
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="text-xs text-gray-600">Projeto</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={ritual.projectId || ''}
          onChange={(e) => {
            const value = e.target.value || undefined;
            update(ritual.id, { projectId: value });
            toast.success('Ritual vinculado ao projeto');
          }}
        >
          <option value="">Sem projeto</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
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
        <button
          className="border rounded px-3 py-1 text-sm"
          onClick={exportMarkdown}
        >
          Exportar .md
        </button>
        <button
          className="border rounded px-3 py-1 text-sm"
          onClick={exportPdf}
        >
          Exportar .pdf
        </button>
      </div>
    </div>
  );
}

export default function Rituais() {
  const rituals = useAppStore((s) => s.rituals);
  const projects = useAppStore((s) => s.projects);
  const addRitual = useAppStore((s) => s.addRitual);

  const [title, setTitle] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  const onAdd = () => {
    if (!title.trim()) return;
    addRitual(title);
    toast.success('Ritual adicionado');
    setTitle('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600">Filtrar por projeto:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">Todos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

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
        {rituals
          .filter((r) => !projectFilter || r.projectId === projectFilter)
          .map((r) => (
          <RitualItem key={r.id} ritual={r} />
        ))}
      </div>

      {rituals.length === 0 && (
        <p className="text-sm text-gray-500">Nenhum ritual criado ainda.</p>
      )}
    </div>
  );
}
