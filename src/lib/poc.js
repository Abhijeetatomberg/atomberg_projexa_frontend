// POC domain helpers, ported from the original Projexa HTML app.
import { POC_GATES } from './constants';
import { addDaysIso } from './utils';

export const buildPocTasks = () => {
  const tasks = [];
  let prev = '';
  POC_GATES.forEach((g, si) =>
    g.t.forEach(([n, name]) => {
      tasks.push({
        stage: si, n, name, dep: prev, offset: prev ? 1 : 0, days: 2, pct: 0,
        planStart: '', planEnd: '', actualStart: '', actualEnd: '', resp: '',
        status: 'Not Started', manualStart: false,
      });
      prev = n;
    })
  );
  return tasks;
};

export const pocStageTasks = (p, si) => (p.tasks || []).filter((t) => t.stage === si);

export const pocStagePct = (p, si) => {
  const t = pocStageTasks(p, si);
  if (!t.length) return 0;
  return Math.round(t.reduce((a, x) => a + (+x.pct || 0), 0) / t.length);
};

export const pocPct = (p) => {
  const t = (p.tasks || []).filter((x) => !(p.skip && p.skip[x.stage]));
  if (!t.length) return 0;
  return Math.round(t.reduce((a, x) => a + (+x.pct || 0), 0) / t.length);
};

export const pocActiveTasks = (p) => (p.tasks || []).filter((t) => !(p.skip && p.skip[t.stage]));

// A stage's Actual dates stay locked until every earlier (non-skipped) stage is 100% —
// mirrors pocStageUnlocked in the legacy app.
export const pocStageUnlocked = (p, si) => {
  if (si === 0) return true;
  for (let k = 0; k < si; k++) {
    if (p.skip?.[k]) continue;
    if (pocStagePct(p, k) < 100) return false;
  }
  return true;
};

// Dependency-chain scheduler: each task starts `offset` days after the task it
// depends on (by task number) ends, or at the KO anchor if it has no dependency
// and no manual start override. Mirrors recalcChain in the legacy app (the POC
// side, which has no gate-applicability exclusions to worry about).
export const recalcPocChain = (tasks, anchorIso) => {
  const byN = {};
  tasks.forEach((t) => { if (t.n != null) byN[String(t.n)] = t; });
  const next = tasks.map((t) => ({ ...t }));
  const byNNext = {};
  next.forEach((t) => { if (t.n != null) byNNext[String(t.n)] = t; });
  for (let pass = 0; pass < 6; pass++) {
    next.forEach((t) => {
      const dep = t.dep ? byNNext[String(t.dep)] : null;
      if (dep?.planEnd) t.planStart = addDaysIso(dep.planEnd, t.offset || 0);
      else if (!t.manualStart && anchorIso && !dep) t.planStart = anchorIso;
      if (t.planStart) t.planEnd = addDaysIso(t.planStart, t.days == null ? 2 : +t.days);
    });
  }
  return next;
};
