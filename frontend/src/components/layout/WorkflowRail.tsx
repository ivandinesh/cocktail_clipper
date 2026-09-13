import { Braces, Clapperboard, Download, FileJson, Film, Layers3, Scissors } from "lucide-react";

const steps = [
  ["source", "Source", Clapperboard],
  ["plan", "AI plan", FileJson],
  ["scenes", "Review", Film],
  ["clips", "Clips", Scissors],
  ["stitch", "Sequence", Layers3],
  ["export", "Export", Download],
  ["json", "Advanced", Braces],
] as const;

export function WorkflowRail({ projectActive }: { projectActive: boolean }) {
  return (
    <aside className="workflow-rail flex w-[176px] shrink-0 border-r border-slate-200/90 bg-white/65 px-3 py-5 backdrop-blur-xl">
      <p className="px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Workflow</p>
      <nav className="mt-4 space-y-1">
        {steps.map(([id, label, Icon], index) => (
          <a key={id} href={projectActive ? `#${id}` : "#how-it-works"} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-violet-50 hover:text-violet-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-400 transition group-hover:bg-violet-100 group-hover:text-violet-700">{projectActive ? <Icon size={14} /> : String(index + 1).padStart(2, "0")}</span>
            <span>{label}</span>
          </a>
        ))}
      </nav>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500"><p className="font-bold text-slate-700">Local workflow</p><p className="mt-1">Your source, plans, clips, and renders stay on this machine.</p></div>
    </aside>
  );
}
