import { useEffect, useMemo, useState } from 'react';
import { Box, TrendingUp, AlertTriangle, CalendarClock, CheckCircle2 } from 'lucide-react';
import CrudPage from '@/components/crud/CrudPage';
import { Samples } from '@/api/resources';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import CollapsibleSection from '@/components/ui/collapsible-section';
import Donut from '@/components/charts/Donut';
import { fmtDate, cn, todayIso } from '@/lib/utils';
import { SAMPLE_ST, BUNITS, badgeForStatus } from '@/lib/constants';

const SAMPLE_COLOR = {
  New: '#94a3b8', 'In Progress': '#2563eb', 'On Hold': '#d97706', Delayed: '#dc2626',
  'Delayed but Completed': '#ea580c', Submitted: '#7c3aed', Completed: '#059669', Dropped: '#64748b',
};
const isDone = (s) => /(Completed|Submitted|Dropped)/.test(s || '');

const columns = [
  {
    key: 'status', label: 'Status',
    render: (r) => <Badge variant="outline" className={badgeForStatus(r.status)}>{r.status}</Badge>,
  },
  { key: 'cat', label: 'Category' },
  { key: 'project', label: 'Project' },
  { key: 'customer', label: 'Customer' },
  { key: 'spec', label: 'Spec' },
  { key: 'qty', label: 'Qty' },
  { key: 'reqDate', label: 'Req. Date', render: (r) => fmtDate(r.reqDate) },
  { key: 'plannedSub', label: 'Planned Sub.', render: (r) => fmtDate(r.plannedSub) },
  { key: 'submission', label: 'Submitted', render: (r) => fmtDate(r.submission) },
  { key: 'owner', label: 'Owner' },
];

const fields = [
  { key: 'status', label: 'Status', type: 'select', options: SAMPLE_ST },
  { key: 'cat', label: 'Category', type: 'select', options: BUNITS },
  { key: 'project', label: 'Project' },
  { key: 'customer', label: 'Customer' },
  { key: 'spec', label: 'Specification', span: 2 },
  { key: 'qty', label: 'Quantity' },
  { key: 'reqDate', label: 'Requirement Date', type: 'date' },
  { key: 'drawing', label: 'Drawing Availability' },
  { key: 'material', label: 'Material Availability' },
  { key: 'plannedSub', label: 'Planned Submission', type: 'date' },
  { key: 'assembly', label: 'Assembly Completion', type: 'date' },
  { key: 'inspection', label: 'Inspection Date', type: 'date' },
  { key: 'submission', label: 'Submission Date', type: 'date' },
  { key: 'owner', label: 'Owner' },
  { key: 'planner', label: 'Planner Remarks' },
  { key: 'remarks', label: 'Remarks', type: 'textarea' },
];

export default function SamplePage() {
  // Lightweight, separate fetch just to power the KPI tiles / status donut
  // above the generic CrudPage list (which does its own internal fetch).
  const [samples, setSamples] = useState([]);
  useEffect(() => { Samples.list().then(setSamples).catch(() => {}); }, []);

  const today = todayIso();
  const in7 = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }, []);

  const cnt = (st) => samples.filter((s) => s.status === st).length;
  const total = samples.length;
  const inProg = cnt('In Progress');
  const onHold = cnt('On Hold');
  const delayed = cnt('Delayed');
  const submitted = cnt('Submitted');
  const overdue = samples.filter((s) => !isDone(s.status) && s.plannedSub && s.plannedSub < today).length;
  const dueWeek = samples.filter((s) => !isDone(s.status) && s.plannedSub && s.plannedSub >= today && s.plannedSub <= in7).length;

  const segs = SAMPLE_ST.map((st) => ({ label: st, value: cnt(st), color: SAMPLE_COLOR[st] || '#64748b' })).filter((s) => s.value > 0);

  const upcoming = samples
    .filter((s) => !isDone(s.status) && s.plannedSub)
    .sort((a, b) => a.plannedSub.localeCompare(b.plannedSub))
    .slice(0, 6);

  return (
    <div className="space-y-4">
      {total > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-slate-100 text-slate-700"><Box className="h-5 w-5" /></div>
                <div><div className="text-2xl font-bold leading-none">{total}</div><div className="text-xs text-muted-foreground mt-1">Total Samples</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-blue-100 text-blue-600"><TrendingUp className="h-5 w-5" /></div>
                <div><div className="text-2xl font-bold leading-none">{inProg}</div><div className="text-xs text-muted-foreground mt-1">In Progress</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-amber-100 text-amber-600"><AlertTriangle className="h-5 w-5" /></div>
                <div><div className="text-2xl font-bold leading-none">{onHold}</div><div className="text-xs text-muted-foreground mt-1">On Hold</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-lg grid place-items-center shrink-0', delayed ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600')}><AlertTriangle className="h-5 w-5" /></div>
                <div><div className="text-2xl font-bold leading-none">{delayed}</div><div className="text-xs text-muted-foreground mt-1">Delayed</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-lg grid place-items-center shrink-0', dueWeek ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600')}><CalendarClock className="h-5 w-5" /></div>
                <div><div className="text-2xl font-bold leading-none">{dueWeek}</div><div className="text-xs text-muted-foreground mt-1">Due This Week</div><div className="text-[11px] text-muted-foreground">{overdue ? `${overdue} overdue` : 'next 7 days'}</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
                <div><div className="text-2xl font-bold leading-none">{submitted}</div><div className="text-xs text-muted-foreground mt-1">Submitted</div></div>
              </CardContent>
            </Card>
          </div>

          <CollapsibleSection title="Charts — Samples by Status & Upcoming Submissions" defaultOpen={false}>
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-6 flex-wrap justify-center">
                  <Donut segments={segs} centerLabel="samples" />
                  <div className="space-y-1 text-xs">
                    {segs.length ? segs.map((s) => (
                      <div key={s.label} className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ background: s.color }} />
                        {s.label} <b>{s.value}</b>
                      </div>
                    )) : <span className="text-muted-foreground">No samples yet</span>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium mb-2">Upcoming Submissions <span className="text-xs text-muted-foreground font-normal">(soonest first)</span></div>
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No upcoming submissions scheduled</p>
                  ) : (
                    <div className="space-y-1.5">
                      {upcoming.map((s) => {
                        const od = s.plannedSub < today;
                        return (
                          <div key={s.id} className="flex items-center justify-between text-xs border-b last:border-0 py-1.5">
                            <span className="font-medium truncate">{s.project || '(unnamed)'}</span>
                            <span className={cn(od ? 'text-red-600 font-semibold' : 'text-muted-foreground')}>{fmtDate(s.plannedSub)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CollapsibleSection>
        </>
      )}

      <CrudPage
        title="Sample Submission"
        description="Customer sample requests through assembly, inspection & submission"
        api={Samples}
        columns={columns}
        fields={fields}
        searchKeys={['project', 'customer', 'spec', 'owner', 'status']}
        defaults={{ status: 'New', cat: 'CF', customer: 'ATPL' }}
        addLabel="Add Sample"
      />
    </div>
  );
}
