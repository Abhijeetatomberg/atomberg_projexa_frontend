// NPD domain helpers, ported from the original Projexa HTML app.
import { GATES, GATE_APPLIC, GATE_EXIT, GATE_DELIV } from './constants';
import { addDaysIso, taskBucket } from './utils';

export const gateKey = (g) => g.replace('-', ''); // 'AB-0' → 'AB0'

export const gateApplic = (p, gkey) => {
  if (!p.category || !GATE_APPLIC[p.category]) return 'M';
  const v = GATE_APPLIC[p.category][gkey];
  return v === 'M' ? 'M' : v === 'C' ? 'C' : 'NA';
};

export const gateIncluded = (p, gkey) => {
  const a = gateApplic(p, gkey);
  if (a === 'M') return true;
  const ov = p.gateOverride?.[gkey];
  if (ov === 'on') return true;
  if (ov === 'off') return false;
  return a === 'C';
};

export const isTaskDone = (t) => t.status && t.status.indexOf('Completed') === 0;

export const npdGateTasks = (p, gi) => (p.tasks || []).filter((t) => t.gi === gi);

export const npdGatePct = (p, gi) => {
  const t = npdGateTasks(p, gi);
  if (!t.length) return 0;
  return Math.round(t.reduce((a, x) => a + (x.pct != null && x.pct !== '' ? +x.pct : (isTaskDone(x) ? 100 : 0)), 0) / t.length);
};

export const npdPct = (p) => {
  const t = (p.tasks || []).filter((x) => GATES[x.gi] && gateIncluded(p, gateKey(GATES[x.gi].g)));
  if (!t.length) return 0;
  return Math.round(t.reduce((a, x) => a + (x.pct != null && x.pct !== '' ? +x.pct : (isTaskDone(x) ? 100 : 0)), 0) / t.length);
};

// Builds the full task list from the gate templates (initNpd in the original)
export const buildTaskPlan = () =>
  GATES.flatMap((G, gi) =>
    G.t.map((t) => ({
      n: t.n, name: t.name, gi, dur: t.dur,
      status: 'Not Started', pct: 0, owner: '', resp: '', due: '',
      planStart: '', planEnd: '', actualStart: '', actualEnd: '', remarks: '',
    }))
  );

// Chains plan dates from the KO anchor: each task starts when the previous
// ends and runs `dur` days (recalcChain in the original).
export const recalcChain = (tasks, anchorIso) => {
  let cursor = anchorIso;
  return tasks.map((t) => {
    const planStart = cursor;
    const planEnd = addDaysIso(cursor, Math.max(1, parseInt(t.dur, 10) || 1));
    cursor = planEnd;
    return { ...t, planStart, planEnd };
  });
};

// Seeds gateExit / gateDeliv checklists from templates for keys not yet present
export const seedGateLists = (p) => {
  const gateExit = { ...(p.gateExit || {}) };
  const gateDeliv = { ...(p.gateDeliv || {}) };
  Object.keys(GATE_EXIT).forEach((k) => {
    if (!gateExit[k]) gateExit[k] = GATE_EXIT[k].map((e) => ({ ...e, met: false }));
  });
  Object.keys(GATE_DELIV).forEach((k) => {
    if (!gateDeliv[k]) gateDeliv[k] = GATE_DELIV[k].map((d) => ({ ...d, avail: false }));
  });
  return { gateExit, gateDeliv };
};

export const npdHealth = (p) => {
  const tasks = p.tasks || [];
  if (!p.koDone || !tasks.length) return { status: 'Pre-KO', color: '#64748b' };
  const buckets = { delayed: 0, atrisk: 0, behind: 0 };
  tasks.forEach((t) => { const k = taskBucket(t.status, t.pct); if (buckets[k] != null) buckets[k]++; });
  if (buckets.delayed) return { status: 'Delayed', color: '#dc2626' };
  if (buckets.atrisk) return { status: 'At Risk', color: '#ea580c' };
  if (buckets.behind) return { status: 'Behind', color: '#d97706' };
  return { status: 'On Track', color: '#059669' };
};
