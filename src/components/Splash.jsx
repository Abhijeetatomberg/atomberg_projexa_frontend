import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import AtombergLogo from '@/assets/AtombergLogo.png';

// Startup splash screen — mirrors the legacy Atomberg Projexa.html intro
// animation: logo pop, name zoom-in, gold rule draw, subtitle fade, then a
// scale-fade dismissal. Click/keypress skips straight to the dismissal.
export default function Splash({ onDone }) {
  const [out, setOut] = useState(false);
  const [hidden, setHidden] = useState(false);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setOut(true);
    setTimeout(() => { setHidden(true); onDone?.(); }, reduce ? 320 : 540);
  };

  useEffect(() => {
    const t = setTimeout(finish, reduce ? 550 : 2050);
    const skip = () => finish();
    window.addEventListener('keydown', skip);
    return () => { clearTimeout(t); window.removeEventListener('keydown', skip); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (hidden) return null;

  return (
    <div
      onClick={finish}
      className={cn(
        'fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden cursor-pointer transition-all',
        reduce && 'splash-reduce',
        out ? 'opacity-0 scale-105 duration-500' : 'opacity-100 scale-100'
      )}
      style={{ background: 'radial-gradient(900px 520px at 50% 42%, #16335f 0%, #0c1526 72%)' }}
    >
      <div
        className="pointer-events-none absolute -inset-1/4"
        style={{ background: 'radial-gradient(420px 420px at 50% 46%, rgba(255,198,39,.12), transparent 62%)' }}
      />
      <div className="relative z-10 text-center text-white px-6">
        <div className="splash-logo mx-auto mb-6 inline-flex items-center rounded-[22px] bg-white px-9 py-6 shadow-[0_20px_55px_rgba(0,0,0,.45),0_0_0_1px_rgba(255,255,255,.05)]">
          <img src={AtombergLogo} alt="Atomberg" className="h-[62px] w-auto" />
        </div>
        <div className="splash-name text-[clamp(34px,6.2vw,62px)] font-extrabold leading-none">
          Proj<span className="text-brand">exa</span>
        </div>
        <div className="splash-rule mx-auto mt-5 h-[3px] w-0 rounded-full" style={{ background: 'linear-gradient(90deg,transparent,hsl(var(--brand)),transparent)' }} />
        <div className="splash-sub mt-4 text-[12.5px] uppercase tracking-[4px] text-white/60">
          Project Tracking Suite
        </div>
      </div>
      {!reduce && (
        <div className="splash-skip absolute bottom-8 inset-x-0 text-center text-[11px] tracking-wide text-white/30">
          Click anywhere to skip
        </div>
      )}
    </div>
  );
}
