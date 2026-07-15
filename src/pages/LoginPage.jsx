// Login page — same UI as aipl_metrics_frontend (Login.tsx + loginForm.tsx):
// full-screen black layout, motor image on the left, yellow radial glow,
// dark card with Atomberg logo and yellow LOGIN button.
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import bgmotor from '../assets/bgmotor.png';
import AtombergLogo from '../assets/AtombergLogo.png';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reach the backend. Is it running on port 4000?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="fixed inset-0 w-full h-full bg-black flex md:flex-row items-center justify-center overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_top_right,_rgba(253,224,71,0.3)_0%,_transparent_70%)] opacity-70 blur-3xl" />

      <img
        src={bgmotor}
        alt="Motor"
        className="absolute top-0 w-full h-[55%] object-cover opacity-95 md:h-full md:w-1/2 md:object-cover md:opacity-95"
        loading="lazy"
      />

      <section className="relative z-10 w-full px-4 md:px-0 md:w-1/2 flex justify-center items-start top-12 md:top-0 md:items-center md:pb-0 pb-8">
        <div className="w-full max-w-md md:bg-black/20 rounded-lg shadow-lg p-6">
          <div className="flex flex-col items-center justify-center min-h-screen text-white">
            <img
              src={AtombergLogo}
              alt="Logo"
              loading="lazy"
              className="w-32 h-32 mb-2"
            />
            <Card className="w-full max-w-sm border-none shadow-none bg-black/80">
              <CardContent className="space-y-6 pt-6">
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 text-black"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                      </svg>
                    </div>
                    <span className="text-xl font-semibold text-white">
                      PROJEXA
                    </span>
                  </div>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <div className="space-y-4">
                    <Input
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="Username or email"
                      autoComplete="username"
                      autoFocus
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 px-4 rounded-lg border border-gray-700 bg-gray-900 text-white placeholder:text-gray-400"
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 px-4 rounded-lg border border-gray-700 bg-gray-900 text-white placeholder:text-gray-400"
                    />
                  </div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <Button
                    type="submit"
                    disabled={busy}
                    className="w-full h-12 bg-yellow-400 font-bold hover:bg-yellow-500 text-black rounded-lg disabled:opacity-70"
                  >
                    {busy ? 'LOGGING IN...' : 'LOGIN'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
