import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Resources } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/toaster';

const LOC_OPTS = ['AIC', 'Plant', 'Customer end'];
const ROLE_OPTS = ['Electrical', 'Mechanical', 'PED', 'Quality', 'Production', 'Sourcing', 'Vendor Dev', 'PM'];

// Roster stored directly on the NPD project row (project.npdRes) — updated via onSave.
// Roster is mirrored into local state (synced only on project switch, not every
// prop refresh) so rapid consecutive edits build on the latest edit instead of
// racing against the parent's in-flight patch() and silently dropping changes.
export default function ResourcesTab({ project, onSave }) {
  const [pool, setPool] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [roster, setRoster] = useState(() => project.npdRes || []);

  useEffect(() => { Resources.list().then(setPool).catch(() => {}); }, []);
  useEffect(() => { setRoster(project.npdRes || []); }, [project.id]);

  const set = (i, field, val) => {
    const next = roster.map((r, ix) => (ix === i ? { ...r, [field]: val } : r));
    setRoster(next);
    onSave(next);
  };
  const remove = (i) => {
    const next = roster.filter((_, ix) => ix !== i);
    setRoster(next);
    onSave(next);
  };
  const addResource = () => {
    if (!name.trim()) { toast('Enter a name', 'error'); return; }
    const r = pool.find((x) => x.name === name.trim());
    const next = [...roster, { name: name.trim(), location: 'AIC', process: '', role: r?.role || '', startDate: '', endDate: '', efforts: '', remarks: '' }];
    setRoster(next);
    onSave(next);
    setAddOpen(false);
    setName('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Team allocated to this project — location, process, effort % and remarks.</p>
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus /> Add Resource</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Process</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>% Effort</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {roster.length === 0 ? (
            <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">No resources. Add team members via the Charter, or add one here.</TableCell></TableRow>
          ) : roster.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>
                <Select value={r.location || 'AIC'} onValueChange={(v) => set(i, 'location', v)}>
                  <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>{LOC_OPTS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell><Input className="h-8 w-28" value={r.process || ''} onChange={(e) => set(i, 'process', e.target.value)} /></TableCell>
              <TableCell>
                <Select value={r.role || undefined} onValueChange={(v) => set(i, 'role', v)}>
                  <SelectTrigger className="h-8 w-28"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{ROLE_OPTS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell><Input type="date" className="h-8 w-36" value={r.startDate || ''} onChange={(e) => set(i, 'startDate', e.target.value)} /></TableCell>
              <TableCell><Input type="date" className="h-8 w-36" value={r.endDate || ''} onChange={(e) => set(i, 'endDate', e.target.value)} /></TableCell>
              <TableCell><Input className="h-8 w-16" placeholder="%" value={r.efforts || ''} onChange={(e) => set(i, 'efforts', e.target.value)} /></TableCell>
              <TableCell><Input className="h-8 w-36" value={r.remarks || ''} onChange={(e) => set(i, 'remarks', e.target.value)} /></TableCell>
              <TableCell>
                <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => remove(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Resource</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <Input list="npd-res-pool" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <datalist id="npd-res-pool">
              {pool.filter((r) => !roster.find((x) => x.name === r.name)).map((r) => <option key={r.id} value={r.name} />)}
            </datalist>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addResource}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
