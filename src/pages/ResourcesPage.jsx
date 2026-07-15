import { useEffect, useState } from 'react';
import { Users as UsersIcon, BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import CrudPage from '@/components/crud/CrudPage';
import { Resources } from '@/api/resources';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-blue-100 text-blue-600"><UsersIcon className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold leading-none">{rows.length}</div><div className="text-xs text-muted-foreground mt-1">Total Resources</div><div className="text-[11px] text-muted-foreground">Across all departments</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-violet-100 text-violet-600"><BarChart3 className="h-5 w-5" /></div>
            <div>
              <div className="text-2xl font-bold leading-none">{util}%</div>
              <div className="text-xs text-muted-foreground mt-1">Avg Utilization</div>
              <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden mt-1"><div className="h-full bg-violet-600" style={{ width: `${Math.min(100, util)}%` }} /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-red-100 text-red-600"><AlertTriangle className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold leading-none">{over}</div><div className="text-xs text-muted-foreground mt-1">Overloaded</div><div className="text-[11px] text-muted-foreground">&gt;100% allocated</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold leading-none">{free}</div><div className="text-xs text-muted-foreground mt-1">Available</div><div className="text-[11px] text-muted-foreground">&ge;20% availability</div></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><UsersIcon className="h-4 w-4 text-muted-foreground" />Department Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {DEPTS.map((d) => {
              const mem = rows.filter((r) => r.dept === d.n);
              const cap = mem.reduce((a, r) => a + Number(r.avail || 0), 0);
              const u = cap ? Math.round((mem.reduce((a, r) => a + Number(r.alloc || 0), 0) / cap) * 100) : 0;
              return (
                <div key={d.n} className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium"><span className="h-2 w-2 rounded-full inline-block" style={{ background: d.c }} />{d.n}</div>
                  <div className="text-xl font-bold mt-1">{mem.length}</div>
                  <div className="text-[11px] text-muted-foreground">{u}% utilized</div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1"><div className="h-full" style={{ width: `${Math.min(100, u)}%`, background: d.c }} /></div>
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
