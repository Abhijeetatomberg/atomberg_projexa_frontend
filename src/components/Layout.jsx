import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home, LayoutDashboard, FileText, Rocket, GitBranch, ListTree, Factory,
  Package, MessagesSquare, Clock, ClipboardCheck, Sparkles, FlaskConical,
  RefreshCcw, TrendingUp, Wallet, Users2, Library, Settings, LogOut,
} from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export const NAV = [
  { to: '/', label: 'Home', icon: Home, color: '#334155', desc: 'All modules in one place', end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#6366f1', desc: 'Portfolio overview, KPIs & risk' },
  { to: '/rfq', label: 'RFQ Tracking', icon: FileText, color: '#2563eb', desc: 'Sales RFQs & quoting pipeline' },
  { to: '/poc', label: 'POC Projects', icon: Rocket, color: '#7c3aed', desc: 'Proof-of-concept builds before tool-up' },
  { to: '/npd', label: 'NPD Projects', icon: GitBranch, color: '#d97706', desc: 'Gated new product development, AB1-AB7' },
  { to: '/bom', label: 'BOM Tracking', icon: ListTree, color: '#0891b2', desc: 'Bill of materials per project' },
  { to: '/line', label: 'Line Readiness', icon: Factory, color: '#059669', desc: 'Process, tooling & trial readiness' },
  { to: '/samples', label: 'Sample Submission', icon: Package, color: '#db2777', desc: 'Customer sample tracking' },
  { to: '/reviews', label: 'Weekly Review', icon: MessagesSquare, color: '#4f46e5', desc: 'Meeting notes & action items' },
  { to: '/pending', label: 'Pending Tasks', icon: Clock, color: '#ea580c', desc: 'Cross-project task tracker' },
  { to: '/ppap', label: 'PPAP Docs', icon: ClipboardCheck, color: '#ca8a04', desc: '18-element PPAP checklist' },
  { to: '/ai', label: 'Ask AI', icon: Sparkles, color: '#e11d48', desc: 'Ask questions about your live data' },
  { to: '/trials', label: 'Trial Tracker', icon: FlaskConical, color: '#0d9488', desc: 'Trial request & approval forms' },
  { to: '/ecn', label: 'ECN Tracker', icon: RefreshCcw, color: '#8b5cf6', desc: 'Engineering change notices' },
  { to: '/investment', label: 'Investment', icon: TrendingUp, color: '#16a34a', desc: 'Capital & tooling investment' },
  { to: '/budget', label: 'Budget', icon: Wallet, color: '#65a30d', desc: 'Budget vs. actuals' },
  { to: '/resources', label: 'Resources', icon: Users2, color: '#0ea5e9', desc: 'Team allocation' },
  { to: '/standards', label: 'Standards Library', icon: Library, color: '#64748b', desc: 'Reference documents' },
  { to: '/users', label: 'User List', icon: Settings, color: '#475569', desc: 'Manage accounts (admin)', adminOnly: true },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 w-56 border-r bg-card flex flex-col z-40">
        <div className="flex items-center gap-2 px-4 h-14 border-b">
          <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-sm font-black">P</div>
          <div>
            <div className="text-sm font-bold leading-none">Projexa</div>
            <div className="text-[10px] text-muted-foreground">Atomberg NPD Suite</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground',
                  isActive && 'bg-accent text-foreground'
                )
              }
            >
              <n.icon className="h-4 w-4 shrink-0" style={{ color: n.color }} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold">
            {initials(user?.name || user?.username || '?')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{user?.name || user?.username}</div>
            <div className="text-[10px] text-muted-foreground capitalize">{user?.role}</div>
          </div>
          <Button variant="ghost" size="icon" title="Sign out" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>
      <main className="flex-1 ml-56 p-6">
        <Outlet />
      </main>
    </div>
  );
}
