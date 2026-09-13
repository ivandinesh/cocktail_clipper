import React, { useEffect, useState } from "react";
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
  onEditTranscript: (clipId: string, transcript: string) => void;
}

function getClipStatusClass(status: "planned" | "cut" | "completed"): string {
  switch (status) {
    case "planned":
      return "bg-yellow-600";
    case "cut":
      return "bg-orange-600";
    case "completed":
      return "bg-green-600";
    default:
      return "bg-gray-600";
  }
}

function getClipStatusText(status: "planned" | "cut" | "completed"): string {
  switch (status) {
    case "planned":
      return "Planned";
    case "cut":
      return "Cut";
    case "completed":
      return "Completed";
    default:
      return "Unknown";
  }
}

interface UseClipsTableReturn {
  clips: Clip[];
  loading: boolean;
  error: string | null;
  refreshClips: () => void;
}

function useClipsTable(projectId: string | null): UseClipsTableReturn {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setClips([]);
      return;
    }

    fetchClips();
  }, [projectId]);

  const fetchClips = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch project");
      }

      const projectData = await response.json();
      const fetchedClips: Clip[] = projectData.clips || [];

      // Transform clip data to UI format
      const transformedClips = fetchedClips.map((clip: any) => ({
        id: clip.id || "unknown",
        start: clip.start || "00:00:00.000",
        end: clip.end || "00:00:00.000",
        title: clip.title || "Untitled",
        hook: clip.hook || "",
        next_hook: clip.next_hook || "",
        transcript: clip.transcript || "",
        clip_file: clip.clip_file || null,
        final_file: clip.final_file || null,
        status: clip.status || "planned",
      }));

      setClips(transformedClips);
    } catch (err: any) {
      setError(err.message || "Failed to load clips");
      setClips([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshClips = () => {
    fetchClips();
  };

  return { clips, loading, error, refreshClips };
}

function ClipsTable({
  projectId,
  onRecut,
  onRestitch,
  onEditHook,
  onEditTitle,
  onEditTranscript,
}: ClipsTableProps) {
  const { clips, loading, error, refreshClips } = useClipsTable(projectId);

  if (loading) {
    return (
      <div className="p-6 text-white">
        <div className="flex justify-center my-8">
          <div className="spinner-border text-white" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-white">
        <div className="alert alert-danger">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <hr />
          <button className="btn btn-primary w-full">Refresh</button>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="p-6 text-gray-400">
        <h2 className="text-xl font-bold mb-4">Clips Table</h2>
        <p>Select a project to view clips</p>
        <button
          className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
          onClick={() => window.location.href="/dashboard"}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="p-6 text-gray-400">
        <h2 className="text-xl font-bold mb-4">Clips Table</h2>
        <p>No clips yet</p>
        <p className="mb-4">
          Add clips by importing AI scenes or cutting segments from the source video.
        </p>
        <button
          className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
          onClick={() => window.location.href="/dashboard"}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-white">
        Clips Table{" "}
        {clips.length > 0 && (
          <span className="text-gray-400">({clips.length} clips)</span>
        )}
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-white">
          <thead>
            <tr>
              <th className="text-left text-gray-400 px-6 py-3 font-bold text-xs uppercase tracking-wider">
                ID
              </th>
              <th className="text-left text-gray-400 px-6 py-3 font-bold text-xs uppercase tracking-wider">
                Start
              </th>
              <th className="text-left text-gray-400 px-6 py-3 font-bold text-xs uppercase tracking-wider">
                End
              </th>
              <th className="text-left text-gray-400 px-6 py-3 font-bold text-xs uppercase tracking-wider">
                Title
              </th>
              <th className="text-left text-gray-400 px-6 py-3 font-bold text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="text-left text-gray-400 px-6 py-3 font-bold text-xs uppercase tracking-wider">
                Transcript
              </th>
              <th className="text-left text-gray-400 px-6 py-3 font-bold text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {clips.map((clip) => (
              <tr key={clip.id} className="border-b border-gray-700 hover:bg-gray-800">
                <td className="px-6 py-4 font-medium">
                  {clip.id}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-300">{clip.start}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-300">{clip.end}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-300">{clip.title}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getClipStatusClass(clip.status)}`}
                  >
                    {getClipStatusText(clip.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <textarea
                    rows={2}
                    className="w-full bg-gray-800 text-white text-sm border border-gray-600 rounded px-2 py-1 resize-none"
                    defaultValue={clip.transcript}
                    disabled
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {/* Preview clip button */}
                    <button
                      onClick={() => previewClip(clip)}
                      className={`inline-block bg-gray-700 text-white px-3 py-1 text-sm rounded hover:bg-gray-600 transition-colors`}
                      title="Preview clip"
                    >
                      Preview
                    </button>

                    {/* Recut button - only for cut clips */}
                    {clip.status === "cut" && (
                      <button
                        onClick={() => onRecut(clip.id)}
                        className={`inline-block bg-orange-600 text-white px-3 py-1 text-sm rounded hover:bg-orange-400 transition-colors`}
                        title="Recut clip"
                      >
                        Recut
                      </button>
                    )}

                    {/* Restitch button - only for completed clips with final_file */}
                    {clip.final_file && (
                      <button
                        onClick={() => onRestitch(clip.id)}
                        className={`inline-block bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-400 transition-colors`}
                        title="Restitch clip"
                      >
                        Restitch
                      </button>
                    )}

                    {/* Edit hook */}
                    <button
                      onClick={() => onEditHook(clip.id, clip.hook)}
                      className={`inline-block bg-purple-600 text-white px-3 py-1 text-sm rounded hover:bg-purple-500 transition-colors`}
                      title="Edit hook"
                    >
                      Hook
                    </button>

                    {/* Edit title */}
                    <button
                      onClick={() => onEditTitle(clip.id, clip.title)}
                      className={`inline-block bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-400 transition-colors`}
                      title="Edit title"
                    >
                      Title
                    </button>

                    {/* Edit transcript */}
                    <button
                      onClick={() => onEditTranscript(clip.id, clip.transcript)}
                      className={`inline-block bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-400 transition-colors`}
                      title="Edit transcript"
                    >
                      Transcript
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

function previewClip(clip: Clip) {
  if (clip.clip_file) {
    const clipUrl = `/projects/${clip.clip_file}`;
    window.open(clipUrl, "_blank");
  } else {
    alert("Clip file not available. Please cut the clip first.");
  }
}

export { ClipsTable };
export type { Clip, ClipsTableProps, UseClipsTableReturn };