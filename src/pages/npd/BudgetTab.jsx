import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BudgetItems } from '@/api/resources';
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
import { BUDGET_CATS } from '@/lib/constants';
import { lakh } from '@/lib/utils';

const fields = [
  { key: 'desc', label: 'Description', span: 2 },
  { key: 'cat', label: 'Category', type: 'select', options: BUDGET_CATS },
  { key: 'planned', label: 'Planned (₹)', type: 'number' },
  { key: 'actual', label: 'Actual (₹)', type: 'number' },
];

export default function BudgetTab({ project }) {
  const [items, setItems] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [vals, setVals] = useState({});

  const load = () => BudgetItems.list().then((all) => setItems(all.filter((b) => b.proj === project.name))).catch((e) => toast(e.message, 'error'));
  useEffect(() => { load(); }, [project.name]);

  const planned = items.reduce((a, b) => a + (+b.planned || 0), 0);
  const actual = items.reduce((a, b) => a + (+b.actual || 0), 0);
  const variance = planned - actual;

  const addItem = async () => {
    if (!vals.desc?.trim()) { toast('Description required', 'error'); return; }
    try {
      await BudgetItems.create({ ...vals, proj: project.name, npd: project.code });
      toast('Budget item added', 'success');
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
        <p className="text-sm text-muted-foreground">
          Planned <b className="text-foreground">{lakh(planned)}</b> · Actual <b className="text-foreground">{lakh(actual)}</b> ·
          Variance <b className={variance >= 0 ? 'text-emerald-600' : 'text-red-600'}>{variance >= 0 ? '+' : ''}{lakh(Math.abs(variance))}</b>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/budget">Open full Budget</Link></Button>
          <Button size="sm" onClick={() => { setVals({}); setAddOpen(true); }}><Plus /> Add Budget Item</Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Planned</TableHead>
            <TableHead>Actual</TableHead>
            <TableHead>Variance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No budget items for this project yet.</TableCell></TableRow>
          ) : items.map((b) => {
            const v = (+b.planned || 0) - (+b.actual || 0);
            return (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.desc}</TableCell>
                <TableCell><Badge variant="secondary">{b.cat}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{lakh(b.planned)}</TableCell>
                <TableCell>{lakh(b.actual)}</TableCell>
                <TableCell className={v >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>{v >= 0 ? '+' : ''}{lakh(Math.abs(v))}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Budget Item — {project.name}</DialogTitle></DialogHeader>
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
