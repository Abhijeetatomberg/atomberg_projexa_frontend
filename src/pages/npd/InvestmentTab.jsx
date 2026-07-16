import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Investments } from '@/api/resources';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import FormFields from '@/components/crud/FormFields';
import { toast } from '@/components/toaster';
import { lakh } from '@/lib/utils';

const fields = [
  { key: 'process', label: 'Process' },
  { key: 'mftg', label: 'MFTG Details' },
  { key: 'tool', label: 'Tool / Machine / Instrument', span: 2 },
  { key: 'numbers', label: 'Numbers', type: 'number' },
  { key: 'investment', label: 'Investment (₹)', type: 'number' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'leadTime', label: 'Dev Lead Time' },
];

export default function InvestmentTab({ project }) {
  const [items, setItems] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [vals, setVals] = useState({});

  const load = () => Investments.list().then((all) => setItems(all.filter((i) => i.proj === project.name))).catch((e) => toast(e.message, 'error'));
  useEffect(() => { load(); }, [project.name]);

  const total = items.reduce((a, b) => a + (+b.investment || 0), 0);

  const addItem = async () => {
    if (!vals.process?.trim() && !vals.tool?.trim()) { toast('Process or tool required', 'error'); return; }
    try {
      await Investments.create({ ...vals, proj: project.name });
      toast('Investment added', 'success');
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
        <p className="text-sm text-muted-foreground">Total investment: <b className="text-foreground">{lakh(total)}</b> across {items.length} item{items.length === 1 ? '' : 's'}.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/investment">Open full Investment</Link></Button>
          <Button size="sm" onClick={() => { setVals({}); setAddOpen(true); }}><Plus /> Add Investment</Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Process</TableHead>
            <TableHead>MFTG Details</TableHead>
            <TableHead>Tool / Machine / Instrument</TableHead>
            <TableHead>Numbers</TableHead>
            <TableHead>Investment</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Lead Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No investment items for this project yet.</TableCell></TableRow>
          ) : items.map((i) => (
            <TableRow key={i.id}>
              <TableCell className="font-medium">{i.process || '—'}</TableCell>
              <TableCell>{i.mftg || '—'}</TableCell>
              <TableCell>{i.tool || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{i.numbers}</TableCell>
              <TableCell>{lakh(i.investment)}</TableCell>
              <TableCell className="text-muted-foreground">{i.supplier || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{i.leadTime || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Investment — {project.name}</DialogTitle></DialogHeader>
          <FormFields fields={fields} values={vals} onChange={setVals} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addItem}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
