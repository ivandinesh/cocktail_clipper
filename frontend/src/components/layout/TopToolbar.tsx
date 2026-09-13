import { Activity, ArrowUpRight, ChevronDown, Command, Settings, Sparkles } from "lucide-react";

interface TopToolbarProps {
  projectName: string;
  status: string;
  processing: boolean;
  progress: number;
  onExport: () => void;
  onSettings: () => void;
  canExport: boolean;
}

export function TopToolbar({ projectName, status, processing, progress, onExport, onSettings, canExport }: TopToolbarProps) {
  const hasProject = projectName !== "CocktailClips";

  return (
    <header className="relative z-30 flex h-[72px] shrink-0 items-center border-b border-slate-200/90 bg-white/90 px-4 backdrop-blur-xl sm:px-7">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 text-lg font-black text-white shadow-lg shadow-violet-500/20">✦</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-black tracking-[-0.03em] text-slate-950">Cocktail<span className="text-violet-600">Clips</span></span>
              {hasProject && <span className="hidden h-4 w-px bg-slate-200 sm:block" />}
              {hasProject && <span className="max-w-[180px] truncate text-sm font-semibold text-slate-700 sm:max-w-[280px]">{projectName}</span>}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Local video studio
            </div>
          </div>
          {hasProject && <button className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 md:flex"><ChevronDown size={12} /> Project</button>}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {processing ? (
            <div className="flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2">
              <Activity size={15} className="animate-pulse text-violet-600" />
              <span className="text-xs font-bold text-violet-700">{status}</span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: `${Math.max(progress, 8)}%` }} /></div>
              {progress > 0 && <span className="text-[11px] font-bold text-violet-500">{progress}%</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /><span className="text-xs font-bold text-emerald-700">{status || "Ready"}</span></div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-400 lg:flex"><Command size={11} /> K for help</div>
          <button onClick={onSettings} className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Open settings"><Settings size={17} /></button>
          <button onClick={onExport} disabled={!canExport} className={`group flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${canExport ? "bg-slate-950 text-white shadow-lg shadow-slate-900/15 hover:bg-violet-700" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}><Sparkles size={14} className={canExport ? "text-fuchsia-300" : ""} /> Export <ArrowUpRight size={14} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button>
        </div>
      </div>
    </header>
  );
}
