import CrudPage from '@/components/crud/CrudPage';
import { Resources } from '@/api/resources';
import { Badge } from '@/components/ui/badge';
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
  return (
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
  );
}
