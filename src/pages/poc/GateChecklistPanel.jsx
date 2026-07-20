import { CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GATE_EXIT, GATE_DELIV } from '@/lib/constants';
import { cn } from '@/lib/utils';

const GATE_TITLES = { AB0: 'AB0 — POC Approval', 'AB0.5': 'AB0.5 — Concept Feasibility Review' };
const KEYS = ['AB0', 'AB0.5'];

// Blocks promotion to NPD until every exit criterion + deliverable across AB0/AB0.5 is met —
// mirrors gatesMissingFor/gateBlockModal in the legacy app.
export const gatesMissing = (project) => {
  const missing = [];
  KEYS.forEach((key) => {
    (project.gateExit?.[key] || GATE_EXIT[key] || []).forEach((e) => { if (!e.met) missing.push({ type: 'Exit criterion', t: e.t }); });
    (project.gateDeliv?.[key] || GATE_DELIV[key] || []).forEach((d) => { if (!d.avail) missing.push({ type: 'Deliverable', t: d.d }); });
  });
  return missing;
};

export default function GateChecklistPanel({ project, onSave }) {
  const toggleExit = (key, i) => {
    const list = (project.gateExit?.[key] || GATE_EXIT[key].map((e) => ({ ...e, met: false })));
    const next = list.map((e, ix) => (ix === i ? { ...e, met: !e.met } : e));
    onSave({ gateExit: { ...(project.gateExit || {}), [key]: next } });
  };
  const toggleDeliv = (key, i) => {
    const list = (project.gateDeliv?.[key] || GATE_DELIV[key].map((d) => ({ ...d, avail: false })));
    const next = list.map((d, ix) => (ix === i ? { ...d, avail: !d.avail } : d));
    onSave({ gateDeliv: { ...(project.gateDeliv || {}), [key]: next } });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold">Gate exit criteria &amp; deliverables — required before promoting this POC to NPD</div>
      {KEYS.map((key) => {
        const exits = project.gateExit?.[key] || GATE_EXIT[key]?.map((e) => ({ ...e, met: false })) || [];
        const delivs = project.gateDeliv?.[key] || GATE_DELIV[key]?.map((d) => ({ ...d, avail: false })) || [];
        if (!exits.length && !delivs.length) return null;
        const metCount = exits.filter((e) => e.met).length;
        const rdyCount = delivs.filter((d) => d.avail).length;
        return (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{GATE_TITLES[key] || key}</CardTitle>
              <span className="text-[11px] font-medium text-muted-foreground shrink-0">Exit {metCount}/{exits.length} · Deliverables {rdyCount}/{delivs.length}</span>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Exit Criteria</div>
                {exits.map((e, i) => (
                  <button key={i} className="flex items-start gap-2 py-1 text-left text-[13px] w-full hover:bg-accent rounded px-1" onClick={() => toggleExit(key, i)}>
                    {e.met ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
                    <span className={cn(e.met && 'line-through text-muted-foreground')}>{e.t}</span>
                  </button>
                ))}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Deliverables</div>
                {delivs.map((d, i) => (
                  <button key={i} className="flex items-start gap-2 py-1 text-left text-[13px] w-full hover:bg-accent rounded px-1" onClick={() => toggleDeliv(key, i)}>
                    {d.avail ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
                    <span className={cn('flex-1', d.avail && 'line-through text-muted-foreground')}>{d.d}</span>
                    {d.fn && <Badge variant="secondary" className="text-[10px]">{d.fn}</Badge>}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
