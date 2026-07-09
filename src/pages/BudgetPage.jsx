import CrudPage from '@/components/crud/CrudPage';
import { BudgetItems } from '@/api/resources';
import { inr } from '@/lib/utils';
import { BUDGET_CATS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const columns = [
  { key: 'desc', label: 'Item' },
  { key: 'proj', label: 'Project' },
  { key: 'npd', label: 'NPD Code' },
  { key: 'cat', label: 'Category' },
  { key: 'planned', label: 'Planned', render: (r) => inr(r.planned) },
  { key: 'actual', label: 'Actual', render: (r) => inr(r.actual) },
  {
    key: 'variance', label: 'Variance',
    render: (r) => {
      const v = Number(r.actual || 0) - Number(r.planned || 0);
      return (
        <span className={cn('font-semibold', v > 0 ? 'text-red-600' : 'text-emerald-600')}>
          {v > 0 ? '+' : ''}{inr(v)}
        </span>
      );
    },
  },
];

const fields = [
  { key: 'desc', label: 'Item Description', span: 2 },
  { key: 'proj', label: 'Project' },
  { key: 'npd', label: 'NPD Code' },
  { key: 'cat', label: 'Category', type: 'select', options: BUDGET_CATS },
  { key: 'planned', label: 'Planned (₹)', type: 'number' },
  { key: 'actual', label: 'Actual (₹)', type: 'number' },
];

export default function BudgetPage() {
  return (
    <CrudPage
      title="Budget"
      description="Development budget vs. actuals by project & category"
      api={BudgetItems}
      columns={columns}
      fields={fields}
      searchKeys={['desc', 'proj', 'npd', 'cat']}
      headerExtra={(rows) => {
        const planned = rows.reduce((a, r) => a + Number(r.planned || 0), 0);
        const actual = rows.reduce((a, r) => a + Number(r.actual || 0), 0);
        return (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Planned: <b className="text-foreground">{inr(planned)}</b></span>
            <span>Actual: <b className="text-foreground">{inr(actual)}</b></span>
          </div>
        );
      }}
      addLabel="Add Item"
    />
  );
}
