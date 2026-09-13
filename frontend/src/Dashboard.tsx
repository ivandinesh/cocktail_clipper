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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            <span className="text-blue-400">Cocktail</span>Clips
          </h1>
          <p className="text-gray-400 mb-6">Create a project to get started</p>
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-white transition-colors"
          >
            Create New Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{projectName || "Unnamed Project"}</h1>
          <p className="text-gray-400 text-sm mt-1">{clips.length} clip{clips.length !== 1 ? "s" : ""}</p>
        </div>
        <a
          href="/"
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
        >
          ← New Project
        </a>
      </div>

      <ClipsTable
        projectId={projectId}
        onRecut={(id) => console.log("Recut:", id)}
        onRestitch={(id) => console.log("Restitch:", id)}
        onEditHook={(id, hook) => console.log("Edit hook:", id, hook)}
        onEditTitle={(id, title) => console.log("Edit title:", id, title)}
        onEditTranscript={(id) => console.log("Edit transcript:", id)}
      />
    </div>
  );
}
