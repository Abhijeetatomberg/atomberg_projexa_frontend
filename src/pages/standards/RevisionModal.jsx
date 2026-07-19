import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/toaster';
import { STD_APPR_DEPTS } from '@/lib/constants';
import { notifyTaskAssigned } from '@/api/resources';
import { useAuth } from '@/context/AuthContext';

const NONE = '__none__';

export default function RevisionModal({ doc, userNames, onClose, onSubmit }) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [approvers, setApprovers] = useState(() => Object.fromEntries(STD_APPR_DEPTS.map(([k]) => [k, NONE])));
  const [custom, setCustom] = useState([]); // [{role, approver}]

  const addCustom = () => setCustom((c) => [...c, { role: '', approver: NONE }]);
  const setCustomField = (i, field, val) => setCustom((c) => c.map((r, ix) => (ix === i ? { ...r, [field]: val } : r)));
  const removeCustom = (i) => setCustom((c) => c.filter((_, ix) => ix !== i));

  const submit = async () => {
    if (!reason.trim()) { toast('Reason for change is required', 'error'); return; }
    const fixed = STD_APPR_DEPTS.map(([k, lbl]) => {
      const val = approvers[k] === NONE ? '' : approvers[k];
      return { dept: k, deptLabel: lbl, approver: val, status: val ? 'Pending' : 'Not Required' };
    });
    const customRows = custom
      .filter((r) => r.role.trim())
      .map((r, i) => {
        const val = r.approver === NONE ? '' : r.approver;
        return { dept: `custom${i}`, deptLabel: r.role.trim(), approver: val, status: val ? 'Pending' : 'Not Required' };
      });
    const approvals = [...fixed, ...customRows];
    const rev = { rev: (doc.rev || 1) + 1, date: new Date().toISOString().slice(0, 10), reason: reason.trim(), changedBy: user?.name || '', approvals, files: [] };
    await onSubmit(rev);
    approvals.filter((a) => a.status === 'Pending').forEach((a) => {
      notifyTaskAssigned({
        ownerEmail: '', ownerName: a.approver, itemTitle: `Rev ${rev.rev} of "${doc.title}" needs your approval (${a.deptLabel})`,
        module: 'Standards Library — Approval Required', project: doc.title, link: window.location.origin + '/standards',
      });
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Revise / Upgrade</DialogTitle></DialogHeader>
        <p className="text-sm -mt-2">
          <b>{doc.title}</b><br />
          <span className="text-muted-foreground">Current Rev {doc.rev || 1} → creates Rev {(doc.rev || 1) + 1}, locked until every required approval below is in.</span>
        </p>
        <div className="space-y-1.5">
          <Label>Reason for Change</Label>
          <Textarea placeholder="Why is this revision needed?" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Approvals Required</Label>
          {STD_APPR_DEPTS.map(([k, lbl]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-40 text-sm">{lbl}</span>
              <Select value={approvers[k]} onValueChange={(v) => setApprovers((a) => ({ ...a, [k]: v }))}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not Required</SelectItem>
                  {userNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
          {custom.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input className="w-40" placeholder="Role / Title" value={row.role} onChange={(e) => setCustomField(i, 'role', e.target.value)} />
              <Select value={row.approver} onValueChange={(v) => setCustomField(i, 'approver', v)}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not Required</SelectItem>
                  {userNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => removeCustom(i)}><X className="h-4 w-4" /></button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={addCustom}><Plus className="h-3.5 w-3.5" /> Add another approver (custom role)</Button>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Submit for Approval</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
