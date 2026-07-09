// POC domain helpers, ported from the original Projexa HTML app.
import { POC_GATES } from './constants';

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
