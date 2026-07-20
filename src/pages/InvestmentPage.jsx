import { useEffect, useState } from 'react';
import { Wallet, Box, Users as UsersIcon } from 'lucide-react';
import CrudPage from '@/components/crud/CrudPage';
import { Investments } from '@/api/resources';
import StatTile from '@/components/ui/stat-tile';
import { inr, lakh } from '@/lib/utils';

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
  // Own fetch (in addition to CrudPage's internal list) to drive the stat tiles
  // above the table — mirrors legacy viewInvestment().
  const [rows, setRows] = useState([]);
  useEffect(() => { Investments.list().then(setRows).catch(() => {}); }, []);

  const total = rows.reduce((a, r) => a + Number(r.investment || 0), 0);
  const suppliers = new Set(rows.map((r) => r.supplier).filter(Boolean)).size;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={Wallet} color="#7c3aed" value={lakh(total)} label="Total Investment" />
        <StatTile icon={Box} color="#2563eb" value={rows.length} label="Line Items" />
        <StatTile icon={UsersIcon} color="#059669" value={suppliers} label="Suppliers" />
      </div>

      <CrudPage
        title="Investment"
        description="Capital & tooling investment per project"
        api={Investments}
        columns={columns}
        fields={fields}
        searchKeys={['proj', 'process', 'tool', 'supplier']}
        headerExtra={() => (
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-bold text-foreground">{inr(total)}</span>
          </div>
        )}
        addLabel="Add Investment"
      />
    </div>
  );
}
