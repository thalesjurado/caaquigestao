#!/usr/bin/env node
/* eslint-disable no-console */
// Load env from .env.local if available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv may not be installed; we'll proceed and fail gracefully if envs are missing
}
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || key === 'your-anon-key') {
    console.error(JSON.stringify({ ok: false, error: 'Supabase env vars missing or placeholder key', url_present: !!url, key_present: !!key }));
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const ids = {
    colId: randomUUID(),
    projId: randomUUID(),
    allocId: randomUUID(),
    taskId: randomUUID(),
    okrId: randomUUID(),
    ritualId: randomUUID(),
  };

  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const out = { steps: [], ids };

  try {
    // simple head select to test connection
    const { error: headErr } = await supabase.from('board_activities').select('id', { count: 'exact', head: true });
    if (headErr && !(`${headErr.message}`.includes('does not exist'))) {
      throw headErr;
    }
    out.steps.push({ testConnection: headErr ? 'table-missing-or-empty' : 'ok' });

    // collaborator
    let { data: col, error: colErr } = await supabase
      .from('collaborators')
      .insert([{ id: ids.colId, name: 'Diag Tester', email: `diag_${ids.colId}@caaqui.com`, role: 'QA' }])
      .select('id,name,email,role')
      .single();
    if (colErr) throw colErr;
    out.steps.push({ createCollaborator: col });

    // project
    let { data: proj, error: projErr } = await supabase
      .from('projects')
      .insert([{ id: ids.projId, name: 'Diag Project', client: 'Diag Client', type: 'tech_implementation', status: 'planning', start_date: now.toISOString(), end_date: in7.toISOString(), description: 'Projeto de diagnóstico' }])
      .select('*')
      .single();
    if (projErr) throw projErr;
    out.steps.push({ createProject: proj });

    // allocation
    let { data: alloc, error: allocErr } = await supabase
      .from('project_allocations')
      .insert([{ id: ids.allocId, project_id: ids.projId, collaborator_id: ids.colId, percentage: 50, role: 'QA', start_date: now.toISOString(), end_date: in7.toISOString() }])
      .select('*')
      .single();
    if (allocErr) throw allocErr;
    out.steps.push({ createAllocation: alloc });

    // board activity
    let { data: task, error: taskErr } = await supabase
      .from('board_activities')
      .insert([{ id: ids.taskId, title: 'Diag Task', status: 'todo', assignee_id: ids.colId, description: 'Tarefa de diagnóstico', client: 'Diag Client', points: 1, subtasks: [] }])
      .select('*')
      .single();
    if (taskErr) throw taskErr;
    out.steps.push({ createBoardActivity: task });

    // okr
    let { data: okr, error: okrErr } = await supabase
      .from('okrs')
      .insert([{ id: ids.okrId, title: 'Diag OKR', description: 'Validar fluxo end-to-end', progress: 0, activities: [] }])
      .select('*')
      .single();
    if (okrErr) throw okrErr;
    out.steps.push({ createOKR: okr });

    // ritual
    let { data: ritual, error: ritualErr } = await supabase
      .from('rituals')
      .insert([{ id: ids.ritualId, title: 'Diag Ritual', content: 'Ritual de diagnóstico' }])
      .select('*')
      .single();
    if (ritualErr) throw ritualErr;
    out.steps.push({ createRitual: ritual });

    // reads
    const [projects, allocationsForProject, collaborators, board, okrs, rituals] = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('project_allocations').select('*').eq('project_id', ids.projId),
      supabase.from('collaborators').select('*'),
      supabase.from('board_activities').select('*'),
      supabase.from('okrs').select('*'),
      supabase.from('rituals').select('*'),
    ]);
    out.steps.push({ reads: {
      projectsCount: projects.data ? projects.data.length : 0,
      allocationsForProject: allocationsForProject.data ? allocationsForProject.data.length : 0,
      collaboratorsCount: collaborators.data ? collaborators.data.length : 0,
      boardActivitiesCount: board.data ? board.data.length : 0,
      okrsCount: okrs.data ? okrs.data.length : 0,
      ritualsCount: rituals.data ? rituals.data.length : 0,
    }});

    // cleanup
    await supabase.from('project_allocations').delete().eq('id', ids.allocId);
    await supabase.from('board_activities').delete().eq('id', ids.taskId);
    await supabase.from('projects').delete().eq('id', ids.projId);
    await supabase.from('collaborators').delete().eq('id', ids.colId);
    await supabase.from('okrs').delete().eq('id', ids.okrId);
    await supabase.from('rituals').delete().eq('id', ids.ritualId);

    out.steps.push({ cleanup: 'done' });
    console.log(JSON.stringify({ ok: true, ids, out }, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(JSON.stringify({ ok: false, ids, error: { message: error.message, details: error.details, hint: error.hint, code: error.code }, out }, null, 2));
    process.exit(1);
  }
}

main();
