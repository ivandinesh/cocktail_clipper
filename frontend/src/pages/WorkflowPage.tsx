import type { ReactNode } from "react";
import { ArrowDown, Braces, CheckCircle2, Clapperboard, Download, FileJson, Film, Scissors } from "lucide-react";
import { ProjectHome } from "./ProjectHome";
import { Scenes } from "./Scenes";
import { Clips } from "./Clips";
import { Export } from "./Export";
import { MasterJSON } from "./MasterJSON";
import { AIPlanImporter } from "../components/workflow/AIPlanImporter";

const steps = [
  { id: "source", label: "Source", icon: Clapperboard },
  { id: "plan", label: "AI plan", icon: FileJson },
  { id: "scenes", label: "Scenes", icon: Film },
  { id: "clips", label: "Clips", icon: Scissors },
  { id: "export", label: "Export", icon: Download },
  { id: "json", label: "Project data", icon: Braces },
];

function WorkflowSection({
  id,
  number,
  title,
  description,
  children,
}: {
  id: string;
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-b border-slate-200/80 py-10 last:border-b-0">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700">
            {number}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

export function WorkflowPage() {
  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain scroll-smooth">
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-5 py-3 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-[1500px] items-center gap-2 overflow-x-auto">
          {steps.map(({ id, label, icon: Icon }, index) => (
            <a
              key={id}
              href={`#${id}`}
              className="group flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-violet-50 hover:text-violet-700"
            >
              <Icon size={14} />
              <span>{label}</span>
              {index < steps.length - 1 && <ArrowDown size={12} className="ml-1 rotate-[-90deg] text-slate-300" />}
            </a>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-b from-white/60 to-transparent">
        <WorkflowSection id="source" number="01" title="Start with your source" description="Review the media, project status, and the next action in your workflow.">
          <ProjectHome />
        </WorkflowSection>
        <WorkflowSection id="plan" number="02" title="Import the AI plan" description="Paste or upload the scene plan generated from your transcript. Validate it before any video processing starts.">
          <AIPlanImporter />
        </WorkflowSection>
        <WorkflowSection id="scenes" number="03" title="Review the moments" description="Review the imported timestamps and titles before cutting the source video.">
          <Scenes />
        </WorkflowSection>
        <WorkflowSection id="clips" number="04" title="Shape your clips" description="Select, review, cut, and prepare the moments you want to keep.">
          <Clips />
        </WorkflowSection>
        <WorkflowSection id="export" number="05" title="Export branded clips" description="Apply your shared brand cards and render every clip as a separate local file.">
          <Export />
        </WorkflowSection>
        <WorkflowSection id="json" number="06" title="Project data" description="Use the visual editor or inspect the master project JSON when you need precise control.">
          <MasterJSON />
        </WorkflowSection>
      </div>

      <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-5 pb-12 text-xs text-slate-400 sm:px-8">
        <CheckCircle2 size={14} className="text-emerald-500" />
        Everything stays local on your machine.
      </div>
    </div>
  );
}
