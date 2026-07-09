import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Minimal toast system: call toast('Saved', 'success') from anywhere.
let listeners = [];
let counter = 0;

export function toast(message, type = 'default') {
  const t = { id: ++counter, message, type };
  listeners.forEach((fn) => fn(t));
}

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const add = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3200);
    };
    listeners.push(add);
    return () => { listeners = listeners.filter((fn) => fn !== add); };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'rounded-md border px-4 py-2.5 text-sm shadow-lg bg-card animate-in slide-in-from-bottom-2',
            t.type === 'success' && 'border-emerald-300 text-emerald-800 bg-emerald-50',
            t.type === 'error' && 'border-red-300 text-red-800 bg-red-50'
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
