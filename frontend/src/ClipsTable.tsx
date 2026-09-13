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
  onEditTranscript?: (clipId: string, transcript: string) => void;
}

function getClipStatusClass(status: string): string {
  switch (status) {
    case "planned": return "bg-yellow-600";
    case "cut": return "bg-orange-600";
    case "completed": return "bg-green-600";
    default: return "bg-gray-600";
  }
}

function getClipStatusText(status: string): string {
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
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" /></div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-400">{error}</div>;
  }

  if (!projectId) {
    return <div className="p-6 text-gray-400">Select a project to view clips</div>;
  }

  if (clips.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">No clips yet. Cut clips from your source video.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left text-gray-400 px-4 py-3 font-medium text-xs uppercase">ID</th>
            <th className="text-left text-gray-400 px-4 py-3 font-medium text-xs uppercase">Start</th>
            <th className="text-left text-gray-400 px-4 py-3 font-medium text-xs uppercase">End</th>
            <th className="text-left text-gray-400 px-4 py-3 font-medium text-xs uppercase">Title</th>
            <th className="text-left text-gray-400 px-4 py-3 font-medium text-xs uppercase">Status</th>
            <th className="text-left text-gray-400 px-4 py-3 font-medium text-xs uppercase">Clip File</th>
            <th className="text-left text-gray-400 px-4 py-3 font-medium text-xs uppercase">Final File</th>
            <th className="text-left text-gray-400 px-4 py-3 font-medium text-xs uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clips.map((clip) => (
            <tr key={clip.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
              <td className="px-4 py-3 font-mono text-xs">{clip.id}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-400">{clip.start}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-400">{clip.end}</td>
              <td className="px-4 py-3 text-gray-300">{clip.title}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 text-xs rounded-full ${getClipStatusClass(clip.status)}`}>
                  {getClipStatusText(clip.status)}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-400">{clip.clip_file || "—"}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-400">{clip.final_file || "—"}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {clip.clip_file && (
                    <button
                      onClick={() => handleDownload(clip)}
                      className="px-2 py-1 bg-blue-600/80 hover:bg-blue-500 rounded text-xs text-white transition-colors"
                      title="Download"
                    >
                      ↓
                    </button>
                  )}
                  {clip.status === "cut" && (
                    <button
                      onClick={() => onRecut(clip.id)}
                      className="px-2 py-1 bg-orange-600/80 hover:bg-orange-500 rounded text-xs text-white transition-colors"
                    >
                      Recut
                    </button>
                  )}
                  {clip.final_file && (
                    <button
                      onClick={() => onRestitch(clip.id)}
                      className="px-2 py-1 bg-green-600/80 hover:bg-green-500 rounded text-xs text-white transition-colors"
                    >
                      Restitch
                    </button>
                  )}
                  <button
                    onClick={() => onEditHook(clip.id, clip.hook)}
                    className="px-2 py-1 bg-purple-600/80 hover:bg-purple-500 rounded text-xs text-white transition-colors"
                  >
                    Hook
                  </button>
                  <button
                    onClick={() => onEditTitle(clip.id, clip.title)}
                    className="px-2 py-1 bg-blue-600/80 hover:bg-blue-500 rounded text-xs text-white transition-colors"
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
  );
}
