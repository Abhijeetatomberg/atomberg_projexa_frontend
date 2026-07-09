import CrudPage from '@/components/crud/CrudPage';
import { Users } from '@/api/resources';
import { Badge } from '@/components/ui/badge';
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
  if (!isAdmin) {
    return <p className="text-sm text-muted-foreground">Only admins can manage users.</p>;
  }
  return (
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
  );
}
