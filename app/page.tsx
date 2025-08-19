"use client";

/* ---------------- Tipos ---------------- */
type ProjectForm = {
  client: string;
  name: string;
  pillar: string;
  owner: string;
  start: string; // ISO ou vazio
  end: string;   // ISO ou vazio
  health: "Saudável" | "Atenção" | "Risco";
};

type Health = "Saudável" | "Atenção" | "Risco";
type Status = "Backlog" | "A Fazer" | "Em Progresso" | "Em Revisão" | "Concluído";
type Role = "CSM" | "PO" | "CRM" | "Tech" | "App Growth" | "Data";

interface Project {
  id: string;
  name: string;
  client: string;
  owner: string;
  pillar: string; // "CRM" | "Martech" | "Tech" | "App Growth" | "Consultoria"
  health: Health;
  start?: string;
  end?: string;
}

interface Task {
  id: string;
  projectId?: string | null;
  projectName: string;
  client?: string;              // <- usado no seed e no Kanban
  title: string;
  assignee: string;
  role: Role | string;
  status: Status | string;
  points?: number;
  due?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: Role | string;
  weeklyCapacity?: number;
}

interface OKR { id: string; quarter: string; objective: string; keyResults: string[]; }
interface Ritual { id: string; name: string; owner: string; day: string; time: string; }

interface DataModel {
  projects: Project[];
  tasks: Task[];
  team: TeamMember[];
  okrs: OKR[];
  rituals: Ritual[];
}

export const dynamic = "force-dynamic";

/* ---------------- Imports ---------------- */
import React, { useEffect, useMemo, useState } from "react";
import nextDynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Circle, Download, EllipsisVertical, Plus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart } from "recharts";

/* ---------------- Helpers & Consts ---------------- */
const LS_KEY = "caaqui_pm_data_v1";
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = (d?: string | number | Date) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

const roles: string[] = ["CSM", "PO", "CRM", "Tech", "App Growth", "Data"];
const pillars: string[] = ["CRM", "Martech", "Tech", "App Growth", "Consultoria"];
const statuses: string[] = ["Backlog", "A Fazer", "Em Progresso", "Em Revisão", "Concluído"];
const healths: Health[] = ["Saudável", "Atenção", "Risco"];

/* ---------------- Seed ---------------- */
const seed: DataModel = {
  team: [
    { id: uid(), name: "Thales", role: "Vendas/Strategy", weeklyCapacity: 15 },
    { id: uid(), name: "Marlon", role: "CSM", weeklyCapacity: 25 },
    { id: uid(), name: "Davi", role: "Finance/Vendas", weeklyCapacity: 10 },
    { id: uid(), name: "Thiago Gomes", role: "Head Tech", weeklyCapacity: 30 },
    { id: uid(), name: "Tati", role: "CSM", weeklyCapacity: 25 },
    { id: uid(), name: "Thais", role: "App Growth", weeklyCapacity: 25 },
    { id: uid(), name: "Paula", role: "App Growth", weeklyCapacity: 25 },
    { id: uid(), name: "Larissa", role: "CRM", weeklyCapacity: 30 },
  ],
  projects: [
    { id: uid(), client: "Webcontinental", name: "Re-implementação Insider + CRM Ops", pillar: "CRM", owner: "Tati", start: "2025-08-05", end: "2025-10-15", health: "Atenção" },
    { id: uid(), client: "Renova Be (Vitabe)", name: "RFP CRM - Estratégia + Operação Insider", pillar: "CRM", owner: "Marlon", start: "2025-08-01", end: "2025-09-30", health: "Saudável" },
    { id: uid(), client: "JDE Peet's", name: "Proposta CRM + Martech + EcomAudit", pillar: "Consultoria", owner: "Thales", start: "2025-07-27", end: "2025-08-30", health: "Atenção" },
    { id: uid(), client: "Bridge (Produto)", name: "SDK Atribuição + Site + Conteúdo", pillar: "Tech", owner: "Thiago Gomes", start: "2025-07-10", end: "2025-11-30", health: "Saudável" },
    { id: uid(), client: "Aramis", name: "Lançamento E-commerce + MorphoPen", pillar: "Martech", owner: "Thales", start: "2025-07-24", end: "2025-09-15", health: "Atenção" },
    { id: uid(), client: "MPL", name: "Consultoria mídia e RMG (ad networks)", pillar: "Consultoria", owner: "Thales", start: "2025-06-10", end: "2025-12-10", health: "Saudável" },
  ],
  tasks: [
    { id: uid(), projectId: null, projectName: "Re-implementação Insider + CRM Ops", client: "Webcontinental", title: "Auditoria de eventos e tagbook (GA4/MMP)", assignee: "Larissa", role: "CRM", status: "Em Progresso", points: 5, due: "2025-08-22" },
    { id: uid(), projectId: null, projectName: "Re-implementação Insider + CRM Ops", client: "Webcontinental", title: "Warm-up da base + fluxos LGPD", assignee: "Tati", role: "CSM", status: "A Fazer", points: 3, due: "2025-08-25" },
    { id: uid(), projectId: null, projectName: "Re-implementação Insider + CRM Ops", client: "Webcontinental", title: "Mini cart VTEX: mapeamento de eventos", assignee: "Thiago Gomes", role: "Tech", status: "A Fazer", points: 5, due: "2025-08-27" },
    { id: uid(), projectId: null, projectName: "RFP CRM - Estratégia + Operação Insider", client: "Renova Be (Vitabe)", title: "Deck comercial e técnico (versão 1)", assignee: "Marlon", role: "CSM", status: "Em Progresso", points: 3, due: "2025-08-20" },
    { id: uid(), projectId: null, projectName: "RFP CRM - Estratégia + Operação Insider", client: "Renova Be (Vitabe)", title: "Estimativa de esforço + staffing", assignee: "Thales", role: "Vendas/Strategy", status: "A Fazer", points: 2, due: "2025-08-19" },
    { id: uid(), projectId: null, projectName: "SDK Atribuição + Site + Conteúdo", client: "Bridge (Produto)", title: "Deferred deep link: testes Android/iOS", assignee: "Thiago Gomes", role: "Tech", status: "Em Progresso", points: 8, due: "2025-08-29" },
    { id: uid(), projectId: null, projectName: "SDK Atribuição + Site + Conteúdo", client: "Bridge (Produto)", title: "Comparativo MMP vs Bridge (artigo)", assignee: "Thales", role: "Vendas/Strategy", status: "A Fazer", points: 2, due: "2025-08-21" },
    { id: uid(), projectId: null, projectName: "Lançamento E-commerce + MorphoPen", client: "Joy Solutions", title: "Catálogo + SEO + GMC", assignee: "Thales", role: "Vendas/Strategy", status: "Em Progresso", points: 5, due: "2025-08-26" },
    { id: uid(), projectId: null, projectName: "Lançamento E-commerce + MorphoPen", client: "Joy Solutions", title: "Fotos padrão MorphoPen azul (hand model)", assignee: "Thales", role: "Vendas/Strategy", status: "A Fazer", points: 3, due: "2025-08-23" },
  ],
  okrs: [
    { id: uid(), quarter: "2025-Q3", objective: "Consolidar Caaqui como referência em CRM e Martech", keyResults: [
      "Fechar 2 contratos fixos de CRM (R$ 300k/ano cada)",
      "Lançar MVP do EcomAudit com 3 pilotos ativos",
      "Publicar 8 conteúdos do Bridge (blog/cases)"
    ]},
    { id: uid(), quarter: "2025-Q3", objective: "Aumentar eficiência operacional e governança", keyResults: [
      "Utilização média de 75% +/- 10%",
      "NPS > 60 com clientes ativos",
      "Reduzir retrabalho técnico em 30%"
    ]}
  ],
  rituals: [
    { id: uid(), name: "Planning semanal", owner: "CSM/PO", day: "Segunda", time: "10:00" },
    { id: uid(), name: "Daily geral (15min)", owner: "Todos", day: "Diário", time: "09:30" },
    { id: uid(), name: "Tech sync", owner: "Thiago", day: "Terça", time: "15:00" },
    { id: uid(), name: "CRM/Insider ops", owner: "Tati/Larissa", day: "Quarta", time: "11:00" },
    { id: uid(), name: "Check financeiro/comercial", owner: "Thales/Davi", day: "Quinta", time: "16:30" },
  ],
};

/* ---------------- Store local-first ---------------- */
function useStore(): [DataModel, React.Dispatch<React.SetStateAction<DataModel>>] {
  const [data, setData] = useState<DataModel>(seed);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_KEY, JSON.stringify(data));
      }
    } catch {}
  }, [data]);

  return [data, setData];
}

/* ---------------- UI Blocks ---------------- */
function Stat(
  { label, value, sub }: { label: string; value: string | number | React.ReactNode; sub?: string | React.ReactNode }
) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function HealthPill({ h }: { h: Health }) {
  const map: Record<Health, string> = {
    "Saudável": "bg-emerald-100 text-emerald-700",
    "Atenção": "bg-amber-100 text-amber-700",
    "Risco": "bg-red-100 text-red-700",
  };
  return <span className={`px-2 py-1 rounded-full text-xs ${map[h]}`}>{h}</span>;
}

function ProjectRow({ p, onMenu }: { p: Project; onMenu: (action: "edit" | "delete", p: Project) => void }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{p.client}</TableCell>
      <TableCell>{p.name}</TableCell>
      <TableCell><Badge variant="secondary">{p.pillar}</Badge></TableCell>
      <TableCell>{p.owner}</TableCell>
      <TableCell>{fmtDate(p.start)} → {fmtDate(p.end)}</TableCell>
      <TableCell><HealthPill h={p.health} /></TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost"><EllipsisVertical className="w-4 h-4"/></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onMenu("edit", p)}>Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMenu("delete", p)} className="text-rose-600">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function AddProjectDialog({ onAdd }: { onAdd: (p: Project) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProjectForm>({
    client: "",
    name: "",
    pillar: "CRM",
    owner: "",
    start: "",
    end: "",
    health: "Saudável",
  });

  const update = <K extends keyof ProjectForm>(k: K, v: ProjectForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="w-4 h-4"/> Novo projeto</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader><DialogTitle>Novo projeto</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Cliente</Label>
            <Input value={form.client} onChange={(e) => update("client", e.target.value)} placeholder="Ex.: Aramis, Dr. Consulta"/>
          </div>
          <div>
            <Label>Pilar</Label>
            <Select value={form.pillar} onValueChange={(v) => update("pillar", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{pillars.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Nome do projeto</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex.: Implementação Insider + CRM"/>
          </div>
          <div>
            <Label>Owner</Label>
            <Input value={form.owner} onChange={(e) => update("owner", e.target.value)} placeholder="Ex.: Tati"/>
          </div>
          <div>
            <Label>Saúde</Label>
            <Select value={form.health} onValueChange={(v: Health) => update("health", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{healths.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Início</Label>
            <Input type="date" value={form.start} onChange={(e) => update("start", e.target.value)} />
          </div>
          <div>
            <Label>Fim</Label>
            <Input type="date" value={form.end} onChange={(e) => update("end", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => { onAdd({ id: uid(), ...form }); setOpen(false); }}>Criar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddTaskDialog({ projects, onAdd }: { projects: Project[]; onAdd: (t: Task) => void }) {
  const [open, setOpen] = useState(false);

  type TaskForm = {
    projectName: string;
    client: string;
    title: string;
    assignee: string;
    role: string;
    status: string;
    points: number;
    due: string;
  };

  const [form, setForm] = useState<TaskForm>({
    projectName: "",
    client: "",
    title: "",
    assignee: "",
    role: "CRM",
    status: "A Fazer",
    points: 3,
    due: "",
  });

  const update = <K extends keyof TaskForm>(k: K, v: TaskForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.projectName) {
      const p = projects.find((x) => x.name === form.projectName);
      if (p) update("client", p.client);
    }
    // eslint-disable-next-line
  }, [form.projectName]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Plus className="w-4 h-4"/> Nova tarefa</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Projeto</Label>
            <Select value={form.projectName} onValueChange={(v) => update("projectName", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um projeto"/></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.name}>{p.client} — {p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Ex.: Configurar warm-up e fluxos LGPD"/>
          </div>
          <div>
            <Label>Responsável</Label>
            <Input value={form.assignee} onChange={(e) => update("assignee", e.target.value)} placeholder="Ex.: Larissa"/>
          </div>
          <div>
            <Label>Função</Label>
            <Select value={form.role} onValueChange={(v) => update("role", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Pontos (esforço)</Label>
            <Input type="number" value={form.points} onChange={(e) => update("points", Number(e.target.value))} />
          </div>
          <div>
            <Label>Prazo</Label>
            <Input type="date" value={form.due} onChange={(e) => update("due", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => { onAdd({ id: uid(), ...form }); setOpen(false); }}>Criar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Kanban ---------------- */
function Kanban({
  tasks,
  setTasks,
}: {
  tasks: Task[];
  setTasks: (updater: Task[] | ((t: Task[]) => Task[])) => void;
}) {
  const columns = statuses as (Status | string)[];

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, status: Status | string) => {
    const id = e.dataTransfer.getData("text/plain");
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  return (
    <div className="grid md:grid-cols-5 gap-3">
      {columns.map((col) => (
        <div
          key={String(col)}
          className="bg-muted/40 rounded-2xl p-3 min-h-[320px]"
          onDrop={(e) => onDrop(e, col)}
          onDragOver={onDragOver}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">{col}</div>
            <Badge variant="outline">
              {tasks.filter((t) => t.status === col).length}
            </Badge>
          </div>
          <div className="space-y-2">
            {tasks
              .filter((t) => t.status === col)
              .map((t) => (
                <Card
                  key={t.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, t.id)}
                  className="rounded-xl"
                >
                  <CardContent className="p-3">
                    <div className="text-sm font-medium leading-tight">
                      {t.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.client} • {t.projectName}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary">{t.role}</Badge>
                        <span className="text-muted-foreground">
                          {t.assignee}
                        </span>
                      </div>
                      <div className="text-xs">
                        {t.points} pts • {t.due ? fmtDate(t.due) : "sem prazo"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Outras seções ---------------- */
function Utilization({ team, tasks }: { team: TeamMember[]; tasks: Task[] }) {
  const weeklyByPerson = useMemo(() => {
    const map: Record<string, { capacity: number; load: number }> = {};
    team.forEach((m) => (map[m.name] = { capacity: m.weeklyCapacity || 20, load: 0 }));
    tasks.forEach((t) => { if (map[t.assignee]) map[t.assignee].load += t.points || 0; });
    return map;
  }, [team, tasks]);

  return (
    <Card className="rounded-2xl">
      <CardHeader><CardTitle>Utilização por pessoa (pontos/semana)</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(weeklyByPerson).map(([name, v]) => {
          const pct = Math.min(100, Math.round((v.load / v.capacity) * 100));
          return (
            <div key={name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{name}</span>
                <span className="text-muted-foreground">{v.load} / {v.capacity} pts • {pct}%</span>
              </div>
              <Progress value={pct} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function VelocityChart() {
  const weeks = ["Sem-4", "Sem-3", "Sem-2", "Sem-1", "Esta"];
  const data = weeks.map((w, i) => ({ week: w, points: Math.max(0, 10 + i * 3 - (i === 4 ? 2 : 0)) }));
  return (
    <Card className="rounded-2xl">
      <CardHeader><CardTitle>Velocidade (pontos/semana)</CardTitle></CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="points" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function RoleUtilBar({ team, tasks }: { team: TeamMember[]; tasks: Task[] }) {
  const roleCap = useMemo(() => {
    const agg: Record<string, { cap: number; load: number }> = {};
    team.forEach((m) => {
      const r = (m.role || "Outro").split("/")[0];
      agg[r] = agg[r] || { cap: 0, load: 0 };
      agg[r].cap += m.weeklyCapacity || 20;
    });
    tasks.forEach((t) => {
      const r = (t.role || "Outro").split("/")[0];
      agg[r] = agg[r] || { cap: 0, load: 0 };
      agg[r].load += t.points || 0;
    });
    return Object.entries(agg).map(([role, v]) => ({ role, cap: v.cap, load: v.load }));
  }, [team, tasks]);

  return (
    <Card className="rounded-2xl">
      <CardHeader><CardTitle>Utilização por função</CardTitle></CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={roleCap}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="role" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="cap" fillOpacity={0.2} />
            <Bar dataKey="load" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ImportExport({ data, setData }: { data: DataModel; setData: React.Dispatch<React.SetStateAction<DataModel>> }) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => { setJson(JSON.stringify(data, null, 2)); setOpen(true); }}
        className="gap-2"
      >
        <Download className="w-4 h-4" /> Exportar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader><DialogTitle>Exportar/Importar JSON</DialogTitle></DialogHeader>
          <Textarea className="h-72 font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} />
          <div className="flex justify-between">
            <div className="text-xs text-muted-foreground">Copie/cole para backup. Para importar, cole um JSON válido e clique em Importar.</div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Fechar</Button>
              <Button onClick={() => { try { const obj = JSON.parse(json) as DataModel; setData(obj); setOpen(false); } catch { alert("JSON inválido"); } }}>Importar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Página ---------------- */
function CaaquiProjectOps() {
  const [data, setData] = useStore();
  const [q, setQ] = useState("");

  const filteredProjects = useMemo(() => {
    const s = q.toLowerCase();
    return data.projects.filter((p) => [p.client, p.name, p.pillar, p.owner].join(" ").toLowerCase().includes(s));
  }, [data.projects, q]);

  const activeTasks = useMemo(() => data.tasks || [], [data.tasks]);

  const kpis = useMemo(() => {
    const total = data.projects.length;
    const risk = data.projects.filter((p) => p.health === "Risco").length;
    const attention = data.projects.filter((p) => p.health === "Atenção").length;
    const healthy = total - risk - attention;
    const onTime = Math.round(((healthy + attention * 0.5) / Math.max(1, total)) * 100);
    const done = activeTasks.filter((t) => t.status === "Concluído").length;
    const atRiskPct = Math.round(((risk + attention) / Math.max(1, total)) * 100);
    return { total, onTime, atRiskPct, done };
  }, [data.projects, activeTasks]);

  const handleProjectMenu = (action: "edit" | "delete", p: Project) => {
    if (action === "delete") {
      if (confirm("Excluir este projeto?")) {
        setData((d) => ({ ...d, projects: d.projects.filter((x) => x.id !== p.id) }));
      }
    }
    if (action === "edit") {
      const name = prompt("Novo nome do projeto:", p.name) || p.name;
      const owner = prompt("Owner:", p.owner) || p.owner;
      const health = (prompt("Saúde (Saudável/Atenção/Risco):", p.health) || p.health) as Health;
      setData((d) => ({
        ...d,
        projects: d.projects.map((x) => (x.id === p.id ? { ...x, name, owner, health } : x)),
      }));
    }
  };

  const setTasks = (updater: Task[] | ((prev: Task[]) => Task[])) =>
    setData((d) => ({ ...d, tasks: typeof updater === "function" ? (updater as (p: Task[]) => Task[])(d.tasks) : updater }));

  return (
    <div className="p-6 md:p-10 bg-background text-foreground min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Caaqui ProjectOps (MVP)</h1>
            <p className="text-sm text-muted-foreground">Sistema leve para governança de projetos, squads e OKRs — feito sob medida para a Caaqui.</p>
          </div>
          <div className="flex items-center gap-2">
            <ImportExport data={data} setData={setData} />
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-5">
          <TabsList className="grid grid-cols-5 md:w-[680px]">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="projects">Projetos</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="okrs">OKRs & Rituais</TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-5">
            <div className="grid md:grid-cols-4 gap-4">
              <Stat label="Projetos ativos" value={kpis.total} />
              <Stat label="No prazo (proxy)" value={`${kpis.onTime}%`} sub="Saudável + 50% Atenção" />
              <Stat label="Risco/Atenção" value={`${kpis.atRiskPct}%`} sub="% dos projetos" />
              <Stat label="Tarefas concluídas" value={kpis.done} />
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <VelocityChart />
              <RoleUtilBar team={data.team} tasks={activeTasks} />
            </div>
            <Utilization team={data.team} tasks={activeTasks} />
          </TabsContent>

          {/* PROJECTS */}
          <TabsContent value="projects" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Input placeholder="Buscar por cliente, projeto, owner..." value={q} onChange={(e) => setQ(e.target.value)} className="w-full md:w-[380px]"/>
              </div>
              <div className="flex gap-2">
                <AddTaskDialog projects={data.projects} onAdd={(t)=> setTasks((ts)=> [ { ...t, id: uid() }, ...ts ])} />
                <AddProjectDialog onAdd={(p) => setData((d) => ({ ...d, projects: [p, ...d.projects] }))} />
              </div>
            </div>

            <Card className="rounded-2xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Pilar</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Janela</TableHead>
                    <TableHead>Saúde</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((p) => (
                    <ProjectRow key={p.id} p={p} onMenu={handleProjectMenu} />
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* BOARD */}
          <TabsContent value="board" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Arraste as cartas entre colunas para mudar o status.</div>
              <AddTaskDialog projects={data.projects} onAdd={(t)=> setTasks((ts)=> [ { ...t, id: uid() }, ...ts ])} />
            </div>
            <Kanban tasks={activeTasks} setTasks={setTasks} />
          </TabsContent>

          {/* TEAM */}
          <TabsContent value="team" className="space-y-4">
            <Card className="rounded-2xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Capacidade/semana</TableHead>
                    <TableHead>Carga atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.team.map((m) => {
                    const load = data.tasks.filter((t) => t.assignee === m.name).reduce((a, b) => a + (b.points || 0), 0);
                    const pct = Math.min(100, Math.round((load / (m.weeklyCapacity || 20)) * 100));
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>{m.role}</TableCell>
                        <TableCell>{m.weeklyCapacity} pts</TableCell>
                        <TableCell className="w-[320px]">
                          <div className="flex items-center justify-between text-xs mb-1"><span>{load} pts</span><span>{pct}%</span></div>
                          <Progress value={pct} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* OKRs & RITUAIS */}
          <TabsContent value="okrs" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {data.okrs.map((o) => (
                <Card key={o.id} className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="secondary">{o.quarter}</Badge>
                      <span>{o.objective}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {o.keyResults.map((kr, i) => <li key={i}>{kr}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Rituais</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ritual</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Quando</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rituals.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{r.owner}</TableCell>
                        <TableCell>{r.day} — {r.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
          <Circle className="w-3 h-3"/> <span>MVP local-first: dados salvos no seu navegador. Use Exportar para backup/compartilhar.</span>
        </div>
      </div>
    </div>
  );
}

/* --------- Export com noSSR para evitar erro de localStorage no build --------- */
export default nextDynamic(() => Promise.resolve(CaaquiProjectOps), { ssr: false });
