import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { askAi } from '@/api/resources';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  "What's overdue right now?",
  'Summarize all NPD projects',
  'Which PPAP elements are still pending?',
  'Who has the most open action items?',
];

export default function AskAiPage() {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [chat, busy]);

  const ask = async (q) => {
    const question = (q ?? input).trim();
    if (!question || busy) return;
    setInput('');
    const history = chat.slice(-6);
    setChat((p) => [...p, { role: 'user', content: question }]);
    setBusy(true);
    try {
      const res = await askAi(question, history);
      setChat((p) => [...p, { role: 'assistant', content: res.answer || '(no answer)' }]);
    } catch (e) {
      setChat((p) => [...p, {
        role: 'assistant',
        content: `Sorry — I couldn't reach the AI service (${e.response?.data?.error || e.message}). Check that the backend has ANTHROPIC_API_KEY set.`,
      }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] max-w-3xl mx-auto">
      <div className="mb-3 flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-rose-600" /> Ask AI</h1>
          <p className="text-sm text-muted-foreground">Ask questions about everything in Projexa — overdue items, project status, who owns what, budget vs. actuals — answered from your live data.</p>
        </div>
        <div className="flex-1" />
        {chat.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setChat([])}>Clear conversation</Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent ref={logRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {chat.length === 0 && (
            <div className="h-full grid place-items-center">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">Try one of these:</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      className="text-xs border rounded-full px-3 py-1.5 hover:bg-accent"
                      onClick={() => ask(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'rounded-xl px-3.5 py-2 max-w-[85%] text-sm whitespace-pre-wrap',
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy && <div className="text-sm text-muted-foreground animate-pulse">Thinking…</div>}
        </CardContent>
        <div className="border-t p-3 flex gap-2">
          <Input
            value={input}
            placeholder="Ask about projects, tasks, PPAP, ECNs…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
            disabled={busy}
          />
          <Button onClick={() => ask()} disabled={busy || !input.trim()}><Send /></Button>
        </div>
      </Card>
    </div>
  );
}
