import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { NAV } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/toaster';

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const modules = NAV.filter((n) => n.to !== '/' && (!n.adminOnly || isAdmin));

  const backupAllData = () => {
    toast('Preparing backup — this can take a moment…', 'info');
    const base = import.meta.env.VITE_API_BASE || '/api';
    window.open(`${base}/backup`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">{user?.name ? `Welcome, ${user.name.split(' ')[0]}` : 'Welcome'}</h1>
          <p className="text-sm text-muted-foreground">Pick a module below, or use the sidebar any time.</p>
        </div>
        <div className="flex-1" />
        {isAdmin && (
          <Button variant="outline" onClick={backupAllData}>
            <Download /> Back Up All Data
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {modules.map((m) => (
          <Link key={m.to} to={m.to} className="block">
            <Card className="h-full rounded-lg border p-[18px_16px] shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-elevated hover:border-transparent">
              <CardContent className="p-0">
                <div
                  className="h-[42px] w-[42px] rounded-[11px] grid place-items-center mb-3"
                  style={{ background: `${m.color}18`, color: m.color }}
                >
                  <m.icon className="h-[21px] w-[21px]" />
                </div>
                <div className="text-[13.5px] font-bold text-foreground mb-[3px]">{m.label}</div>
                <div className="text-[11px] text-muted-foreground leading-[1.4]">{m.desc}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
