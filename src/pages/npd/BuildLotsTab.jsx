import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { badgeForStatus } from '@/lib/constants';

// Part build progression, mirrors the legacy app's BUILD_LOTS_DEF / ensureBuildLots.
const BUILD_LOTS_DEF = [
  { key: 'ots', name: 'Off-Tool / Off-Process (OTS)', gate: 'AB-4', hint: 'Initial parts from production tooling, off the production line/process.' },
  { key: 'pilot', name: 'Pilot Lot (Pre-production / Run-at-Rate)', gate: 'AB-6', hint: 'Production tooling + production process; run-at-rate.' },
  { key: 'ppap', name: 'PPAP (Significant Production Run + PSW)', gate: 'AB-7', hint: 'Significant production run; PPAP submission & customer PSW approval.' },
  { key: 'ramp', name: 'Ramp-Up', gate: 'AB-7', hint: 'Volume ramp to full rate after PPAP approval.' },
];
const BUILD_ST = ['Not Started', 'Planned', 'Built', 'Approved', 'Rejected'];

const ensureLots = (lots = []) => BUILD_LOTS_DEF.map((d) => lots.find((l) => l.key === d.key) || {
  key: d.key, name: d.name, gate: d.gate, planDate: '', actualDate: '', qtyPlan: '', qtyProd: '', qtyAcc: '', status: 'Not Started', rem: '',
});

const yieldPct = (l) => {
  const prod = +l.qtyProd || 0;
  const acc = +l.qtyAcc || 0;
  if (!prod) return '—';
  return `${Math.round((acc / prod) * 100)}%`;
};

// Lots are mirrored into local state (synced only on project switch, not every
// prop refresh) so rapid consecutive edits build on the latest edit instead of
// racing against the parent's in-flight patch() and silently dropping changes.
export default function BuildLotsTab({ project, onSave }) {
  const [lots, setLots] = useState(() => ensureLots(project.buildLots));
  useEffect(() => { setLots(ensureLots(project.buildLots)); }, [project.id]);

  const set = (key, field, val) => {
    const next = lots.map((l) => (l.key === key ? { ...l, [field]: val } : l));
    setLots(next);
    onSave(next);
  };

  if (!project.koDone) {
    return <p className="text-sm text-muted-foreground">Build lots appear after KO — conduct the kick-off so build stages can be scheduled against the gates.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Part build progression — OTS → Pilot → PPAP → Ramp-Up (AIAG sequence).</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Build Stage</TableHead>
            <TableHead>Gate</TableHead>
            <TableHead>Plan Date</TableHead>
            <TableHead>Actual Date</TableHead>
            <TableHead>Qty Plan</TableHead>
            <TableHead>Qty Built</TableHead>
            <TableHead>Qty Accepted</TableHead>
            <TableHead>Yield</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lots.map((l) => {
            const def = BUILD_LOTS_DEF.find((d) => d.key === l.key);
            return (
              <TableRow key={l.key}>
                <TableCell className="min-w-[210px]">
                  <div className="font-medium text-[13px]">{l.name}</div>
                  <div className="text-[11px] text-muted-foreground">{def?.hint}</div>
                </TableCell>
                <TableCell><Badge variant="secondary">{l.gate}</Badge></TableCell>
                <TableCell><Input type="date" className="h-8 w-36" value={l.planDate || ''} onChange={(e) => set(l.key, 'planDate', e.target.value)} /></TableCell>
                <TableCell><Input type="date" className="h-8 w-36" value={l.actualDate || ''} onChange={(e) => set(l.key, 'actualDate', e.target.value)} /></TableCell>
                <TableCell><Input type="number" min={0} className="h-8 w-20" value={l.qtyPlan || ''} onChange={(e) => set(l.key, 'qtyPlan', e.target.value)} /></TableCell>
                <TableCell><Input type="number" min={0} className="h-8 w-20" value={l.qtyProd || ''} onChange={(e) => set(l.key, 'qtyProd', e.target.value)} /></TableCell>
                <TableCell><Input type="number" min={0} className="h-8 w-20" value={l.qtyAcc || ''} onChange={(e) => set(l.key, 'qtyAcc', e.target.value)} /></TableCell>
                <TableCell className="font-semibold">{yieldPct(l)}</TableCell>
                <TableCell>
                  <Select value={l.status || 'Not Started'} onValueChange={(v) => set(l.key, 'status', v)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{BUILD_ST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input className="h-8 w-40" placeholder="—" value={l.rem || ''} onChange={(e) => set(l.key, 'rem', e.target.value)} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="grid md:grid-cols-4 gap-3">
        {lots.map((l) => (
          <Card key={l.key}>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground truncate">{l.name}</div>
              <Badge variant="outline" className={`${badgeForStatus(l.status)} mt-1.5`}>{l.status || 'Not Started'}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
