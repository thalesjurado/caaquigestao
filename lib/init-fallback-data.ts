'use client';

// Dados de exemplo para projects e project_allocations quando Supabase não tem as tabelas
export const initializeFallbackData = () => {
  // Verifica se já existem dados no localStorage
  const existingProjects = localStorage.getItem('caaqui_projects');
  const existingAllocations = localStorage.getItem('caaqui_project_allocations');

  if (!existingProjects) {
    const sampleProjects = [
      {
        id: 'proj-1',
        name: 'Implementação CDP Cliente A',
        client: 'Cliente A',
        type: 'tech_implementation',
        status: 'active',
        start_date: '2025-01-15T00:00:00Z',
        end_date: '2025-12-15T00:00:00Z',
        description: 'Implementação completa do Customer Data Platform',
        budget: 50000,
        tech_details: {
          sdkType: 'JavaScript SDK',
          cdpIntegration: 'Segment',
          martechTools: ['Google Analytics', 'HubSpot', 'Mailchimp']
        },
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'proj-2',
        name: 'Campanha Growth Cliente B',
        client: 'Cliente B',
        type: 'growth_agency',
        status: 'planning',
        start_date: '2025-02-01T00:00:00Z',
        end_date: '2026-01-30T00:00:00Z',
        description: 'Estratégia completa de growth marketing',
        budget: 30000,
        growth_details: {
          crmPlatform: 'Salesforce',
          campaignType: 'Lead Generation',
          expectedResults: 'Aumentar leads qualificados em 150%'
        },
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'proj-3',
        name: 'Projeto Anual Cliente C',
        client: 'Cliente C',
        type: 'tech_implementation',
        status: 'active',
        start_date: '2025-03-01T00:00:00Z',
        end_date: '2026-03-01T00:00:00Z',
        description: 'Projeto de longo prazo com duração anual',
        budget: 75000,
        tech_details: {
          sdkType: 'React Native SDK',
          cdpIntegration: 'Adobe Experience Platform',
          martechTools: ['Adobe Analytics', 'Salesforce', 'Marketo']
        },
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ];

    localStorage.setItem('caaqui_projects', JSON.stringify(sampleProjects));
    console.log('📦 Dados de exemplo de projects criados no localStorage');
  }

  if (!existingAllocations) {
    const sampleAllocations = [
      {
        id: 'alloc-1',
        project_id: 'proj-1',
        collaborator_id: 'collab-1',
        percentage: 60,
        role: 'Tech Lead',
        start_date: '2025-01-15T00:00:00Z',
        end_date: '2025-12-15T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'alloc-2',
        project_id: 'proj-1',
        collaborator_id: 'collab-2',
        percentage: 40,
        role: 'Developer',
        start_date: '2025-01-15T00:00:00Z',
        end_date: '2025-12-15T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'alloc-3',
        project_id: 'proj-2',
        collaborator_id: 'collab-3',
        percentage: 80,
        role: 'Growth Manager',
        start_date: '2025-02-01T00:00:00Z',
        end_date: '2026-01-30T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'alloc-4',
        project_id: 'proj-3',
        collaborator_id: 'collab-1',
        percentage: 30,
        role: 'Senior Developer',
        start_date: '2025-03-01T00:00:00Z',
        end_date: '2026-03-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'alloc-5',
        project_id: 'proj-3',
        collaborator_id: 'collab-2',
        percentage: 50,
        role: 'Full Stack Developer',
        start_date: '2025-03-01T00:00:00Z',
        end_date: '2026-03-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ];

    localStorage.setItem('caaqui_project_allocations', JSON.stringify(sampleAllocations));
    console.log('📦 Dados de exemplo de project_allocations criados no localStorage');
  }
};
