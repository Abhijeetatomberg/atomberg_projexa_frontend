import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Npds } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import FormFields from '@/components/crud/FormFields';
import { toast } from '@/components/toaster';
import { NPD_CATS, BUNITS, DEV_TYPES, GATE_LABELS } from '@/lib/constants';
import { npdPct } from '@/lib/npd';
import { fmtDate } from '@/lib/utils';

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

export default function NpdPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});

  useEffect(() => {
    Npds.list().then(setRows).catch((e) => toast(e.message, 'error')).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => rows.filter((r) => !q || `${r.code} ${r.name} ${r.cust} ${r.owner}`.toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

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
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-56" placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button onClick={() => { setValues({ devType: 'NPD' }); setOpen(true); }}><Plus /> New Project</Button>
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
            <TableHead>Launch</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No NPD projects yet</TableCell></TableRow>
          ) : filtered.map((r) => {
            const pct = npdPct(r);
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
