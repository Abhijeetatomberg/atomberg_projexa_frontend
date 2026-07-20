import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lightweight collapsible panel — mirrors the "collap()" sections in the
// legacy app (e.g. "Charts & analytics"). No radix dependency needed.
export default function CollapsibleSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border bg-card shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-[13px] font-semibold hover:bg-card2"
      >
        {title}
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="border-t px-4 pt-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}
