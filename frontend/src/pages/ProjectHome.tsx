import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import type { Project } from "../types";
import { VideoPreview } from "../components/media/VideoPreview";
import { Button } from "../components/ui";
import { EmptyState } from "../components/ui/EmptyState";
import { ProgressBar } from "../components/ui";
import { Download } from "lucide-react";

export function ProjectHome() {
  const [searchParams] = useSearchParams();

  const projectId = searchParams.get("projectId");
  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);
  const setProjectId = useProjectStore((s) => s.setProjectId);
  const loading = useProjectStore((s) => s.loading);
  const setLoading = useProjectStore((s) => s.setLoading);
  const [status, setStatus] = useState("Ready");
  const apiBaseUrl = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`${apiBaseUrl}/projects/${projectId}`)
      .then((res) => res.json())
      .then((data: Project) => {
        setProject(data);
        setProjectId(projectId);
        const completed = data.clips?.filter((c) => c.individual_render_status === "completed" && c.final_file?.startsWith("final/clips/")).length || 0;
        const total = data.clips?.length || 0;
        if (total === 0) setStatus("Ready");
        else if (completed === 0) setStatus("Analyze transcript…");
        else if (completed < total) setStatus(`Cutting ${completed} of ${total} clips…`);
        else setStatus("Export complete");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-48px)]">
        <div className="spinner" />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState title="No project selected" description="Create a new project or select an existing one to get started." action={{ label: "Back to project", onClick: () => document.getElementById("source")?.scrollIntoView({ behavior: "smooth" }) }} />
    );
  }

  const completed = project.clips?.filter((c) => c.individual_render_status === "completed" && c.final_file?.startsWith("final/clips/")).length || 0;
  const cut = project.clips?.filter((c) => (c.status === "cut" || c.status === "completed") && c.clip_file).length || 0;
  const total = project.clips?.length || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const stages = [
    { label: "Source", icon: "🎬", done: !!project.source.video },
    { label: "Analyze", icon: "🧠", done: !!project.scenes && project.scenes.length > 0 },
    { label: "Select", icon: "📋", done: total > 0 },
    { label: "Cut", icon: "✂️", done: cut > 0 },
    { label: "Export", icon: "📤", done: completed === total && total > 0 },
  ];

  return (
    <div className="p-0 animate-fade-in-up space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{project.project.name}</h1>
          <p className="text-sm text-zinc-500 mt-1">{total} clips · {cut} cut · {completed} completed</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            progress === 100 ? "bg-green-50 text-green-700" :
            progress > 0 ? "bg-blue-50 text-blue-700" :
            "bg-zinc-100 text-zinc-600"
          }`}>
            {progress === 100 ? "✓ Complete" : progress > 0 ? `${progress}%` : "Ready"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Video Preview + Info */}
        <div className="col-span-2 space-y-6">
          {/* Video Preview */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Source Video</h2>
            <VideoPreview
              src={`/projects/${projectId}/source`}
              duration="Loading…"
            />
            <div className="flex items-center justify-between mt-4 text-sm text-zinc-500">
              <span>{project.source.video}</span>
              <span>—</span>
              <span>Source</span>
            </div>
          </div>

          {/* Project Info */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-900">Project Details</h2>
              {project.source.subtitle && <a href={`${apiBaseUrl}/projects/${projectId}/transcript/download`} download><Button size="sm" variant="secondary"><Download size={14} className="mr-1.5" />Download transcript</Button></a>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Filename", project.source.video],
              ["Duration", project.source.duration ? `${Math.floor(project.source.duration / 60)}m ${Math.round(project.source.duration % 60)}s` : "—"],
              ["Resolution", "—"],
              ["Transcript", project.source.subtitle ? `Loaded${project.source.subtitle_kind ? ` · ${project.source.subtitle_kind}` : ""}` : "—"],
              ["Scenes", project.scenes?.length || 0],
              ["Clips", total],
              ["Last Processed", "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-zinc-400">{label}</p>
                <p className="text-sm font-medium text-zinc-900 mt-0.5">{value}</p>
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* Right: Workflow */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Workflow</h2>
            <div className="space-y-3">
              {stages.map((stage, i) => {
                const isLast = i === stages.length - 1;
                return (
                  <div key={stage.label} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                        stage.done ? "bg-green-100 text-green-600" : "bg-zinc-100 text-zinc-400"
                      }`}>
                        {stage.icon}
                      </div>
                      {!isLast && <div className={`w-0.5 h-8 mt-1 ${stage.done ? "bg-green-300" : "bg-zinc-200"}`} />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${stage.done ? "text-zinc-900" : "text-zinc-400"}`}>
                        {stage.label}
                      </p>
                      {stage.done && <p className="text-xs text-green-600 mt-0.5">Complete</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-zinc-700">Overall Progress</span>
              <span className="text-sm font-semibold text-blue-600">{progress}%</span>
            </div>
            <ProgressBar value={progress} variant={progress === 100 ? "success" : "default"} />
          </div>

          {/* Next Action */}
          <div className="card p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Next Step</h3>
            <p className="text-sm text-blue-700 mb-4">
              {total === 0 ? "Import your AI-generated clip plan" :
               cut < total ? "Cut the imported clips from the source" :
               completed < total ? "Apply branding and export each clip" :
               "All clips are exported"}
            </p>
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                const target = total === 0 ? "plan" : cut < total ? "clips" : "export";
                document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {total === 0 ? "Import AI Plan" :
               cut < total ? "Cut Clips" :
               completed < total ? "Export Clips" :
               "View Exports"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
