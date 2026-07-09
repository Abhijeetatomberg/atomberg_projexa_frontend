import CrudPage from '@/components/crud/CrudPage';
import { Investments } from '@/api/resources';
import { inr } from '@/lib/utils';

const columns = [
  { key: 'proj', label: 'Project' },
  { key: 'process', label: 'Process' },
  { key: 'mftg', label: 'MFTGB Item' },
  { key: 'tool', label: 'Tool' },
  { key: 'numbers', label: 'Nos.' },
  { key: 'investment', label: 'Investment', render: (r) => inr(r.investment) },
  { key: 'supplier', label: 'Supplier' },
  { key: 'leadTime', label: 'Lead Time' },
];

const fields = [
  { key: 'proj', label: 'Project' },
  { key: 'process', label: 'Process' },
  { key: 'mftg', label: 'MFTGB Item' },
  { key: 'tool', label: 'Tool' },
  { key: 'numbers', label: 'Numbers', type: 'number' },
  { key: 'investment', label: 'Investment (₹)', type: 'number' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'leadTime', label: 'Lead Time' },
];

export default function InvestmentPage() {
  return (
    <CrudPage
      title="Investment"
      description="Capital & tooling investment per project"
      api={Investments}
      columns={columns}
      fields={fields}
      searchKeys={['proj', 'process', 'tool', 'supplier']}
      headerExtra={(rows) => (
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-bold text-foreground">{inr(rows.reduce((a, r) => a + Number(r.investment || 0), 0))}</span>
        </div>
      )}
      addLabel="Add Investment"
    />
  );
}
