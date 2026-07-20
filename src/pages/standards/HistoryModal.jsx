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
          <div className="flex flex-col gap-3.5">
            {history.map((h, i) => {
              const st = ST_MAP[h.status] || [h.status, 'text-slate-600', 'bg-slate-100'];
              const chips = (h.approvals || []).filter((a) => a.status !== 'Not Required');
              return (
                <div key={i} className="flex gap-3">
                  <div className={cn('h-[30px] w-[30px] rounded-full grid place-items-center text-[11.5px] font-bold shrink-0', st[1], st[2])}>{h.rev}</div>
                  <div className="flex-1 min-w-0 rounded-[10px] border bg-card px-3.5 py-2.5">
                    <div className="flex items-center gap-2 text-xs">
                      <b className="text-[12.5px]">Rev {h.rev}</b>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', st[1], st[2])}>{st[0]}</span>
                      <span className="text-muted-foreground ml-auto">{h.date || '—'}</span>
                    </div>
                    <div className="text-xs mt-1.5 leading-relaxed">{h.reason || '—'}</div>
                    <div className="text-[10.5px] text-muted-foreground mt-1">by {h.changedBy || '—'}</div>
                    {chips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t">
                        {chips.map((a, ci) => (
                          <span key={ci} className="text-[10px] rounded-md bg-card2 px-1.5 py-0.5 text-muted-foreground">
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
