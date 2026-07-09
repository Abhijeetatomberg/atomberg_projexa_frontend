import { Link } from 'react-router-dom';
import { NAV } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const modules = NAV.filter((n) => n.to !== '/' && (!n.adminOnly || isAdmin));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</h1>
        <p className="text-sm text-muted-foreground">All Projexa modules in one place — pick where to work.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {modules.map((m) => (
          <Link key={m.to} to={m.to}>
            <Card className="h-full transition-shadow hover:shadow-md hover:border-primary/40">
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className="h-9 w-9 shrink-0 rounded-lg grid place-items-center"
                  style={{ background: `${m.color}18`, color: m.color }}
                >
                  <m.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{m.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
