import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, RefreshCw, Factory, CheckCircle2, Clock, AlertTriangle,
} from 'lucide-react';
import { LineRows, Npds } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import FormFields from '@/components/crud/FormFields';
import CollapsibleSection from '@/components/ui/collapsible-section';
import StatTile from '@/components/ui/stat-tile';
import Donut from '@/components/charts/Donut';
import StackedBarList from '@/components/charts/StackedBarList';
import { toast } from '@/components/toaster';
import { LR_EXIST, LR_READY, LR_MS, badgeForStatus } from '@/lib/constants';

const PHASE_LABEL = { src: 'Sourcing', build: 'Build / trials', val: 'Install / validate' };
const PHASE_COLOR = { src: '#2563eb', build: '#d97706', val: '#059669' };
const PHASES = ['src', 'build', 'val'];

const mainFields = (projOptions) => [
  {
    key: 'proj', label: 'Project', span: 2,
    ...(projOptions.length ? { type: 'select', options: projOptions } : {}),
  },
  { key: 'process', label: 'Process' },
  { key: 'bomPart', label: 'BOM Part / Resp' },
  { key: 'existing', label: 'Existing / New', type: 'select', options: LR_EXIST },
  { key: 'readiness', label: 'Overall Readiness', type: 'select', options: LR_READY },
  { key: 'machine', label: 'Machine' },
  { key: 'fixture', label: 'Fixture' },
  { key: 'tools', label: 'Tools' },
  { key: 'gauge', label: 'Gauge' },
  { key: 'cycleTime', label: 'Cycle Time' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'remarks', label: 'Remarks', type: 'textarea' },
];

const READY_COLOR = {
  'Not Started': '#94a3b8', 'In Progress': '#2563eb', Ready: '#059669',
  'At Risk': '#ea580c', Delayed: '#dc2626', Completed: '#059669',
};

const ensureMs = (ms) => {
  const out = {};
  LR_MS.forEach(([k]) => { out[k] = { plan: ms?.[k]?.plan || '', actual: ms?.[k]?.actual || '' }; });
  return out;
};
const msDoneCount = (r) => LR_MS.filter(([k]) => r.ms?.[k]?.actual).length;
const phasePct = (r, phase) => {
  const keys = LR_MS.filter(([, , p]) => p === phase);
  const done = keys.filter(([k]) => r.ms?.[k]?.actual).length;
  return keys.length ? Math.round((done / keys.length) * 100) : 0;
};

const defaults = { existing: 'New', readiness: 'Not Started' };

export default function LinePage() {
  const [rows, setRows] = useState([]);
  const [npds, setNpds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [projFilter, setProjFilter] = useState('');
  const [readyFilter, setReadyFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(defaults);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await LineRows.list());
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    Npds.list().then(setNpds).catch(() => {});
  }, []);

  const projOptions = useMemo(() => {
    const fromNpd = npds.map((n) => n.name);
    const fromRows = rows.map((r) => r.proj).filter(Boolean);
    return [...new Set([...fromNpd, ...fromRows])];
  }, [npds, rows]);

  const fields = useMemo(() => mainFields(projOptions), [projOptions]);

  const searchKeys = ['proj', 'process', 'machine', 'supplier', 'bomPart'];
  const filtered = useMemo(() => {
    let list = rows;
    if (projFilter) list = list.filter((r) => r.proj === projFilter);
    if (readyFilter) list = list.filter((r) => r.readiness === readyFilter);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((r) => searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(s)));
    }
    return list;
  }, [rows, q, projFilter, readyFilter]);

  // ── Portfolio-wide stats & charts ──
  const ready = rows.filter((l) => ['Ready', 'Completed'].includes(l.readiness)).length;
  const inProgress = rows.filter((l) => l.readiness === 'In Progress').length;
  const atRisk = rows.filter((l) => ['At Risk', 'Delayed'].includes(l.readiness)).length;

  const readyCounts = {};
  rows.forEach((l) => { readyCounts[l.readiness || 'Not Started'] = (readyCounts[l.readiness || 'Not Started'] || 0) + 1; });
  const readySegs = Object.keys(readyCounts).map((k) => ({ label: k, value: readyCounts[k], color: READY_COLOR[k] || '#94a3b8' }));

  const projects = [...new Set(rows.map((l) => l.proj).filter(Boolean))];
  const readyByProjectItems = projects.map((pr) => {
    const arr = rows.filter((l) => l.proj === pr);
    return {
      label: pr,
      segments: LR_READY.map((st) => ({ value: arr.filter((l) => l.readiness === st).length, color: READY_COLOR[st] || '#94a3b8', title: st })),
    };
  });

  const pipeline = LR_MS.map(([key, label, phase]) => {
    const done = rows.filter((l) => l.ms?.[key]?.actual).length;
    const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;
    return { key, label, phase, done, pct };
  });

  const flagged = rows.filter((l) => l.readiness === 'Delayed' || l.readiness === 'At Risk').slice(0, 8);

  // ── CRUD ──
  const openCreate = () => { setEditing(null); setValues({ ...defaults, ms: ensureMs() }); setOpen(true); };
  const openEdit = (row) => { setEditing(row); setValues({ ...row, ms: ensureMs(row.ms) }); setOpen(true); };
  const setMs = (key, kind, val) => setValues((v) => ({ ...v, ms: { ...v.ms, [key]: { ...v.ms?.[key], [kind]: val } } }));

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        const updated = await LineRows.update(editing.id, values);
        setRows((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
        toast('Updated', 'success');
      } else {
        const created = await LineRows.create(values);
        setRows((prev) => [...prev, created]);
        toast('Created', 'success');
      }
      setOpen(false);
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    if (!confirm('Delete this process row? This cannot be undone.')) return;
    try {
      await LineRows.remove(editing.id);
      setRows((prev) => prev.filter((r) => r.id !== editing.id));
      toast('Deleted', 'success');
      setOpen(false);
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">Line Readiness</h1>
          <p className="text-sm text-muted-foreground">Process, tooling &amp; validation readiness per assembly line</p>
        </div>
        <div className="flex-1" />
        <Button onClick={openCreate}><Plus /> Add Process</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={Factory} color="#0f172a" value={rows.length} label="Processes / Lines" />
        <StatTile icon={CheckCircle2} color="#059669" value={ready} label="Ready" />
        <StatTile icon={Clock} color="#2563eb" value={inProgress} label="In Progress" />
        <StatTile icon={AlertTriangle} color={atRisk ? '#dc2626' : '#059669'} value={atRisk} label="At Risk / Delayed" />
      </div>

      <CollapsibleSection title="Charts & analytics — Line Readiness portfolio">
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Readiness Distribution</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-6 flex-wrap justify-center">
              <Donut segments={readySegs} centerLabel="processes" />
              <div className="space-y-1 text-xs">
                {readySegs.length ? readySegs.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ background: s.color }} />
                    {s.label} <b>{s.value}</b>
                  </div>
                )) : <span className="text-muted-foreground">No data yet</span>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Readiness by Project</CardTitle></CardHeader>
            <CardContent>
              <StackedBarList items={readyByProjectItems} />
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-3">
                {LR_READY.map((st) => (
                  <span key={st} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full inline-block" style={{ background: READY_COLOR[st] || '#94a3b8' }} />{st}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Readiness Milestone Pipeline</CardTitle>
            <div className="flex gap-3 text-[11px] text-muted-foreground">
              {PHASES.map((p) => (
                <span key={p} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full inline-block" style={{ background: PHASE_COLOR[p] }} />{PHASE_LABEL[p]}</span>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {pipeline.map((m) => (
              <div key={m.key} className="flex items-center gap-2 text-xs">
                <div className="w-52 shrink-0 text-muted-foreground truncate" title={m.label}>{m.label}</div>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: PHASE_COLOR[m.phase] }} />
                </div>
                <div className="w-10 text-right font-medium">{m.done}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Processes Flagged — At Risk / Delayed</CardTitle></CardHeader>
          <CardContent>
            {flagged.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No at-risk or delayed processes 🎉</p>
            ) : (
              <div className="space-y-2">
                {flagged.map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-xs p-2 rounded bg-red-50 cursor-pointer" onClick={() => openEdit(l)}>
                    <span className="font-medium">{l.proj} · {l.process}</span>
                    <Badge variant="outline" className={badgeForStatus(l.readiness)}>{l.readiness}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleSection>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={projFilter || '__all'} onValueChange={(v) => setProjFilter(v === '__all' ? '' : v)}>
          <SelectTrigger className="w-56"><SelectValue placeholder="All Projects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Projects</SelectItem>
            {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={readyFilter || '__all'} onValueChange={(v) => setReadyFilter(v === '__all' ? '' : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Readiness" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Readiness</SelectItem>
            {LR_READY.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-56" placeholder="Search process, machine, supplier…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button variant="outline" size="icon" onClick={load} title="Reload"><RefreshCw className="h-4 w-4" /></Button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">Showing {filtered.length} of {rows.length} processes</span>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          Failed to load: {error}. Is the backend running on port 4000?
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Process</TableHead>
            <TableHead>BOM Part / Resp</TableHead>
            <TableHead>Existing/New</TableHead>
            <TableHead>Machine</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Readiness</TableHead>
            <TableHead>Milestones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No records yet</TableCell></TableRow>
          ) : filtered.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => openEdit(r)}>
              <TableCell>{r.proj || '—'}</TableCell>
              <TableCell className="font-medium">{r.process || '—'}</TableCell>
              <TableCell>{r.bomPart || '—'}</TableCell>
              <TableCell>{r.existing || '—'}</TableCell>
              <TableCell>{r.machine || '—'}</TableCell>
              <TableCell>{r.supplier || '—'}</TableCell>
              <TableCell><Badge variant="outline" className={badgeForStatus(r.readiness)}>{r.readiness || '—'}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{msDoneCount(r)}/{LR_MS.length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit Process — ${editing.process || ''}` : 'Add Process'}</DialogTitle>
          </DialogHeader>
          <FormFields fields={fields} values={values} onChange={setValues} />

          <div className="space-y-2">
            <span className="text-sm font-medium">Readiness Milestones</span>
            {PHASES.map((phase) => (
              <div key={phase} className="rounded-md border divide-y">
                <div className="grid grid-cols-[1fr_120px_120px] gap-2 px-3 py-1.5 text-[11px] font-medium bg-muted/50">
                  <span style={{ color: PHASE_COLOR[phase] }}>{PHASE_LABEL[phase]} — {phasePct(values, phase)}%</span>
                  <span className="text-muted-foreground">Plan</span><span className="text-muted-foreground">Actual</span>
                </div>
                {LR_MS.filter(([, , p]) => p === phase).map(([key, label]) => (
                  <div key={key} className="grid grid-cols-[1fr_120px_120px] gap-2 px-3 py-1.5 items-center text-xs">
                    <span className="truncate" title={label}>{label}</span>
                    <Input type="date" className="h-7 text-xs" value={values.ms?.[key]?.plan || ''} onChange={(e) => setMs(key, 'plan', e.target.value)} />
                    <Input type="date" className="h-7 text-xs" value={values.ms?.[key]?.actual || ''} onChange={(e) => setMs(key, 'actual', e.target.value)} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            {editing && <Button variant="destructive" onClick={remove} className="mr-auto">Delete</Button>}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
