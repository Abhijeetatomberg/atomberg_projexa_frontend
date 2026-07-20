import { useEffect, useMemo, useState } from 'react';
import { Box, TrendingUp, AlertTriangle, CalendarClock, CheckCircle2 } from 'lucide-react';
import CrudPage from '@/components/crud/CrudPage';
import { Samples } from '@/api/resources';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import CollapsibleSection from '@/components/ui/collapsible-section';
import StatTile from '@/components/ui/stat-tile';
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
            <StatTile icon={Box} color="#334155" value={total} label="Total Samples" />
            <StatTile icon={TrendingUp} color="#2563eb" value={inProg} label="In Progress" />
            <StatTile icon={AlertTriangle} color="#d97706" value={onHold} label="On Hold" />
            <StatTile icon={AlertTriangle} color={delayed ? '#dc2626' : '#059669'} value={delayed} label="Delayed" />
            <StatTile
              icon={CalendarClock}
              color={dueWeek ? '#d97706' : '#059669'}
              value={dueWeek}
              label="Due This Week"
              caption={overdue ? `${overdue} overdue` : 'next 7 days'}
            />
            <StatTile icon={CheckCircle2} color="#059669" value={submitted} label="Submitted" />
          </div>

          <CollapsibleSection title="Charts — Samples by Status & Upcoming Submissions" defaultOpen={false}>
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Samples by Status</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-6 flex-wrap justify-center">
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
                <CardHeader>
                  <CardTitle>Upcoming Submissions</CardTitle>
                  <span className="text-[11px] text-muted-foreground">soonest first</span>
                </CardHeader>
                <CardContent>
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
