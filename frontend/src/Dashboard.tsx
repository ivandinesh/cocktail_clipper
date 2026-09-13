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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchProjectData} className="px-4 py-2 bg-blue-600 rounded-lg text-white">Retry</button>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-8">
            <span className="text-4xl">📊</span>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            CocktailClips
          </h1>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Your dashboard shows all your projects and clips. Create a new project to get started.
          </p>
          <button
            onClick={handleCreateNew}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg font-semibold text-white transition-all shadow-lg shadow-blue-600/20 text-lg"
          >
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
    <div className="p-6 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">{projectName || "Unnamed Project"}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {clips.length} clip{clips.length !== 1 ? "s" : ""} · {cutCount} cut · {completedCount} completed
            </p>
          </div>
          <a
            href="/"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
          >
            ← New Project
          </a>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-400">Progress</span>
            <span className="text-blue-400 font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: progress === 100
                  ? "linear-gradient(to right, #22c55e, #16a34a)"
                  : "linear-gradient(to right, #3b82f6, #6366f1)"
              }}
            />
          </div>
        </div>
      </div>

      {/* How to use */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 mb-6 space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">💡 How to use this project</h3>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center text-xs font-bold">1</span>
          <span>Go to <strong className="text-gray-300">Cut</strong> page to extract clips from your video</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center text-xs font-bold">2</span>
          <span>Set branding on the <strong className="text-gray-300">Branding</strong> page</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center text-xs font-bold">3</span>
          <span>Stitch everything on the <strong className="text-gray-300">Stitch</strong> page and download</span>
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
