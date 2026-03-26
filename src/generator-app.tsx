import { ArrowRight, DatabaseZap, ShieldAlert, Sparkles } from 'lucide-react';
import { DatabaseDashboard } from './components/DatabaseDashboard';

export function GeneratorApp() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.18),_transparent_30%),linear-gradient(160deg,_#0b1020_0%,_#111827_45%,_#1f2937_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 sm:px-8">
        <header className="relative mb-12 overflow-hidden rounded-[2.5rem] border border-white/12 bg-white/8 p-10 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-3xl">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(56,189,248,0.15),_transparent_40%,_rgba(249,115,22,0.18))]" />
          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.3em] text-cyan-200">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                Evolution Complete
              </div>
              <h1 className="font-display text-5xl font-black tracking-tight sm:text-7xl">
                Database <span className="text-transparent bg-clip-text bg-[linear-gradient(to_right,_#22d3ee,_#818cf8)]">Pulse</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 font-medium">
                The legacy Firebase stack has been fully decommissioned. This monitoring suite provides real-time visibility into the Supabase project health and synchronization status.
              </p>
            </div>

            <div className="flex flex-col gap-4">
               <a
                href="/"
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-8 py-5 font-black uppercase tracking-widest text-white transition hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Launch Game
                <ArrowRight className="h-5 w-5" />
              </a>
              <div className="rounded-[1.2rem] border border-cyan-500/20 bg-slate-950/60 px-6 py-4 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">Environment</p>
                <p className="mt-2 text-sm font-bold text-cyan-300 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                   Supabase Cloud · Production
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-6 duration-700">
           <DatabaseDashboard />
        </section>

        <footer className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 text-xs font-bold uppercase tracking-widest">
           <p>© 2026 AF-cking-Trivia-Game · Systems Audit Complete</p>
           <div className="flex gap-8">
              <span className="flex items-center gap-2">
                 <ShieldAlert className="h-3.5 w-3.5" />
                 CSP Optimized
              </span>
              <span className="flex items-center gap-2">
                 <Sparkles className="h-3.5 w-3.5" />
                 AI Generation v3
              </span>
           </div>
        </footer>
      </div>
    </main>
  );
}
