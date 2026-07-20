import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, GitBranch, CheckCircle2, AlertTriangle, Clock, TrendingUp, Target,
} from 'lucide-react';
import { Npds } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatTile from '@/components/ui/stat-tile';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import CollapsibleSection from '@/components/ui/collapsible-section';
import FormFields from '@/components/crud/FormFields';
import { toast } from '@/components/toaster';
import {
  NPD_CATS, BUNITS, DEV_TYPES, GATE_LABELS,
} from '@/lib/constants';
import { npdPct, npdHealth } from '@/lib/npd';
import { fmtDate, taskBucket } from '@/lib/utils';

const fields = [
  { key: 'name', label: 'Project Name', span: 2 },
  { key: 'cust', label: 'Customer' },
  { key: 'businessUnit', label: 'Business Unit', type: 'select', options: BUNITS },
  { key: 'devType', label: 'Development Type', type: 'select', options: DEV_TYPES },
  { key: 'category', label: 'NPD Category', type: 'select', options: NPD_CATS.map((c) => ({ value: c.c, label: `${c.c} — ${c.d}` })) },
  { key: 'customerModel', label: 'Customer Model' },
  { key: 'annualVol', label: 'Annual Volumes' },
  { key: 'owner', label: 'Project Owner' },
  { key: 'startDate', label: 'Start Date', type: 'date' },
  { key: 'launch', label: 'Target Launch', type: 'date' },
];

const HEALTH_FILTERS = ['Pre-KO', 'On Track', 'At Risk', 'Delayed'];

export default function NpdPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [gateFilter, setGateFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [buFilter, setBuFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});

  useEffect(() => {
    Npds.list().then(setRows).catch((e) => toast(e.message, 'error')).finally(() => setLoading(false));
  }, []);

  const healthByRow = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => m.set(r.id, npdHealth(r)));
    return m;
  }, [rows]);

  const filtered = useMemo(
    () => rows.filter((r) =>
      (!q || `${r.code} ${r.name} ${r.cust} ${r.owner}`.toLowerCase().includes(q.toLowerCase())) &&
      (!gateFilter || String(r.gate || 0) === gateFilter) &&
      (!catFilter || r.category === catFilter) &&
      (!buFilter || r.businessUnit === buFilter) &&
      (!healthFilter || healthByRow.get(r.id)?.status === healthFilter)
    ),
    [rows, q, gateFilter, catFilter, buFilter, healthFilter, healthByRow]
  );

  // ── Portfolio stats ──
  const preKo = rows.filter((r) => !r.koDone).length;
  const onTrack = rows.filter((r) => healthByRow.get(r.id)?.status === 'On Track').length;
  const risk = rows.filter((r) => ['At Risk', 'Delayed'].includes(healthByRow.get(r.id)?.status)).length;
  const avgPct = rows.length ? Math.round(rows.reduce((a, r) => a + npdPct(r), 0) / rows.length) : 0;
  const allTasks = [];
  rows.forEach((r) => (r.tasks || []).forEach((t) => allTasks.push(t)));
  const pendingTasks = allTasks.filter((t) => taskBucket(t.status, t.pct) !== 'done').length;

  const gateDist = GATE_LABELS.map((_, i) => rows.filter((r) => (r.gate || 0) === i).length);
  const maxGateDist = Math.max(1, ...gateDist);

  const create = async () => {
    if (!values.name?.trim()) { toast('Project name required', 'error'); return; }
    try {
      const c = await Npds.create(values);
      toast(`NPD project ${c.code} created`, 'success');
      setOpen(false);
      navigate(`/npd/${c.id}`);
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">NPD Projects</h1>
          <p className="text-sm text-muted-foreground">Gated new product development — AB-0 to AB-7</p>
        </div>
        <div className="flex-1" />
        <Button onClick={() => { setValues({ devType: 'NPD' }); setOpen(true); }}><Plus /> New Project</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatTile
          icon={GitBranch}
          color="#2563eb"
          value={rows.length}
          label="Active Projects"
          caption={preKo ? `${preKo} pre-KO` : 'all kicked off'}
        />
        <StatTile icon={CheckCircle2} color="#059669" value={onTrack} label="On Track" />
        <StatTile
          icon={AlertTriangle}
          color={risk ? '#dc2626' : '#059669'}
          value={risk}
          label="Delayed / At Risk"
        />
        <StatTile
          icon={Clock}
          color={pendingTasks ? '#d97706' : '#059669'}
          value={pendingTasks}
          label="Pending Tasks"
        />
        <StatTile icon={TrendingUp} color="#7c3aed" value={`${avgPct}%`} label="Avg Completion" />
      </div>

      <CollapsibleSection title="Charts & analytics — NPD portfolio" defaultOpen={false}>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Target className="h-4 w-4 text-muted-foreground" />NPD Programs by Gate</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {GATE_LABELS.map((g, i) => (
                <div key={g} className="flex items-center gap-2 text-xs">
                  <div className="w-20 shrink-0 text-muted-foreground">{g}</div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${gateDist[i] ? Math.max((gateDist[i] / maxGateDist) * 100, 8) : 0}%` }} />
                  </div>
                  <div className="w-5 text-right font-medium">{gateDist[i]}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </CollapsibleSection>

      <div className="flex flex-wrap items-center gap-2">
        {GATE_LABELS.map((g, i) => (
          <Badge
            key={g}
            variant={gateFilter === String(i) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setGateFilter(gateFilter === String(i) ? '' : String(i))}
          >
            {g} <span className="ml-1 opacity-70">{gateDist[i]}</span>
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-56" placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={catFilter || 'all'} onValueChange={(v) => setCatFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {NPD_CATS.map((c) => <SelectItem key={c.c} value={c.c}>{c.c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={buFilter || 'all'} onValueChange={(v) => setBuFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Business Units" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Business Units</SelectItem>
            {BUNITS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={healthFilter || 'all'} onValueChange={(v) => setHealthFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Health" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Health</SelectItem>
            {HEALTH_FILTERS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground ml-auto">
          Showing <span className="font-bold text-foreground">{filtered.length}</span> of {rows.length} projects
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>BU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Gate</TableHead>
            <TableHead className="w-44">Progress</TableHead>
            <TableHead>Health</TableHead>
            <TableHead>Launch</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">No NPD projects match your filters</TableCell></TableRow>
          ) : filtered.map((r) => {
            const pct = npdPct(r);
            const health = healthByRow.get(r.id) || npdHealth(r);
            return (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/npd/${r.id}`)}>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.cust || '—'}</TableCell>
                <TableCell>{r.businessUnit || '—'}</TableCell>
                <TableCell>{r.category || '—'}</TableCell>
                <TableCell>{r.owner}</TableCell>
                <TableCell>
                  <Badge variant={r.koDone ? 'default' : 'secondary'}>
                    {GATE_LABELS[r.gate || 0]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="w-28" />
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" style={{ color: health.color, borderColor: health.color }}>{health.status}</Badge>
                </TableCell>
                <TableCell>{fmtDate(r.launch)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New NPD Project</DialogTitle></DialogHeader>
          <FormFields fields={fields} values={values} onChange={setValues} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
