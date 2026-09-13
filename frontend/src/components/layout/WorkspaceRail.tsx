import { FolderClock, HardDrive, RotateCw, TerminalSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProjectStore } from "../../stores/projectStore";
import type { ToastMessage } from "../../types";

type ProjectSummary = { id: string; name: string; clips: number; completed: number; updated_at: number };

export function WorkspaceRail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const activityLog = useProjectStore((state) => state.activityLog);
  const clearActivityLog = useProjectStore((state) => state.clearActivityLog);
  const currentId = new URLSearchParams(location.search).get("projectId");

  const loadProjects = () => {
    setLoading(true);
    fetch("/projects")
      .then((response) => response.json())
      .then((payload) => setProjects(payload.projects || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, [location.search]);

  return (
    <aside className="workspace-rail flex w-[292px] shrink-0 flex-col border-l border-slate-200/90 bg-white/80 backdrop-blur-xl lg:w-[310px]">
      <section className="min-h-0 flex-[1.1] overflow-y-auto border-b border-slate-200/80 p-4">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Library</p><h2 className="mt-1 text-base font-black tracking-tight text-slate-900">Previous projects</h2></div><button onClick={loadProjects} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800" aria-label="Refresh projects"><RotateCw size={14} /></button></div>
        {loading ? <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-400">Loading projects…</div> : projects.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs leading-5 text-slate-400">Projects you create locally will appear here.</div> : <div className="space-y-2">{projects.map((project) => <button key={project.id} onClick={() => navigate(`/?projectId=${encodeURIComponent(project.id)}`)} className={`w-full rounded-xl border p-3 text-left transition ${currentId === project.id ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/50"}`}><div className="flex items-start gap-2"><FolderClock size={16} className={currentId === project.id ? "text-violet-600" : "text-slate-400"} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{project.name}</p><p className="mt-1 text-xs text-slate-500">{project.clips} clips · {project.completed} rendered</p></div></div></button>)}</div>}
      </section>
      <section className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</p><h2 className="mt-1 text-base font-black tracking-tight text-slate-900">Activity & help</h2></div><button onClick={clearActivityLog} className="text-xs font-semibold text-slate-400 hover:text-rose-600">Clear</button></div><div className="mb-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500"><HardDrive size={14} className="mt-0.5 shrink-0 text-emerald-600" /> Everything stays local. Errors and processing messages remain available in this panel.</div>{activityLog.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">No activity yet.</div> : <div className="space-y-2">{activityLog.slice().reverse().map((entry: ToastMessage) => <div key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex gap-2"><TerminalSquare size={14} className={entry.type === "error" ? "text-rose-600" : entry.type === "success" ? "text-emerald-600" : "text-violet-600"} /><div className="min-w-0"><p className="text-xs font-bold text-slate-700">{entry.title}</p>{entry.message && <p className="mt-1 break-words text-xs leading-5 text-slate-500">{entry.message}</p>}</div></div></div>)}</div>}</section>
    </aside>
  );
}
