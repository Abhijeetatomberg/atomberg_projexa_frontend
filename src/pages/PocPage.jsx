import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Pocs } from '@/api/resources';
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
import { POC_STAGE_LABELS } from '@/lib/constants';
import { pocPct } from '@/lib/poc';
import { fmtDate } from '@/lib/utils';

const fields = [
  { key: 'name', label: 'POC Name', span: 2 },
  { key: 'cust', label: 'Customer' },
  { key: 'app', label: 'Application' },
  { key: 'owner', label: 'Owner' },
  { key: 'reqDate', label: 'Requirement Date', type: 'date' },
  { key: 'sampleBy', label: 'Samples Needed By', type: 'date' },
  { key: 'sampleQty', label: 'Sample Qty' },
];

export default function PocPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});

  useEffect(() => {
    Pocs.list().then(setRows).catch((e) => toast(e.message, 'error')).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => rows.filter((r) => !q || `${r.code} ${r.name} ${r.cust} ${r.owner}`.toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

  const create = async () => {
    if (!values.name?.trim()) { toast('POC name required', 'error'); return; }
    try {
      const c = await Pocs.create({ ...values, created: new Date().toISOString().slice(0, 10) });
      toast(`POC ${c.code} created`, 'success');
      setOpen(false);
      navigate(`/poc/${c.id}`);
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">POC Projects</h1>
          <p className="text-sm text-muted-foreground">Proof-of-concept builds before tool-up — KO → Alpha → Beta → Customer approval</p>
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-56" placeholder="Search POCs…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button onClick={() => { setValues({}); setOpen(true); }}><Plus /> New POC</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>POC</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Application</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="w-44">Progress</TableHead>
            <TableHead>Samples By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No POC projects yet</TableCell></TableRow>
          ) : filtered.map((r) => {
            const pct = pocPct(r);
            return (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/poc/${r.id}`)}>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell className="font-medium">
                  {r.name}
                  {r.promotedTo && <Badge variant="secondary" className="ml-2">→ {r.promotedTo}</Badge>}
                </TableCell>
                <TableCell>{r.cust || '—'}</TableCell>
                <TableCell>{r.app || '—'}</TableCell>
                <TableCell>{r.owner}</TableCell>
                <TableCell>
                  <Badge variant={r.koDone ? 'default' : 'secondary'}>{POC_STAGE_LABELS[r.stage || 0]}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="w-28" />
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                </TableCell>
                <TableCell>{fmtDate(r.sampleBy)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>New POC Project</DialogTitle></DialogHeader>
          <FormFields fields={fields} values={values} onChange={setValues} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create POC</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
