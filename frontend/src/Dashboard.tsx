import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import "./index.css";
import ClipsTable from "./ClipsTable";

interface ProjectClip {
  id: string;
  start: string;
  end: string;
  title: string;
  status: "planned" | "cut" | "completed";
  clip_file: string | null;
  final_file: string | null;
  transcript: string;
}

interface DashboardProps {
  projectId?: string | null;
  projectName?: string;
  onProjectIdChange?: (id: string | null) => void;
  onProjectNameChange?: (name: string) => void;
}

export default function Dashboard({ projectId, projectName, onProjectIdChange, onProjectNameChange }: DashboardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clips, setClips] = useState<ProjectClip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectData = useCallback(async () => {
    const pid = searchParams.get("projectId");
    if (!pid) {
      setClips([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/projects/${pid}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      const data = await res.json();
      const projectClips: ProjectClip[] = (data.clips || []).map((c: any) => ({
        id: c.id || "unknown",
        start: c.start || "00:00:00.000",
        end: c.end || "00:00:00.000",
        title: c.title || "Untitled",
        status: c.status || "planned",
        clip_file: c.clip_file || null,
        final_file: c.final_file || null,
        transcript: c.transcript || "",
      }));
      setClips(projectClips);
      onProjectNameChange?.(data.project?.name || projectName);
    } catch {
      setError("Failed to load project");
      setClips([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams, onProjectNameChange, projectName]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleCreateNew = () => {
    const newId = "proj-" + Math.random().toString(36).substr(2, 9);
    onProjectIdChange?.(newId);
    setSearchParams({ projectId: newId });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="page-card text-center">
          <p className="alert-error inline-block mb-4">{error}</p>
          <button onClick={fetchProjectData} className="btn-secondary">Retry</button>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center animate-fade-in-up">
          <div className="hero-icon" style={{ width: 100, height: 100, fontSize: 44 }}>📊</div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight">CocktailClips</h1>
          <p className="text-lg text-zinc-500 mb-8 max-w-md mx-auto">
            Your dashboard shows all projects. Create a new project to get started.
          </p>
          <button onClick={handleCreateNew} className="btn-primary text-lg px-8 py-4">
            + New Project
          </button>
        </div>
      </div>
    );
  }

  const completedCount = clips.filter(c => c.status === "completed").length;
  const cutCount = clips.filter(c => c.status === "cut").length;
  const progress = clips.length > 0 ? Math.round((completedCount / clips.length) * 100) : 0;

  return (
    <div className="animate-fade-in-up space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{projectName || "Unnamed Project"}</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {clips.length} clip{clips.length !== 1 ? "s" : ""} · {cutCount} cut · {completedCount} completed
          </p>
        </div>
        <a href="/" className="btn-secondary text-sm">← New Project</a>
      </div>

      {/* Progress */}
      <div className="page-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-zinc-400">Overall Progress</span>
          <span className="text-sm font-semibold text-blue-400">{progress}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
              background: progress === 100
                ? "linear-gradient(to right, #22c55e, #16a34a)"
                : "linear-gradient(to right, #3b82f6, #8b5cf6)"
            }}
          />
        </div>
      </div>

      {/* How to use */}
      <div className="page-card">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">💡 How to work with this project</h3>
        <div className="space-y-3">
          <div className="step-card">
            <div className="step-number bg-orange-600/20 text-orange-400">1</div>
            <div>
              <div className="text-sm text-white">Go to <span className="text-blue-400">Cut</span> to extract clips</div>
              <div className="text-xs text-zinc-500">Specify start/end timestamps from your video</div>
            </div>
          </div>
          <div className="step-card">
            <div className="step-number bg-purple-600/20 text-purple-400">2</div>
            <div>
              <div className="text-sm text-white">Set branding on <span className="text-purple-400">Branding</span></div>
              <div className="text-xs text-zinc-500">Customize channel name, intro/outro durations</div>
            </div>
          </div>
          <div className="step-card">
            <div className="step-number bg-green-600/20 text-green-400">3</div>
            <div>
              <div className="text-sm text-white">Stitch on <span className="text-green-400">Stitch</span> and download</div>
              <div className="text-xs text-zinc-500">All clips combined with intro/outro branding</div>
            </div>
          </div>
        </div>
      </div>

      <ClipsTable
        projectId={projectId}
        onRecut={(id) => console.log("Recut:", id)}
        onRestitch={(id) => console.log("Restitch:", id)}
        onEditHook={(id, hook) => console.log("Edit hook:", id, hook)}
        onEditTitle={(id, title) => console.log("Edit title:", id, title)}
      />
    </div>
  );
}
