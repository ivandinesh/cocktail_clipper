import React, { useEffect, useState } from "react";
import "./index.css";
import { ClipsTable } from "./ClipsTable";

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
  projectId: string | null;
  projectName: string;
  onBackToCreate: () => void;
  onRecut: (clipId: string) => void;
  onRestitch: (clipId: string) => void;
  onEditHook: (clipId: string, hook: string) => void;
  onEditTitle: (clipId: string, title: string) => void;
  onEditTranscript: (clipId: string, transcript: string) => void;
}

function Dashboard({
  projectId,
  projectName,
  onBackToCreate,
  onRecut,
  onRestitch,
  onEditHook,
  onEditTitle,
  onEditTranscript,
}: DashboardProps) {
  const [clips, setClips] = useState<ProjectClip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch project data when component mounts or projectId changes
  useEffect(() => {
    if (!projectId) {
      setClips([]);
      return;
    }

    setLoading(true);

    fetch(`http://localhost:8000/projects/${projectId}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.detail || "Failed to fetch project");
          });
        }
        return res.json();
      })
      .then((data) => {
        // Transform project.clips into ProjectClip format
        const projectClips: ProjectClip[] = (data.clips || []).map(
          (clip: any) => ({
            id: clip.id || "unknown",
            start: clip.start || "00:00:00.000",
            end: clip.end || "00:00:00.000",
            title: clip.title || "Untitled",
            status: clip.status || "planned",
            clip_file: clip.clip_file || null,
            final_file: clip.final_file || null,
            transcript: clip.transcript || "",
          })
        );
        setClips(projectClips);
        setProjectName(data.project?.name || projectName);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load project");
        setClips([]);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleRecut = (clipId: string) => {
    onRecut(clipId);
  };

  const handleRestitch = (clipId: string) => {
    onRestitch(clipId);
  };

  const handleEditHook = (clipId: string, hook: string) => {
    onEditHook(clipId, hook);
  };

  const handleEditTitle = (clipId: string, title: string) => {
    onEditTitle(clipId, title);
  };

  const handleEditTranscript = (clipId: string, transcript: string) => {
    onEditTranscript(clipId, transcript);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner-border text-white" role="status">
          <span className="visually-hidden">Loading...</span>
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
          <button
            onClick={() => fetchProjectData()}
            className="btn btn-primary w-full">Retry
          </button>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="p-6 text-gray-400 text-center">
          <h2 className="text-2xl font-bold mb-4">Project Dashboard</h2>
          <p>No project selected</p>
          <button
            onClick={() => setProjectId(generateMockId())}
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
          >
            Create or Select Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <button
              onClick={() => setProjectId(null)}
              className="text-sm text-gray-400 hover underline"
            >
              New Project
            </button>
          </div>
          <p className="text-gray-400">
            {projectName || "Unnamed Project"}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Project Overview Section */}
        <section className="mb-8">
          <div className="bg-gray-800 p-6 rounded border">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold mb-2">Project Overview</h2>
                <p className="text-gray-400">
                  Source video and subtitle loaded successfully
                </p>
              </div>
              {clips.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-400">Clips created:</p>
                  <p className="text-3xl font-bold text-green-400">{clips.length}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Clips Section */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-white">
            Clips{" "}
            {clips.length > 0 && (
              <span className="text-gray-400">({clips.length})</span>
            )}
          </h2>

          {clips.length === 0 ? (
            <div className="p-6 text-gray-400">
              <p>No clips yet. Use the clip cutter to create clips from your source video.</p>
              <button
                onClick={() => cutSampleClip()}
                className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
              >
                Cut Sample Clip
              </button>
            </div>
          ) : (
            <ClipsTable
              projectId={projectId}
              onRecut={handleRecut}
              onRestitch={handleRestitch}
              onEditHook={handleEditHook}
              onEditTitle={handleEditTitle}
              onEditTranscript={handleEditTranscript}
            />
          )}
        </section>
      </main>
    </div>
  );
}

// Helper function to generate a mock project ID for demo purposes
function generateMockId(): string {
  return "proj-" + Math.random().toString(36).substr(2, 9);
}

// Helper function to simulate cutting a sample clip
function cutSampleClip() {
  // In a real app, this would call the backend API
  alert("Sample clip cutting would be implemented here");
}

export { Dashboard };
export type { ProjectClip, DashboardProps };