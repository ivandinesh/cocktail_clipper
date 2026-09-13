import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DropZone } from "../components/ui/DropZone";
import { Button } from "../components/ui";
import { useProjectStore } from "../stores/projectStore";

interface CreateProjectProps {
  compact?: boolean;
}

export function CreateProject({ compact = false }: CreateProjectProps) {
  const [projectName, setProjectName] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const addToast = useProjectStore((s) => s.addToast);
  const apiBaseUrl = import.meta.env.VITE_API_URL || "";

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

      let res: Response;
      try {
        res = await fetch(`${apiBaseUrl}/projects/create`, {
          method: "POST",
          body: formData,
        });
      } catch {
        throw new Error("Could not connect to CocktailClips. Start the backend on port 8000 and try again.");
      }

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.detail || `Project creation failed (${res.status})`);
      }

      const data = payload as { project_id: string; project_name: string };
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
    <div className={`${compact ? "p-4 sm:p-6" : "flex items-center justify-center min-h-[calc(100vh-64px)] p-6 sm:p-10"} relative overflow-y-auto`}>
      <div className="w-full max-w-lg animate-fade-in-up">
        {!compact && <>
        {/* Hero */}
        <div className="text-center mb-10 animate-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-indigo-500/30 mx-auto mb-5 animate-float">
            ✦
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-600 mb-3">Local-first video studio</p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-[-0.06em] text-gradient mb-4">CocktailClips</h1>
          <p className="text-lg text-slate-500 max-w-md mx-auto">Turn long-form footage into scroll-stopping short clips.</p>
        </div>
        </>}

        {compact && <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">Create your project</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Start with your source video</h2><p className="mt-2 text-sm text-slate-500">MP4 required. Add an SRT transcript for scene analysis.</p></div>}

        {/* Drop Zone */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <DropZone className="animate-in" onDrop={handleDrop} onFileSelect={() => document.getElementById("videoFile")?.click()}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-base font-bold text-slate-800">Drop your video here</p>
            <p className="text-sm text-slate-500 mt-1">or click to browse your files</p>
            <p className="text-xs font-semibold text-indigo-400 mt-3 tracking-wide">MP4 · SRT · JSON</p>
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
            <label className="text-sm font-semibold text-slate-700 block mb-2">Project Name</label>
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
