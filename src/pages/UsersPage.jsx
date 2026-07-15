import { useEffect, useState } from 'react';
import { Users as UsersIcon, ShieldCheck, UserCheck, Building2 } from 'lucide-react';
import CrudPage from '@/components/crud/CrudPage';
import { Users } from '@/api/resources';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { DEPTS } from '@/lib/constants';

const columns = [
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
  { key: 'email', label: 'Email' },
  { key: 'dept', label: 'Department' },
  {
    key: 'role', label: 'Role',
    render: (r) => (
      <Badge variant={r.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{r.role}</Badge>
    ),
  },
];

const fields = [
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'dept', label: 'Department', type: 'select', options: DEPTS.map((d) => d.n) },
  { key: 'role', label: 'Role', type: 'select', options: ['member', 'admin'] },
  { key: 'password', label: 'Password (leave blank to keep)', type: 'text', placeholder: '••••••••' },
];

export default function UsersPage() {
  const { isAdmin } = useAuth();
  // Own fetch (in addition to CrudPage's internal list) to drive the stat tiles
  // above the table — mirrors legacy viewUsers().
  const [rows, setRows] = useState([]);
  useEffect(() => { if (isAdmin) Users.list().then(setRows).catch(() => {}); }, [isAdmin]);

  if (!isAdmin) {
    return <p className="text-sm text-muted-foreground">Only admins can manage users.</p>;
  }

  const admins = rows.filter((u) => u.role === 'admin').length;
  const members = rows.length - admins;
  const depts = new Set(rows.map((u) => u.dept).filter(Boolean)).size;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-slate-100 text-slate-700"><UsersIcon className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold leading-none">{rows.length}</div><div className="text-xs text-muted-foreground mt-1">Total Users</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-violet-100 text-violet-600"><ShieldCheck className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold leading-none">{admins}</div><div className="text-xs text-muted-foreground mt-1">Admins</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-blue-100 text-blue-600"><UserCheck className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold leading-none">{members}</div><div className="text-xs text-muted-foreground mt-1">Members</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-cyan-100 text-cyan-600"><Building2 className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold leading-none">{depts}</div><div className="text-xs text-muted-foreground mt-1">Departments</div></div>
          </CardContent>
        </Card>
      </div>

      <CrudPage
        title="User List"
        description="Accounts that can sign in to Projexa"
        api={Users}
        columns={columns}
        fields={fields}
        searchKeys={['username', 'name', 'email', 'dept']}
        defaults={{ role: 'member' }}
        transformOut={({ password, ...v }) => (password ? { ...v, password } : v)}
        addLabel="Add User"
      />
    </div>
  );
}
