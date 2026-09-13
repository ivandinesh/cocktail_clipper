import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import { VideoPreview } from "../components/media/VideoPreview";
import { Button } from "../components/ui";
import { EmptyState } from "../components/ui/EmptyState";
import { ProgressBar } from "../components/ui";

export function ProjectHome() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("projectId");
  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);
  const setProjectId = useProjectStore((s) => s.setProjectId);
  const loading = useProjectStore((s) => s.loading);
  const setLoading = useProjectStore((s) => s.setLoading);
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`http://localhost:8000/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        setProject(data);
        setProjectId(projectId);
        const completed = data.clips?.filter((c: any) => c.status === "completed").length || 0;
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
      <EmptyState title="No project selected" description="Create a new project or select an existing one to get started." action={{ label: "Create Project", onClick: () => navigate("/") }} />
    );
  }

  const completed = project.clips?.filter((c: any) => c.status === "completed").length || 0;
  const cut = project.clips?.filter((c: any) => c.status === "cut").length || 0;
  const total = project.clips?.length || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const stages = [
    { label: "Source", icon: "🎬", done: !!project.source.video },
    { label: "Analyze", icon: "🧠", done: !!project.scenes && project.scenes.length > 0 },
    { label: "Select", icon: "📋", done: total > 0 },
    { label: "Cut", icon: "✂️", done: cut > 0 },
    { label: "Stitch", icon: "🧵", done: false },
    { label: "Export", icon: "📤", done: completed === total && total > 0 },
  ];

  return (
    <div className="p-8 animate-fade-in-up space-y-8 overflow-y-auto h-full">
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

      <div className="grid grid-cols-3 gap-8">
        {/* Left: Video Preview + Info */}
        <div className="col-span-2 space-y-6">
          {/* Video Preview */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Source Video</h2>
            <VideoPreview
              src={`/projects/${projectId}/source.mp4`}
              duration="00:00:00"
            />
            <div className="flex items-center justify-between mt-4 text-sm text-zinc-500">
              <span>{project.source.video}</span>
              <span>—</span>
              <span>Source</span>
            </div>
          </div>

          {/* Project Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Project Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Filename", project.source.video],
                ["Duration", "—"],
                ["Resolution", "—"],
                ["Transcript", project.source.subtitle ? "✓ Loaded" : "—"],
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
              {total === 0 ? "Add scenes or clips to get started" :
               cut === 0 ? "Analyze your video to detect scenes" :
               completed < total ? "Review and cut your clips" :
               "Ready to stitch and export!"}
            </p>
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                if (total === 0) navigate("/scenes");
                else if (cut === 0) navigate("/scenes");
                else if (completed < total) navigate("/clips");
                else navigate("/stitch");
              }}
            >
              {total === 0 ? "Add Scenes" :
               cut === 0 ? "Analyze Video" :
               completed < total ? "Review Clips" :
               "Go to Stitch"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
