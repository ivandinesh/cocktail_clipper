import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DropZone } from "../components/ui/DropZone";
import { Button } from "../components/ui";
import { useProjectStore } from "../stores/projectStore";

export function CreateProject() {
  const [projectName, setProjectName] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const addToast = useProjectStore((s) => s.addToast);

  const handleDrop = useCallback((files: File[]) => {
    const video = files.find((f) => f.name.endsWith(".mp4"));
    const srt = files.find((f) => f.name.endsWith(".srt"));
    const json = files.find((f) => f.name.endsWith(".json"));
    if (video) setVideoFile(video);
    if (srt) setSrtFile(srt);
    if (json) setJsonFile(json);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(false);
    setLoading(true);

    if (!videoFile) {
      setError("Please drop a video file");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      if (srtFile) formData.append("subtitle", srtFile);
      formData.append("project_name", projectName || "Untitled Project");

      const res = await fetch("http://localhost:8000/projects/create", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create project");
      }

      const data = await res.json();
      addToast({ type: "success", title: "Project Created", message: `Project "${data.project_name}" is ready` });
      navigate(`/?projectId=${data.project_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
      addToast({ type: "error", title: "Creation Failed", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-48px)] p-8">
      <div className="w-full max-w-lg animate-fade-in-up">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20 mx-auto mb-4">
            ◆
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">CocktailClips</h1>
          <p className="text-lg text-zinc-500">Transform long videos into short-form clips</p>
        </div>

        {/* Drop Zone */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <DropZone onDrop={handleDrop} onFileSelect={() => document.getElementById("videoFile")?.click()}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-700">Drop your video here</p>
            <p className="text-sm text-zinc-500 mt-1">or click to browse</p>
            <p className="text-xs text-zinc-400 mt-2">MP4 · SRT · JSON</p>
          </DropZone>

          <input type="file" accept=".mp4" id="videoFile" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
          <input type="file" accept=".srt" id="srtFile" className="hidden" onChange={(e) => setSrtFile(e.target.files?.[0] || null)} />
          <input type="file" accept=".json" id="jsonFile" className="hidden" onChange={(e) => setJsonFile(e.target.files?.[0] || null)} />

          {/* File Tags */}
          <div className="flex flex-wrap gap-2 justify-center">
            {videoFile && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">✓ {videoFile.name}</span>}
            {srtFile && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">✓ {srtFile.name}</span>}
            {jsonFile && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">✓ {jsonFile.name}</span>}
          </div>

          {/* Project Name */}
          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-1">Project Name</label>
            <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g., Episode 12 - AI Podcast" className="input-field" />
          </div>

          {error && <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">⚠ {error}</div>}

          <Button type="submit" disabled={loading || !videoFile} className="w-full" size="lg">
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </form>
      </div>
    </div>
  );
}
