import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const ST_MAP = {
  Live: ['Active', 'text-emerald-700', 'bg-emerald-100'],
  Superseded: ['Superseded', 'text-slate-600', 'bg-slate-100'],
  Rejected: ['Rejected', 'text-red-700', 'bg-red-100'],
  Cancelled: ['Cancelled', 'text-slate-600', 'bg-slate-100'],
};

export default function HistoryModal({ doc, onClose }) {
  const history = doc.history || [];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Revision History</DialogTitle></DialogHeader>
        <div className="font-semibold -mt-2">{doc.title}</div>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history yet</p>
        ) : (
          <div className="space-y-3">
            {history.map((h, i) => {
              const st = ST_MAP[h.status] || [h.status, 'text-slate-600', 'bg-slate-100'];
              const chips = (h.approvals || []).filter((a) => a.status !== 'Not Required');
              return (
                <div key={i} className="flex gap-3">
                  <div className={cn('h-7 w-7 rounded-full grid place-items-center text-xs font-bold shrink-0', st[1], st[2])}>{h.rev}</div>
                  <div className="flex-1 min-w-0 pb-3 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <b className="text-sm">Rev {h.rev}</b>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', st[1], st[2])}>{st[0]}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{h.date || '—'}</span>
                    </div>
                    <div className="text-sm mt-1">{h.reason || '—'}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">by {h.changedBy || '—'}</div>
                    {chips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {chips.map((a, ci) => (
                          <span key={ci} className="text-[11px] rounded-full border px-2 py-0.5">
                            {a.deptLabel}: {a.approver}{' '}
                            <b className={a.status === 'Approved' ? 'text-emerald-700' : a.status === 'Rejected' ? 'text-red-700' : 'text-amber-700'}>{a.status}</b>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
