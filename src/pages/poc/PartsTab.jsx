import { useEffect, useState } from 'react';
import { Plus, Trash2, Box, CheckCircle2, Clock, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatTile from '@/components/ui/stat-tile';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BOM_TYPE, POC_SRC, POC_PROC, POC_USED } from '@/lib/constants';

// Proto parts are stored directly on the POC row (project.parts) — updated via onSave.
// Mirrored into local state (synced only on project switch) so rapid edits build on
// the latest edit instead of racing the parent's in-flight patch().
export default function PartsTab({ project, onSave }) {
  const [parts, setParts] = useState(() => project.parts || []);
  useEffect(() => { setParts(project.parts || []); }, [project.id]);
  const nextId = () => (parts.reduce((m, x) => Math.max(m, x.id || 0), 0) || 0) + 1;

  const set = (id, field, val) => {
    const next = parts.map((pt) => (pt.id === id ? { ...pt, [field]: val } : pt));
    setParts(next);
    onSave(next);
  };
  const remove = (id) => {
    const next = parts.filter((pt) => pt.id !== id);
    setParts(next);
    onSave(next);
  };
  const add = () => {
    const next = [...parts, { id: nextId(), pno: '', desc: '', type: 'Dev', qty: '1', source: 'Bought-out', proc: 'To procure', usedIn: 'Alpha', leadTime: '', remarks: '', updates: '' }];
    setParts(next);
    onSave(next);
  };

  const cnt = (s) => parts.filter((x) => x.proc === s).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={Box} color="#2563eb" value={parts.length} label="Proto Parts" />
        <StatTile icon={CheckCircle2} color="#059669" value={cnt('Received')} label="Received" />
        <StatTile icon={Clock} color="#d97706" value={cnt('Ordered')} label="Ordered" />
        <StatTile icon={PackageSearch} color="#64748b" value={cnt('To procure')} label="To Procure" />
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Proto BOM / availability tracking for this POC.</p>
        <Button size="sm" onClick={add}><Plus /> Add Part</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Part No</TableHead><TableHead>Description</TableHead><TableHead>Dev/BO</TableHead>
            <TableHead>Qty</TableHead><TableHead>Source</TableHead><TableHead>Procurement</TableHead>
            <TableHead>Used In</TableHead><TableHead>Lead Time</TableHead><TableHead>Remarks</TableHead><TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.length === 0 ? (
            <TableRow><TableCell colSpan={10} className="py-8 text-center text-muted-foreground">No proto parts yet.</TableCell></TableRow>
          ) : parts.map((pt) => (
            <TableRow key={pt.id}>
              <TableCell><Input className="h-8 w-24" value={pt.pno || ''} onChange={(e) => set(pt.id, 'pno', e.target.value)} /></TableCell>
              <TableCell><Input className="h-8 w-40" value={pt.desc || ''} onChange={(e) => set(pt.id, 'desc', e.target.value)} /></TableCell>
              <TableCell>
                <Select value={pt.type || 'Dev'} onValueChange={(v) => set(pt.id, 'type', v)}>
                  <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>{BOM_TYPE.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell><Input className="h-8 w-16" value={pt.qty || ''} onChange={(e) => set(pt.id, 'qty', e.target.value)} /></TableCell>
              <TableCell>
                <Select value={pt.source || 'Bought-out'} onValueChange={(v) => set(pt.id, 'source', v)}>
                  <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>{POC_SRC.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select value={pt.proc || 'To procure'} onValueChange={(v) => set(pt.id, 'proc', v)}>
                  <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>{POC_PROC.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select value={pt.usedIn || 'Alpha'} onValueChange={(v) => set(pt.id, 'usedIn', v)}>
                  <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>{POC_USED.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell><Input className="h-8 w-24" value={pt.leadTime || ''} onChange={(e) => set(pt.id, 'leadTime', e.target.value)} /></TableCell>
              <TableCell><Input className="h-8 w-36" value={pt.remarks || ''} onChange={(e) => set(pt.id, 'remarks', e.target.value)} /></TableCell>
              <TableCell>
                <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => remove(pt.id)}><Trash2 className="h-3.5 w-3.5" /></button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
