import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineRows } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import FormFields from '@/components/crud/FormFields';
import { toast } from '@/components/toaster';
import { LR_EXIST, LR_READY, badgeForStatus } from '@/lib/constants';

const fields = [
  { key: 'process', label: 'Process', span: 2 },
  { key: 'bomPart', label: 'BOM Part / Resp' },
  { key: 'existing', label: 'Existing / New', type: 'select', options: LR_EXIST },
  { key: 'readiness', label: 'Overall Readiness', type: 'select', options: LR_READY },
  { key: 'machine', label: 'Machine' },
  { key: 'supplier', label: 'Supplier' },
];

export default function LineTab({ project }) {
  const [rows, setRows] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [vals, setVals] = useState({});

  const load = () => LineRows.list().then((all) => setRows(all.filter((l) => l.proj === project.name))).catch((e) => toast(e.message, 'error'));
  useEffect(() => { load(); }, [project.name]);

  const addRow = async () => {
    if (!vals.process?.trim()) { toast('Process required', 'error'); return; }
    try {
      await LineRows.create({ ...vals, proj: project.name });
      toast('Process added', 'success');
      setAddOpen(false);
      setVals({});
      load();
    } catch (e) {
      toast(e.response?.data?.error || e.message, 'error');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} process{rows.length === 1 ? '' : 'es'} linked to this project.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/line">Open full Line Readiness</Link></Button>
          <Button size="sm" onClick={() => { setVals({}); setAddOpen(true); }}><Plus /> Add Process</Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Process</TableHead>
            <TableHead>BOM Part / Resp</TableHead>
            <TableHead>Existing/New</TableHead>
            <TableHead>Readiness</TableHead>
            <TableHead>Machine</TableHead>
            <TableHead>Supplier</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No line processes linked yet.</TableCell></TableRow>
          ) : rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.process}</TableCell>
              <TableCell className="text-muted-foreground">{r.bomPart || '—'}</TableCell>
              <TableCell>{r.existing}</TableCell>
              <TableCell><Badge variant="outline" className={badgeForStatus(r.readiness)}>{r.readiness}</Badge></TableCell>
              <TableCell>{r.machine || '—'}</TableCell>
              <TableCell>{r.supplier || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Line Process — {project.name}</DialogTitle></DialogHeader>
          <FormFields fields={fields} values={vals} onChange={setVals} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addRow}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
