import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, LayoutDashboard, FileText, Rocket, GitBranch, ListTree, Factory,
  Package, MessagesSquare, Clock, ClipboardCheck, Sparkles, FlaskConical,
  RefreshCcw, TrendingUp, Wallet, Users2, Library, Settings, LogOut,
  Menu, ChevronRight, Database,
} from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { health } from '@/api/resources';
import AtombergLogo from '@/assets/AtombergLogo.png';

export const NAV = [
  { to: '/', label: 'Home', icon: Home, color: '#f97316', desc: 'All modules in one place', end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#818cf8', desc: 'Portfolio overview, KPIs & risk' },
  { to: '/rfq', label: 'RFQ Tracking', icon: FileText, color: '#60a5fa', desc: 'Sales RFQs & quoting pipeline' },
  { to: '/poc', label: 'POC Projects', icon: Rocket, color: '#a78bfa', desc: 'Proof-of-concept builds before tool-up' },
  { to: '/npd', label: 'NPD Projects', icon: GitBranch, color: '#fbbf24', desc: 'Gated new product development, AB1-AB7' },
  { to: '/bom', label: 'BOM Tracking', icon: ListTree, color: '#22d3ee', desc: 'Bill of materials per project' },
  { to: '/line', label: 'Line Readiness', icon: Factory, color: '#34d399', desc: 'Process, tooling & trial readiness' },
  { to: '/samples', label: 'Sample Submission', icon: Package, color: '#f472b6', desc: 'Customer sample tracking' },
  { to: '/reviews', label: 'Weekly Review', icon: MessagesSquare, color: '#818cf8', desc: 'Meeting notes & action items' },
  { to: '/pending', label: 'Pending Tasks', icon: Clock, color: '#fb923c', desc: 'Cross-project task tracker' },
  { to: '/ppap', label: 'PPAP Docs', icon: ClipboardCheck, color: '#facc15', desc: '18-element PPAP checklist' },
  { to: '/ai', label: 'Ask AI', icon: Sparkles, color: '#fb7185', desc: 'Ask questions about your live data' },
  { to: '/trials', label: 'Trial Tracker', icon: FlaskConical, color: '#2dd4bf', desc: 'Trial request & approval forms' },
  { to: '/ecn', label: 'ECN Tracker', icon: RefreshCcw, color: '#a78bfa', desc: 'Engineering change notices' },
  { to: '/investment', label: 'Investment', icon: TrendingUp, color: '#4ade80', desc: 'Capital & tooling investment' },
  { to: '/budget', label: 'Budget', icon: Wallet, color: '#a3e635', desc: 'Budget vs. actuals' },
  { to: '/resources', label: 'Resources', icon: Users2, color: '#38bdf8', desc: 'Team allocation' },
  { to: '/standards', label: 'Standards Library', icon: Library, color: '#94a3b8', desc: 'Reference documents' },
  { to: '/users', label: 'User List', icon: Settings, color: '#94a3b8', desc: 'Manage accounts (admin)', adminOnly: true },
];

const FONT_SCALES = [85, 90, 100, 110, 125];
const FONT_SCALE_KEY = 'projexa_font_scale';
const DB_POLL_MS = 30000;

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem(FONT_SCALE_KEY)) || 100);
  const [dbStatus, setDbStatus] = useState('checking'); // 'checking' | 'connected' | 'unreachable'

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
    localStorage.setItem(FONT_SCALE_KEY, String(fontScale));
  }, [fontScale]);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      health()
        .then((r) => { if (!cancelled) setDbStatus(r?.db === 'connected' ? 'connected' : 'unreachable'); })
        .catch(() => { if (!cancelled) setDbStatus('unreachable'); });
    };
    check();
    const id = setInterval(check, DB_POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const current = useMemo(() => {
    const visible = NAV.filter((n) => !n.adminOnly || isAdmin);
    const match = visible
      .filter((n) => n.to === '/' || location.pathname.startsWith(n.to))
      .sort((a, b) => b.to.length - a.to.length)[0];
    return match || NAV[0];
  }, [location.pathname, isAdmin]);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 flex flex-col border-r border-slate-800 bg-[#0b1526] transition-[width] z-40',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-800 shrink-0">
          <img src={AtombergLogo} alt="Atomberg" className="h-8 w-8 shrink-0 rounded-full object-cover bg-white" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold leading-none text-white truncate">Projexa</div>
              <div className="text-[10px] text-slate-400 truncate">Project Tracking Suite</div>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              title={collapsed ? n.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-slate-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent',
                  isActive && 'bg-white/10 text-white border-l-2 border-orange-400'
                )
              }
            >
              <n.icon className="h-4 w-4 shrink-0" style={{ color: n.color }} />
              {!collapsed && <span className="truncate">{n.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className={cn('flex-1 flex flex-col transition-[margin]', collapsed ? 'ml-16' : 'ml-60')}>
        <header className="sticky top-0 z-30 flex items-center gap-3 h-14 px-4 border-b bg-card">
          <Button variant="ghost" size="icon" onClick={() => setCollapsed((c) => !c)} title="Toggle sidebar">
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 text-sm min-w-0">
            <span className="text-muted-foreground">Home</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-semibold truncate">{current.label}</span>
          </div>
          <div className="flex-1" />
          <div
            className={cn(
              'hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
              dbStatus === 'connected' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
              dbStatus === 'unreachable' && 'border-red-200 bg-red-50 text-red-700',
              dbStatus === 'checking' && 'border-border bg-muted text-muted-foreground'
            )}
            title={dbStatus === 'unreachable' ? 'Could not reach the backend/database' : undefined}
          >
            <Database className="h-3.5 w-3.5" />
            {dbStatus === 'connected' ? 'Database Connected' : dbStatus === 'unreachable' ? 'Database not connected' : 'Checking…'}
          </div>
          <select
            value={fontScale}
            onChange={(e) => setFontScale(Number(e.target.value))}
            className="hidden sm:block h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
            title="Text size"
          >
            {FONT_SCALES.map((s) => (
              <option key={s} value={s}>Aa {s}%</option>
            ))}
          </select>
          <div className="flex items-center gap-2 pl-1">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold shrink-0">
              {initials(user?.name || user?.username || '?')}
            </div>
            <div className="hidden md:block min-w-0">
              <div className="text-xs font-semibold truncate">{user?.name || user?.username}</div>
              <div className="text-[10px] text-muted-foreground uppercase truncate">{user?.role}</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
