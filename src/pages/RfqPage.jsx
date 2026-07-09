import { useEffect, useMemo, useState } from 'react';
import { Plus, ArrowRight, ThumbsDown, Search } from 'lucide-react';
import { Rfqs, Npds } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import FormFields from '@/components/crud/FormFields';
import { toast } from '@/components/toaster';
import { RFQ_STAGES } from '@/lib/constants';
import { cn, fmtDate, inr } from '@/lib/utils';

const stageMeta = (k) => RFQ_STAGES.find((s) => s.k === k) || RFQ_STAGES[0];
// The pipeline order used for "advance to next stage"
const FLOW = ['draft', 'rd', 'costing', 'bd', 'won'];

const fields = [
  { key: 'name', label: 'RFQ Name', span: 2 },
  { key: 'cust', label: 'Customer' },
  { key: 'bd', label: 'BD Owner' },
  { key: 'vol', label: 'Annual Volume', type: 'number' },
  { key: 'price', label: 'Target Price (₹)', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

export default function RfqPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});

  const load = () => {
    setLoading(true);
    Rfqs.list().then(setRows).catch((e) => toast(e.message, 'error')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(
    () => rows.filter((r) =>
      (!stageFilter || r.stage === stageFilter) &&
      (!q || `${r.code} ${r.name} ${r.cust} ${r.bd}`.toLowerCase().includes(q.toLowerCase()))
    ),
    [rows, q, stageFilter]
  );

  const counts = useMemo(() => {
    const c = {};
    rows.forEach((r) => { c[r.stage] = (c[r.stage] || 0) + 1; });
    return c;
  }, [rows]);

  const save = async () => {
    try {
      if (editing) {
        const u = await Rfqs.update(editing.id, values);
        setRows((p) => p.map((r) => (r.id === u.id ? u : r)));
        toast('RFQ updated', 'success');
      } else {
        const c = await Rfqs.create({
          ...values,
          stage: 'draft',
          created: new Date().toISOString().slice(0, 10),
        });
        setRows((p) => [...p, c]);
        toast(`RFQ ${c.code} created`, 'success');
      }
      setOpen(false);
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const setStage = async (r, stage) => {
    try {
      const u = await Rfqs.update(r.id, { stage });
      setRows((p) => p.map((x) => (x.id === u.id ? u : x)));
      toast(`Moved to ${stageMeta(stage).label}`, 'success');
      // Winning an RFQ spawns an NPD project, mirroring the original app
      if (stage === 'won' && !r.npdCode) {
        const npd = await Npds.create({ name: r.name, cust: r.cust, rfqNo: r.code, fromRfq: r.code });
        await Rfqs.update(r.id, { npdCode: npd.code });
        toast(`NPD project ${npd.code} created from this RFQ`, 'success');
        load();
      }
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const advance = (r) => {
    const i = FLOW.indexOf(r.stage);
    if (i >= 0 && i < FLOW.length - 1) setStage(r, FLOW[i + 1]);
  };

  const remove = async () => {
    if (!editing || !confirm('Delete this RFQ?')) return;
    await Rfqs.remove(editing.id);
    setRows((p) => p.filter((r) => r.id !== editing.id));
    setOpen(false);
    toast('RFQ deleted', 'success');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">RFQ Tracking</h1>
          <p className="text-sm text-muted-foreground">Sales RFQs through feasibility, costing & pricing</p>
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-56" placeholder="Search RFQs…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button onClick={() => { setEditing(null); setValues({}); setOpen(true); }}>
          <Plus /> New RFQ
        </Button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {RFQ_STAGES.map((s) => (
          <Card
            key={s.k}
            className={cn('cursor-pointer transition-colors', stageFilter === s.k && 'ring-2 ring-primary')}
            onClick={() => setStageFilter(stageFilter === s.k ? '' : s.k)}
          >
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{counts[s.k] || 0}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>RFQ No.</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Volume</TableHead>
            <TableHead>Target Price</TableHead>
            <TableHead>BD Owner</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No RFQs yet</TableCell></TableRow>
          ) : filtered.map((r) => {
            const m = stageMeta(r.stage);
            const canAdvance = FLOW.includes(r.stage) && r.stage !== 'won';
            return (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => { setEditing(r); setValues(r); setOpen(true); }}>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell className="font-medium">{r.name}{r.npdCode && <Badge variant="secondary" className="ml-2">{r.npdCode}</Badge>}</TableCell>
                <TableCell>{r.cust}</TableCell>
                <TableCell>{Number(r.vol || 0).toLocaleString('en-IN')}</TableCell>
                <TableCell>{inr(r.price)}</TableCell>
                <TableCell>{r.bd}</TableCell>
                <TableCell>{fmtDate(r.created)}</TableCell>
                <TableCell>
                  <Badge variant="outline" style={{ color: m.color, borderColor: m.color }}>{m.label}</Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    {canAdvance && (
                      <Button size="sm" variant="outline" onClick={() => advance(r)}>
                        {FLOW.indexOf(r.stage) === FLOW.length - 2 ? 'Mark Won' : stageMeta(FLOW[FLOW.indexOf(r.stage) + 1]).label}
                        <ArrowRight />
                      </Button>
                    )}
                    {r.stage !== 'lost' && r.stage !== 'won' && (
                      <Button size="sm" variant="ghost" className="text-red-600" title="Mark lost" onClick={() => setStage(r, 'lost')}>
                        <ThumbsDown />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.code}` : 'New RFQ'}</DialogTitle>
          </DialogHeader>
          <FormFields fields={fields} values={values} onChange={setValues} />
          <DialogFooter className="gap-2">
            {editing && <Button variant="destructive" className="mr-auto" onClick={remove}>Delete</Button>}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
