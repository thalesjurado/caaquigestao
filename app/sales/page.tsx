'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../../lib/store-supabase';
import { toast } from '../../lib/toast';

export default function SalesProjectSheetPage() {
  const router = useRouter();
  const addProject = useAppStore((s) => s.addProject);

  const [projectType, setProjectType] = useState<'tech' | 'growth'>('tech');
  const [ subtype, setSubtype ] = useState<'app' | 'web' | 'crm'>('app');

  // Campos fixos
  const [client, setClient] = useState('');
  const [name, setName] = useState('');
  const [contractValue, setContractValue] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [summary, setSummary] = useState('');
  const [salesOwner, setSalesOwner] = useState('');

  // Campos dinâmicos
  // Implementação APP
  const [appTech, setAppTech] = useState('React Native');
  const [appPlatforms, setAppPlatforms] = useState<string[]>([]); // iOS, Android
  const [appETA, setAppETA] = useState('');

  // Implementação WEB
  const [webStack, setWebStack] = useState('Next.js');
  const [webScope, setWebScope] = useState('');
  const [webIntegrations, setWebIntegrations] = useState<string>('');

  // CRM/Growth
  const [crmStack, setCrmStack] = useState('RD');
  const [crmMainGoal, setCrmMainGoal] = useState('');
  const [crmChannels, setCrmChannels] = useState('');

  const canSave = useMemo(() => {
    if (!client.trim() || !name.trim() || !startDate || !endDate) return false;
    return true;
  }, [client, name, startDate, endDate]);

  const onSubmit = async () => {
    if (!canSave) return;

    // Monta detalhes técnicos/growth conforme seleção
    const descriptionParts: string[] = [];
    if (summary) descriptionParts.push(`Escopo: ${summary}`);
    if (salesOwner) descriptionParts.push(`Responsável de vendas: ${salesOwner}`);

    const budget = contractValue ? Number(contractValue.replace(/[^0-9.,]/g, '').replace(',', '.')) : undefined;

    const base = {
      name: name.trim(),
      client: client.trim(),
      type: projectType,
      status: 'planning' as const,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      description: descriptionParts.join(' \n'),
      budget,
    };

    let payload: any = { ...base };

    if (projectType === 'tech') {
      const techDetails: any = {};
      if (subtype === 'app') {
        techDetails.platform = appPlatforms.join(', ');
        techDetails.integrations = [];
        techDetails.cdpIntegration = undefined;
        techDetails.martechTools = [appTech];
        if (appETA) descriptionParts.push(`Prazo estimado (APP): ${appETA}`);
      } else {
        // web
        techDetails.platform = webStack;
        techDetails.integrations = webIntegrations
          ? webIntegrations.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
        if (webScope) descriptionParts.push(`Escopo WEB: ${webScope}`);
      }
      payload = { ...base, description: descriptionParts.join(' \n'), techDetails };
    } else {
      // growth / CRM
      const growthDetails: any = {
        crmPlatform: crmStack,
        campaignType: crmChannels,
        expectedResults: crmMainGoal,
      };
      payload = { ...base, growthDetails };
    }

    try {
      await addProject(payload);
      toast.success('Projeto criado e marcado como Em Planejamento (PO).');
      router.push('/projects');
    } catch (e) {
      console.error(e);
      toast.error('Falha ao criar o projeto.');
    }
  };

  const platformSelected = (value: string) => {
    setAppPlatforms((prev) => {
      const set = new Set(prev);
      if (set.has(value)) set.delete(value); else set.add(value);
      return Array.from(set);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Ficha de Projeto (Vendas)</h1>
        <p className="text-sm text-gray-600">Registre os detalhes do deal antes de passar para o PO.</p>
      </header>

      <section className="rounded-2xl border bg-white p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Cliente</label>
            <input className="w-full border rounded-xl p-2" value={client} onChange={(e)=>setClient(e.target.value)} placeholder="Cliente" />
          </div>
          <div>
            <label className="block text-sm mb-1">Nome do Projeto</label>
            <input className="w-full border rounded-xl p-2" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Nome interno" />
          </div>
          <div>
            <label className="block text-sm mb-1">Valor do contrato</label>
            <input className="w-full border rounded-xl p-2" value={contractValue} onChange={(e)=>setContractValue(e.target.value)} placeholder="Ex: 120000" />
          </div>
          <div>
            <label className="block text-sm mb-1">Responsável de vendas</label>
            <input className="w-full border rounded-xl p-2" value={salesOwner} onChange={(e)=>setSalesOwner(e.target.value)} placeholder="Nome" />
          </div>
          <div>
            <label className="block text-sm mb-1">Início</label>
            <input type="date" className="w-full border rounded-xl p-2" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Fim</label>
            <input type="date" className="w-full border rounded-xl p-2" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Escopo resumido</label>
            <textarea className="w-full border rounded-xl p-2" rows={3} value={summary} onChange={(e)=>setSummary(e.target.value)} placeholder="Descrição breve do escopo" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 space-y-4">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Área</label>
            <select className="w-full border rounded-xl p-2" value={projectType} onChange={(e)=>setProjectType(e.target.value as any)}>
              <option value="tech">Implementação Tech</option>
              <option value="growth">CRM/Growth</option>
            </select>
          </div>
          {projectType === 'tech' && (
            <div>
              <label className="block text-sm mb-1">Tipo</label>
              <select className="w-full border rounded-xl p-2" value={subtype} onChange={(e)=>setSubtype(e.target.value as any)}>
                <option value="app">Implementação APP</option>
                <option value="web">Implementação WEB</option>
              </select>
            </div>
          )}
          {projectType === 'growth' && (
            <div>
              <label className="block text-sm mb-1">Stack de CRM</label>
              <select className="w-full border rounded-xl p-2" value={crmStack} onChange={(e)=>setCrmStack(e.target.value)}>
                <option>Insider</option>
                <option>RD</option>
                <option>MoEngage</option>
                <option>Salesforce</option>
              </select>
            </div>
          )}
        </div>

        {projectType === 'tech' && subtype === 'app' && (
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Tecnologia</label>
              <select className="w-full border rounded-xl p-2" value={appTech} onChange={(e)=>setAppTech(e.target.value)}>
                <option>React Native</option>
                <option>Flutter</option>
                <option>Kotlin</option>
                <option>Swift</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Plataforma</label>
              <div className="flex gap-3 items-center p-2 border rounded-xl">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={appPlatforms.includes('iOS')} onChange={()=>platformSelected('iOS')} /> iOS
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={appPlatforms.includes('Android')} onChange={()=>platformSelected('Android')} /> Android
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Prazo estimado</label>
              <input className="w-full border rounded-xl p-2" value={appETA} onChange={(e)=>setAppETA(e.target.value)} placeholder="Ex: 12 semanas" />
            </div>
          </div>
        )}

        {projectType === 'tech' && subtype === 'web' && (
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Stack</label>
              <select className="w-full border rounded-xl p-2" value={webStack} onChange={(e)=>setWebStack(e.target.value)}>
                <option>Next.js</option>
                <option>Shopify</option>
                <option>VTEX</option>
                <option>WordPress</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Integrações previstas</label>
              <input className="w-full border rounded-xl p-2" value={webIntegrations} onChange={(e)=>setWebIntegrations(e.target.value)} placeholder="Ex: ERP, Gateway, CDP" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm mb-1">Escopo principal</label>
              <textarea className="w-full border rounded-xl p-2" rows={2} value={webScope} onChange={(e)=>setWebScope(e.target.value)} placeholder="Escopo macro do projeto WEB" />
            </div>
          </div>
        )}

        {projectType === 'growth' && (
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Meta principal</label>
              <input className="w-full border rounded-xl p-2" value={crmMainGoal} onChange={(e)=>setCrmMainGoal(e.target.value)} placeholder="Ex: +20% leads qualificados" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Canais</label>
              <input className="w-full border rounded-xl p-2" value={crmChannels} onChange={(e)=>setCrmChannels(e.target.value)} placeholder="Ex: Email, Push, WhatsApp" />
            </div>
          </div>
        )}
      </section>

      <div className="flex gap-2 justify-end">
        <button className="px-3 py-2 rounded-xl border" onClick={() => router.back()}>Cancelar</button>
        <button
          className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50"
          disabled={!canSave}
          onClick={onSubmit}
        >
          Salvar e enviar ao PO
        </button>
      </div>
    </div>
  );
}
