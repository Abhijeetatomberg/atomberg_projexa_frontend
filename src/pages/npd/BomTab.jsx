import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BomParts } from '@/api/resources';
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
import { BOM_TYPE, BOM_COMMON, BOM_OST, BOM_FPA, badgeForStatus } from '@/lib/constants';

const fields = [
  { key: 'pno', label: 'Part Number' },
  { key: 'desc', label: 'Description', span: 2 },
  { key: 'type', label: 'Type', type: 'select', options: BOM_TYPE },
  { key: 'common', label: 'New / Old / ECN', type: 'select', options: BOM_COMMON },
  { key: 'qty', label: 'Qty per Assy' },
  { key: 'ost', label: 'Overall Status', type: 'select', options: BOM_OST },
  { key: 'sourcing', label: 'Sourcing Owner' },
  { key: 'toolMaker', label: 'Tool Maker' },
  { key: 'partMaker', label: 'Part Maker' },
  { key: 'fpaStatus', label: 'FPA Status', type: 'select', options: BOM_FPA },
];

export default function BomTab({ project }) {
  const [parts, setParts] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [vals, setVals] = useState({});

  const load = () => BomParts.list().then((all) => setParts(all.filter((b) => b.proj === project.name))).catch((e) => toast(e.message, 'error'));
  useEffect(() => { load(); }, [project.name]);

  const addPart = async () => {
    if (!vals.desc?.trim()) { toast('Description required', 'error'); return; }
    try {
      await BomParts.create({ ...vals, proj: project.name });
      toast('Part added', 'success');
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
        <p className="text-sm text-muted-foreground">{parts.length} part{parts.length === 1 ? '' : 's'} linked to this project — same data as the BOM Tracker module.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/bom">Open full BOM Tracker</Link></Button>
          <Button size="sm" onClick={() => { setVals({}); setAddOpen(true); }}><Plus /> Add Part</Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Part No</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sourcing</TableHead>
            <TableHead>Tool Maker</TableHead>
            <TableHead>FPA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No BOM parts linked yet.</TableCell></TableRow>
          ) : parts.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="text-muted-foreground">{b.pno || '—'}</TableCell>
              <TableCell className="font-medium">{b.desc}</TableCell>
              <TableCell><Badge variant="secondary">{b.type}</Badge></TableCell>
              <TableCell><Badge variant="outline" className={badgeForStatus(b.ost)}>{b.ost || '—'}</Badge></TableCell>
              <TableCell>{b.sourcing || '—'}</TableCell>
              <TableCell>{b.toolMaker || b.partMaker || '—'}</TableCell>
              <TableCell>{b.fpaStatus || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add BOM Part — {project.name}</DialogTitle></DialogHeader>
          <FormFields fields={fields} values={vals} onChange={setVals} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addPart}>Add Part</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
