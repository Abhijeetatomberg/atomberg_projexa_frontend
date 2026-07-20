import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, ArrowRight, Search, FileText, CheckCircle2, Clock, Target, Trash2,
} from 'lucide-react';
import { Ecns, Npds } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import FormFields from '@/components/crud/FormFields';
import { toast } from '@/components/toaster';
import { ECN_STATUS, BUNITS, badgeForStatus } from '@/lib/constants';
import { fmtDate, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

// Simple forward-only workflow — mirrors the RFQ "advance stage" pattern.
// On Hold / Rejected are reachable via the edit dialog's status select.
const FLOW = ['Under Approval', 'Approved', 'Implemented'];

export default function EcnPage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [npds, setNpds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Ecns.list().then(setRows).catch((e) => toast(e.message, 'error')).finally(() => setLoading(false));
    Npds.list().then(setNpds).catch(() => {});
  };
  useEffect(load, []);

  const fields = useMemo(() => ([
    { key: 'ecnNo', label: 'ECN Number', placeholder: 'e.g. ECN-1318' },
    { key: 'projCat', label: 'Business Unit', type: 'select', options: BUNITS },
    {
      key: 'proj', label: 'Project', span: npds.length ? 1 : 2,
      type: npds.length ? 'select' : 'text', options: npds.map((n) => n.name),
    },
    { key: 'status', label: 'Status', type: 'select', options: ECN_STATUS },
    { key: 'desc', label: 'Change Description', type: 'textarea', placeholder: 'What is changing and why' },
    { key: 'ecrAvail', label: 'ECR Available?', placeholder: 'Yes (ECR-0644) / No' },
    { key: 'creator', label: 'Creator' },
    { key: 'ecnDate', label: 'ECN Date', type: 'date' },
    { key: 'approvedDate', label: 'Approved Date', type: 'date' },
    { key: 'plannedDate', label: 'Planned Implementation', type: 'date' },
    { key: 'implDate', label: 'Implementation Date', type: 'date' },
    { key: 'bomPart', label: 'BOM Part Affected' },
    { key: 'stockLine', label: 'Stock at Line' },
    { key: 'stockStore', label: 'Stock at Store / Supplier' },
    { key: 'newPartInward', label: 'New Part Inward Date', type: 'date' },
  ]), [npds]);

  const cats = useMemo(() => [...new Set(rows.map((r) => r.projCat).filter(Boolean))], [rows]);

  const filtered = useMemo(() => rows.filter((r) =>
    (!catFilter || r.projCat === catFilter) &&
    (!statusFilter || r.status === statusFilter) &&
    (!q || `${r.ecnNo} ${r.proj} ${r.desc} ${r.creator} ${r.bomPart}`.toLowerCase().includes(q.toLowerCase()))
  ), [rows, catFilter, statusFilter, q]);

  const statusCounts = useMemo(() => {
    const c = {};
    rows.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [rows]);

  const npdIdFor = (name) => npds.find((n) => n.name === name)?.id;

  const openCreate = () => { setEditing(null); setValues({ status: 'Under Approval' }); setOpen(true); };
  const openEdit = (r) => { if (!isAdmin) return; setEditing(r); setValues(r); setOpen(true); };

  const save = async () => {
    if (!values.ecnNo?.trim() && !values.desc?.trim()) {
      toast('ECN number or description is required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const u = await Ecns.update(editing.id, values);
        setRows((p) => p.map((r) => (r.id === u.id ? u : r)));
        toast('ECN updated', 'success');
      } else {
        const c = await Ecns.create({ status: 'Under Approval', files: [], ...values });
        setRows((p) => [...p, c]);
        toast('ECN added', 'success');
      }
      setOpen(false);
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (r, status) => {
    try {
      const u = await Ecns.update(r.id, { status });
      setRows((p) => p.map((x) => (x.id === u.id ? u : x)));
      toast(`Status set to ${status}`, 'success');
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const advance = (r) => {
    const i = FLOW.indexOf(r.status);
    if (i >= 0 && i < FLOW.length - 1) setStatus(r, FLOW[i + 1]);
  };

  const removeRow = async (r) => {
    if (!confirm(`Remove ECN ${r.ecnNo || ''}?`)) return;
    try {
      await Ecns.remove(r.id);
      setRows((p) => p.filter((x) => x.id !== r.id));
      toast('ECN removed', 'success');
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  const removeEditing = async () => {
    if (!editing || !confirm(`Remove ECN ${editing.ecnNo || ''}?`)) return;
    await removeRow(editing);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">ECN Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Engineering Change Notice register — approvals, affected BOM parts &amp; stock disposition
          </p>
        </div>
        <div className="flex-1" />
        {isAdmin && <Button onClick={openCreate}><Plus /> Add ECN</Button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={FileText} color="#334155" value={rows.length} label="Total ECNs" />
        <StatTile icon={CheckCircle2} color="#059669" value={rows.filter((r) => r.status === 'Approved').length} label="Approved" />
        <StatTile icon={Clock} color="#d97706" value={rows.filter((r) => r.status === 'Under Approval').length} label="Under Approval" />
        <StatTile icon={Target} color="#2563eb" value={rows.filter((r) => r.status === 'Implemented').length} label="Implemented" />
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {ECN_STATUS.map((s) => (
          <Card
            key={s}
            className={cn('cursor-pointer transition-shadow hover:shadow-elevated', statusFilter === s && 'ring-2 ring-primary')}
            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
          >
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold leading-none">{statusCounts[s] || 0}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{s}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {cats.length > 0 && (
          <Select value={catFilter || 'all'} onValueChange={(v) => setCatFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories ({rows.length})</SelectItem>
              {cats.map((c) => (
                <SelectItem key={c} value={c}>{c} ({rows.filter((r) => r.projCat === c).length})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-64" placeholder="Search ECN no, project, description…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="text-sm text-muted-foreground ml-auto">
          Showing <span className="font-bold text-foreground">{filtered.length}</span> of {rows.length} ECNs
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ECN No.</TableHead>
              <TableHead>BU</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>ECN Date</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>Planned Impl.</TableHead>
              <TableHead>Implemented</TableHead>
              <TableHead>BOM Part</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={12} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={12} className="py-10 text-center text-muted-foreground">
                {rows.length === 0 ? 'No ECNs yet.' : 'No ECNs match this filter.'}
              </TableCell></TableRow>
            ) : filtered.map((r) => {
              const npdId = npdIdFor(r.proj);
              const canAdvance = isAdmin && FLOW.includes(r.status) && r.status !== FLOW[FLOW.length - 1];
              return (
                <TableRow
                  key={r.id}
                  className={cn(isAdmin && 'cursor-pointer')}
                  onClick={() => openEdit(r)}
                >
                  <TableCell className="font-mono text-xs whitespace-nowrap">{r.ecnNo || '—'}</TableCell>
                  <TableCell>{r.projCat || '—'}</TableCell>
                  <TableCell>
                    {npdId ? (
                      <Link to={`/npd/${npdId}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        {r.proj}
                      </Link>
                    ) : (r.proj || '—')}
                  </TableCell>
                  <TableCell><Badge variant="outline" className={badgeForStatus(r.status)}>{r.status}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate" title={r.desc}>{r.desc || '—'}</TableCell>
                  <TableCell>{r.creator || '—'}</TableCell>
                  <TableCell>{fmtDate(r.ecnDate)}</TableCell>
                  <TableCell>{fmtDate(r.approvedDate)}</TableCell>
                  <TableCell>{fmtDate(r.plannedDate)}</TableCell>
                  <TableCell>{fmtDate(r.implDate)}</TableCell>
                  <TableCell>{r.bomPart || '—'}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      {canAdvance && (
                        <Button size="sm" variant="outline" onClick={() => advance(r)}>
                          {FLOW[FLOW.indexOf(r.status) + 1]} <ArrowRight />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Remove" onClick={() => removeRow(r)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ECN ${editing.ecnNo || ''}` : 'Add ECN'}</DialogTitle>
          </DialogHeader>
          <FormFields fields={fields} values={values} onChange={setValues} />
          <DialogFooter className="gap-2">
            {editing && <Button variant="destructive" className="mr-auto" onClick={removeEditing}><Trash2 /> Delete</Button>}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : (editing ? 'Save' : 'Add ECN')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
