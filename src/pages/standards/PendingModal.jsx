import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { DEPT_COLORS, twoLetterInitials, isApprover, stdCanManage } from '@/lib/standards';
import { cn } from '@/lib/utils';

const APPR_BADGE = {
  Pending: 'bg-amber-100 text-amber-700', Approved: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700', 'Not Required': 'bg-slate-100 text-slate-600',
};

export default function PendingModal({ doc, onClose, onApprove, onReject, onCancelRevision, onAttachFile }) {
  const { user, isAdmin } = useAuth();
  const rev = doc.pendingRev;
  if (!rev) return null;
  const required = rev.approvals.filter((a) => a.status !== 'Not Required');
  const doneCount = required.filter((a) => a.status === 'Approved').length;
  const pct = required.length ? Math.round((doneCount / required.length) * 100) : 100;
  const canManage = stdCanManage(doc, user, isAdmin);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Revision Approval</DialogTitle></DialogHeader>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[14.5px] font-bold leading-tight">{doc.title}</div>
            <div className="text-[11.5px] text-muted-foreground mt-0.5">{doc.docNo} · Rev {doc.rev} → <b className="text-foreground">Rev {rev.rev}</b></div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold leading-none">{doneCount}/{required.length}</div>
            <Progress value={pct} className="w-20 mt-1.5" />
          </div>
        </div>

        <div className="rounded-md border-t pt-3.5 text-[12.5px] italic leading-relaxed">
          "{rev.reason}"
          <div className="text-[11px] text-muted-foreground not-italic mt-1.5">— {rev.changedBy} · {rev.date}</div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">Revision File</span>
          {(rev.files || []).length === 0 ? (
            <span className="text-xs text-muted-foreground">No file attached yet</span>
          ) : rev.files.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-md border bg-card2 px-2 py-0.5 text-xs">{f.name} <span className="text-amber-700">🔒 locked</span></span>
          ))}
          {canManage && <Button variant="ghost" size="sm" onClick={onAttachFile}><Paperclip className="h-3.5 w-3.5" /> Attach</Button>}
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">Approvals</div>
          {rev.approvals.map((a) => {
            const notReq = a.status === 'Not Required';
            const canAct = isApprover(a, user, isAdmin) && a.status === 'Pending';
            const col = DEPT_COLORS[a.dept] || '#64748b';
            return (
              <div key={a.dept} className={cn('flex items-center gap-3 rounded-[10px] border bg-card px-3 py-2.5 transition-opacity', notReq && 'opacity-50')}>
                <div className="h-[34px] w-[34px] rounded-full grid place-items-center text-[11px] font-bold shrink-0" style={{ background: `${col}1c`, color: col }}>
                  {notReq ? '—' : twoLetterInitials(a.approver || a.deptLabel)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold">{a.deptLabel}</div>
                  <div className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                    {a.approver || <span className="italic">No approver needed</span>}
                    {a.respondedDate && <> · {a.respondedDate}</>}
                  </div>
                </div>
                {canAct ? (
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" className="h-7 text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={() => onApprove(a.dept)}>Approve</Button>
                    <Button size="sm" variant="outline" className="h-7 text-red-700 border-red-300 hover:bg-red-50" onClick={() => onReject(a.dept)}>Reject</Button>
                  </div>
                ) : (
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', APPR_BADGE[a.status])}>{a.status}</span>
                )}
              </div>
            );
          })}
        </div>

        {canManage && (
          <button
            type="button"
            className="text-xs text-red-600 hover:underline text-left"
            onClick={() => { if (confirm('Cancel this pending revision? It reverts to the current live version.')) onCancelRevision(); }}
          >
            Cancel this revision — reverts to the current live version.
          </button>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
