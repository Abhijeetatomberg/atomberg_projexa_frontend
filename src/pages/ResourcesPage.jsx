import { useEffect, useState } from 'react';
import { Users as UsersIcon, BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import CrudPage from '@/components/crud/CrudPage';
import { Resources } from '@/api/resources';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatTile from '@/components/ui/stat-tile';
import { initials } from '@/lib/utils';
import { DEPTS } from '@/lib/constants';

const columns = [
  {
    key: 'name', label: 'Name',
    render: (r) => (
      <span className="flex items-center gap-2">
        <span
          className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-bold text-white"
          style={{ background: r.color || '#2563eb' }}
        >
          {initials(r.name)}
        </span>
        <span className="font-medium">{r.name}</span>
      </span>
    ),
  },
  { key: 'role', label: 'Role' },
  {
    key: 'dept', label: 'Department',
    render: (r) => <Badge variant="secondary">{r.dept || '—'}</Badge>,
  },
  { key: 'email', label: 'Email' },
  { key: 'alloc', label: 'Allocated (h/wk)' },
  { key: 'avail', label: 'Capacity (h/wk)' },
  {
    key: 'load', label: 'Load',
    render: (r) => {
      const pct = r.avail ? Math.round((r.alloc / r.avail) * 100) : 0;
      const color = pct > 100 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-emerald-600';
      return <span className={`font-semibold ${color}`}>{pct}%</span>;
    },
  },
];

const fields = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'dept', label: 'Department', type: 'select', options: DEPTS.map((d) => d.n) },
  { key: 'email', label: 'Email' },
  { key: 'alloc', label: 'Allocated hours/week', type: 'number' },
  { key: 'avail', label: 'Capacity hours/week', type: 'number' },
];

export default function ResourcesPage() {
  // Own fetch (in addition to CrudPage's internal list) to drive the stat tiles
  // & department overview above the table — mirrors legacy viewResources().
  const [rows, setRows] = useState([]);
  useEffect(() => { Resources.list().then(setRows).catch(() => {}); }, []);

  const totalCap = rows.reduce((a, r) => a + Number(r.avail || 0), 0);
  const used = rows.reduce((a, r) => a + Number(r.alloc || 0), 0);
  const util = totalCap ? Math.round((used / totalCap) * 100) : 0;
  const over = rows.filter((r) => Number(r.alloc || 0) > Number(r.avail || 0)).length;
  const free = rows.filter((r) => Number(r.avail || 0) - Number(r.alloc || 0) >= (Number(r.avail || 0) * 0.2)).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={UsersIcon} color="#2563eb" value={rows.length} label="Total Resources" caption="Across all departments" />
        <StatTile icon={BarChart3} color="#7c3aed" value={`${util}%`} label="Avg Utilization" barPct={util} />
        <StatTile icon={AlertTriangle} color={over ? '#dc2626' : '#059669'} value={over} label="Overloaded" caption=">100% allocated" />
        <StatTile icon={CheckCircle2} color="#059669" value={free} label="Available" caption="≥20% availability" />
      </div>

      <Card>
        <CardHeader><CardTitle><UsersIcon className="h-4 w-4" />Department Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {DEPTS.map((d) => {
              const mem = rows.filter((r) => r.dept === d.n);
              const cap = mem.reduce((a, r) => a + Number(r.avail || 0), 0);
              const u = cap ? Math.round((mem.reduce((a, r) => a + Number(r.alloc || 0), 0) / cap) * 100) : 0;
              return (
                <div key={d.n} className="rounded-lg border bg-card p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold"><span className="h-2 w-2 rounded-full inline-block" style={{ background: d.c }} />{d.n}</div>
                  <div className="mt-1.5 text-[22px] font-bold leading-none">{mem.length}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{u}% utilized</div>
                  <div className="mt-1.5 h-[5px] rounded-full bg-border overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, u)}%`, background: d.c }} /></div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <CrudPage
        title="Resources"
        description="Team members & allocation across projects"
        api={Resources}
        columns={columns}
        fields={fields}
        searchKeys={['name', 'role', 'dept', 'email']}
        defaults={{ avail: 40, alloc: 0 }}
        transformOut={(v) => ({
          ...v,
          color: v.color || DEPTS.find((d) => d.n === v.dept)?.c || '#2563eb',
        })}
        addLabel="Add Resource"
      />
    </div>
  );
}
