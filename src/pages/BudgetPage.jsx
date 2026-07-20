import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, ListChecks, BarChart3 } from 'lucide-react';
import CrudPage from '@/components/crud/CrudPage';
import { BudgetItems } from '@/api/resources';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatTile from '@/components/ui/stat-tile';
import { inr, lakh, cn } from '@/lib/utils';
import { BUDGET_CATS } from '@/lib/constants';

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
  // Fetched separately (in addition to CrudPage's own list) purely to drive the
  // stat tiles & charts above the table — mirrors legacy viewBudget()'s summary.
  const [rows, setRows] = useState([]);
  useEffect(() => { BudgetItems.list().then(setRows).catch(() => {}); }, []);

  const planned = rows.reduce((a, r) => a + Number(r.planned || 0), 0);
  const actual = rows.reduce((a, r) => a + Number(r.actual || 0), 0);
  const variance = planned - actual;
  const under = rows.filter((r) => Number(r.actual || 0) <= Number(r.planned || 0)).length;
  const over = rows.filter((r) => Number(r.actual || 0) > Number(r.planned || 0)).length;

  const catAgg = BUDGET_CATS
    .map((c) => {
      const items = rows.filter((r) => r.cat === c);
      return { c, p: items.reduce((a, r) => a + Number(r.planned || 0), 0), a: items.reduce((a, r) => a + Number(r.actual || 0), 0) };
    })
    .filter((x) => x.p > 0 || x.a > 0);
  const maxCat = Math.max(1, ...catAgg.map((x) => Math.max(x.p, x.a)));

  const projNames = [...new Set(rows.map((r) => r.proj))];
  const projAgg = projNames.map((pr) => {
    const items = rows.filter((r) => r.proj === pr);
    return {
      pr,
      npd: items[0]?.npd,
      p: items.reduce((a, r) => a + Number(r.planned || 0), 0),
      a: items.reduce((a, r) => a + Number(r.actual || 0), 0),
    };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          icon={Wallet}
          color="#059669"
          value={lakh(planned)}
          label="Total Planned"
          caption={`Across ${projAgg.length} projects`}
        />
        <StatTile
          icon={Wallet}
          color="#2563eb"
          value={lakh(actual)}
          label="Total Actual"
          barPct={planned ? Math.round((actual / planned) * 100) : 0}
        />
        <StatTile
          icon={TrendingUp}
          color="#059669"
          value={`${variance >= 0 ? '+' : ''}${lakh(Math.abs(variance))}`}
          label="Variance"
          caption={variance >= 0 ? 'Under budget' : 'Over budget'}
        />
        <StatTile
          icon={ListChecks}
          color="#d97706"
          value={rows.length}
          label="Budget Items"
          pills={(
            <>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">{under} under</Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">{over} over</Badge>
            </>
          )}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle><BarChart3 className="h-4 w-4" />Budget by Category</CardTitle></CardHeader>
          <CardContent>
            {catAgg.length === 0 ? <p className="text-sm text-muted-foreground">No data yet</p> : (
              <>
                <div className="space-y-2">
                  {catAgg.map((x) => (
                    <div key={x.c} className="flex items-center gap-2 text-xs">
                      <div className="w-24 shrink-0 text-muted-foreground truncate">{x.c}</div>
                      <div className="flex-1 space-y-0.5">
                        <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${(x.p / maxCat) * 100}%` }} /></div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-600" style={{ width: `${(x.a / maxCat) * 100}%` }} /></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 text-xs mt-3">
                  <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm inline-block bg-amber-500" />Planned</div>
                  <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm inline-block bg-emerald-600" />Actual</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle><TrendingUp className="h-4 w-4" />Budget by Project</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {projAgg.length === 0 ? <p className="text-sm text-muted-foreground">No data yet</p> : projAgg.map((x) => {
              const v = x.p - x.a;
              return (
                <div key={x.pr}>
                  <div className="flex items-center justify-between text-xs">
                    <div><div className="font-medium">{x.pr}</div>{x.npd && <div className="text-[10px] text-muted-foreground">{x.npd}</div>}</div>
                    <div className="text-right">
                      <div>{lakh(x.p)} / {lakh(x.a)}</div>
                      <div className={cn('text-[10px]', v >= 0 ? 'text-emerald-600' : 'text-red-600')}>{v >= 0 ? '+' : ''}{lakh(Math.abs(v))}</div>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                    <div className={cn('h-full', x.a > x.p ? 'bg-red-600' : 'bg-primary')} style={{ width: `${x.p ? Math.min(100, (x.a / x.p) * 100) : 0}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <CrudPage
        title="Budget"
        description="Development budget vs. actuals by project & category"
        api={BudgetItems}
        columns={columns}
        fields={fields}
        searchKeys={['desc', 'proj', 'npd', 'cat']}
        headerExtra={() => (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Planned: <b className="text-foreground">{inr(planned)}</b></span>
            <span>Actual: <b className="text-foreground">{inr(actual)}</b></span>
          </div>
        )}
        addLabel="Add Item"
      />
    </div>
  );
}
