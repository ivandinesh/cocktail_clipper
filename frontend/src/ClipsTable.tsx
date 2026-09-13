import { useEffect, useState, useCallback } from "react";
import "./index.css";

interface Clip {
  id: string;
  start: string;
  end: string;
  title: string;
  hook: string;
  next_hook: string;
  transcript: string;
  clip_file: string | null;
  final_file: string | null;
  status: "planned" | "cut" | "completed";
}

interface ClipsTableProps {
  projectId: string | null;
  onRecut: (clipId: string) => void;
  onRestitch: (clipId: string) => void;
  onEditHook: (clipId: string, hook: string) => void;
  onEditTitle: (clipId: string, title: string) => void;
}

function getStatusClass(status: string): string {
  switch (status) {
    case "planned": return "status-planned";
    case "cut": return "status-cut";
    case "completed": return "status-completed";
    default: return "status-planned";
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case "planned": return "Planned";
    case "cut": return "Cut";
    case "completed": return "Completed";
    default: return "Unknown";
  }
}

export default function ClipsTable({ projectId, onRecut, onRestitch, onEditHook, onEditTitle }: ClipsTableProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClips = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setClips(data.clips || []);
    } catch {
      setError("Failed to load clips");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  const handleDownload = async (clip: Clip) => {
    const file = clip.final_file || clip.clip_file;
    if (!file || !projectId) return;
    try {
      const res = await fetch(`http://localhost:8000/projects/${projectId}/clips/${clip.id}/preview`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {}
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  }

  if (error) {
    return <div className="alert-error text-center">{error}</div>;
  }

  if (!projectId) {
    return <div className="text-center py-20 text-zinc-500">Select a project to view clips</div>;
  }

  if (clips.length === 0) {
    return (
      <div className="page-card text-center py-16">
        <div className="text-6xl mb-4">✂️</div>
        <h3 className="text-xl font-semibold text-zinc-300 mb-2">No clips yet</h3>
        <p className="text-zinc-500 mb-6">Cut clips from your source video to see them here.</p>
        <a href="/cut" className="btn-primary inline-block">Go to Cut →</a>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Clips ({clips.length})</h2>
        <span className="text-xs text-zinc-600">↓ Download · Buttons to manage</span>
      </div>

      <div className="table-container glass">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-left text-zinc-500 px-5 py-4 font-medium text-xs uppercase tracking-wider">ID</th>
              <th className="text-left text-zinc-500 px-5 py-4 font-medium text-xs uppercase tracking-wider">Start</th>
              <th className="text-left text-zinc-500 px-5 py-4 font-medium text-xs uppercase tracking-wider">End</th>
              <th className="text-left text-zinc-500 px-5 py-4 font-medium text-xs uppercase tracking-wider">Title</th>
              <th className="text-left text-zinc-500 px-5 py-4 font-medium text-xs uppercase tracking-wider">Status</th>
              <th className="text-left text-zinc-500 px-5 py-4 font-medium text-xs uppercase tracking-wider">Clip File</th>
              <th className="text-left text-zinc-500 px-5 py-4 font-medium text-xs uppercase tracking-wider">Final</th>
              <th className="text-left text-zinc-500 px-5 py-4 font-medium text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clips.map((clip) => (
              <tr key={clip.id} className="table-row">
                <td className="px-5 py-4 font-mono text-xs text-blue-400">{clip.id}</td>
                <td className="px-5 py-4 font-mono text-xs text-zinc-500">{clip.start}</td>
                <td className="px-5 py-4 font-mono text-xs text-zinc-500">{clip.end}</td>
                <td className="px-5 py-4 text-zinc-300 max-w-[160px] truncate">{clip.title}</td>
                <td className="px-5 py-4">
                  <span className={`status-badge ${getStatusClass(clip.status)}`}>
                    {getStatusText(clip.status)}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-zinc-600 max-w-[120px] truncate">{clip.clip_file || "—"}</td>
                <td className="px-5 py-4 font-mono text-xs text-zinc-600 max-w-[120px] truncate">{clip.final_file || "—"}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2 flex-wrap">
                    {clip.clip_file && (
                      <button
                        onClick={() => handleDownload(clip)}
                        className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 rounded-lg text-xs text-white transition-colors"
                        title="Download"
                      >
                        ↓
                      </button>
                    )}
                    {clip.status === "cut" && (
                      <button
                        onClick={() => onRecut(clip.id)}
                        className="px-3 py-1.5 bg-orange-600/80 hover:bg-orange-500 rounded-lg text-xs text-white transition-colors"
                      >
                        Recut
                      </button>
                    )}
                    {clip.final_file && (
                      <button
                        onClick={() => onRestitch(clip.id)}
                        className="px-3 py-1.5 bg-green-600/80 hover:bg-green-500 rounded-lg text-xs text-white transition-colors"
                      >
                        Restitch
                      </button>
                    )}
                    <button
                      onClick={() => onEditHook(clip.id, clip.hook)}
                      className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-500 rounded-lg text-xs text-white transition-colors"
                    >
                      Hook
                    </button>
                    <button
                      onClick={() => onEditTitle(clip.id, clip.title)}
                      className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 rounded-lg text-xs text-white transition-colors"
                    >
                      Title
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
