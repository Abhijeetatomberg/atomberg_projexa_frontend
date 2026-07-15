import { useEffect, useState } from 'react';
import { Wallet, Box, Users as UsersIcon } from 'lucide-react';
import CrudPage from '@/components/crud/CrudPage';
import { Investments } from '@/api/resources';
import { Card, CardContent } from '@/components/ui/card';
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
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-violet-100 text-violet-600"><Wallet className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold leading-none">{lakh(total)}</div><div className="text-xs text-muted-foreground mt-1">Total Investment</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-blue-100 text-blue-600"><Box className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold leading-none">{rows.length}</div><div className="text-xs text-muted-foreground mt-1">Line Items</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-emerald-100 text-emerald-600"><UsersIcon className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold leading-none">{suppliers}</div><div className="text-xs text-muted-foreground mt-1">Suppliers</div></div>
          </CardContent>
        </Card>
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
