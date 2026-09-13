import { AlertCircle, CheckCircle2, ChevronUp, CircleAlert, Info, Trash2 } from "lucide-react";
import { useState } from "react";
import { useProjectStore } from "../../stores/projectStore";
import type { ToastMessage } from "../../types";

const icons = {
  success: CheckCircle2,
  error: CircleAlert,
  warning: AlertCircle,
  info: Info,
};

const tone = {
  success: "text-emerald-600",
  error: "text-rose-600",
  warning: "text-amber-600",
  info: "text-sky-600",
};

export function ActivityFooter() {
  const [expanded, setExpanded] = useState(false);
  const processing = useProjectStore((state) => state.processing);
  const activityLog = useProjectStore((state) => state.activityLog);
  const clearActivityLog = useProjectStore((state) => state.clearActivityLog);
  const latest = activityLog[activityLog.length - 1];
  const Icon = latest ? icons[latest.type] : Info;

  return (
    <footer className={`relative z-30 shrink-0 border-t border-slate-200/90 bg-white/95 backdrop-blur-xl ${expanded ? "h-56" : "h-11"}`}>
      <div className="mx-auto flex h-11 max-w-[1500px] items-center gap-3 px-4 text-xs sm:px-6">
        <button onClick={() => setExpanded((value) => !value)} className="flex min-w-0 flex-1 items-center gap-2 text-left text-slate-600 hover:text-slate-900" aria-expanded={expanded}>
          {processing.active ? <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" /> : <Icon size={14} className={latest ? tone[latest.type] : "text-slate-400"} />}
          <span className="font-semibold">{processing.active ? processing.operation : latest?.title || "Activity"}</span>
          <span className="hidden truncate text-slate-400 sm:inline">{processing.active ? "Working locally…" : latest?.message || "Your project activity and processing messages appear here."}</span>
        </button>
        <button onClick={() => setExpanded((value) => !value)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={expanded ? "Collapse activity" : "Expand activity"}><ChevronUp size={15} className={expanded ? "rotate-180" : ""} /></button>
      </div>
      {expanded && (
        <div className="mx-auto h-[calc(100%-44px)] max-w-[1500px] overflow-y-auto border-t border-slate-100 px-4 py-2 sm:px-6">
          <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Activity log</span><button onClick={clearActivityLog} className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-600"><Trash2 size={12} /> Clear</button></div>
          {activityLog.length === 0 ? <p className="py-6 text-center text-xs text-slate-400">No activity yet.</p> : <div className="space-y-1">{activityLog.slice().reverse().map((entry: ToastMessage) => { const EntryIcon = icons[entry.type]; return <div key={entry.id} className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"><EntryIcon size={14} className={`mt-0.5 shrink-0 ${tone[entry.type]}`} /><div className="min-w-0"><p className="text-xs font-semibold text-slate-700">{entry.title}</p>{entry.message && <p className="truncate text-xs text-slate-400">{entry.message}</p>}</div></div>; })}</div>}
        </div>
      )}
    </footer>
  );
}
