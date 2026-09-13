import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";

export default function CreateProject() {
  const [projectName, setProjectName] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!videoFile || !srtFile) {
      setError("Please upload both MP4 and SRT files");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("subtitle", srtFile);
      formData.append("project_name", projectName);

      const res = await fetch("http://localhost:8000/projects/create", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create project");
      }

      const data = await res.json();
      navigate(`/dashboard?projectId=${data.project_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-lg animate-fade-in-up">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="hero-icon">🎬</div>
          <h1 className="hero-title">CocktailClips</h1>
          <p className="hero-subtitle">
            Transform long videos into short-form clips. Upload your video and subtitles, and we handle the rest.
          </p>
        </div>

        {/* How it works */}
        <div className="space-y-3 mb-10">
          <div className="step-card">
            <div className="step-number bg-blue-600/20 text-blue-400">1</div>
            <div>
              <div className="text-sm font-medium text-white">Upload your media</div>
              <div className="text-xs text-zinc-500">MP4 video + SRT subtitle files</div>
            </div>
          </div>
          <div className="step-card">
            <div className="step-number bg-orange-600/20 text-orange-400">2</div>
            <div>
              <div className="text-sm font-medium text-white">Cut your clips</div>
              <div className="text-xs text-zinc-500">Extract segments with timestamps</div>
            </div>
          </div>
          <div className="step-card">
            <div className="step-number bg-green-600/20 text-green-400">3</div>
            <div>
              <div className="text-sm font-medium text-white">Stitch & download</div>
              <div className="text-xs text-zinc-500">Brand with intro/outro and export</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Episode 12 - AI Podcast"
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Video File (MP4)</label>
            <div
              className={`drop-zone ${videoFile ? "has-file" : ""}`}
              onClick={() => document.getElementById("videoFile")?.click()}
            >
              <input
                type="file"
                accept=".mp4"
                id="videoFile"
                className="hidden"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
              <div className="text-sm">
                {videoFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-green-400 font-medium">{videoFile.name}</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl mb-2">📁</div>
                    <span className="text-zinc-500">Click to upload MP4</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Subtitle File (SRT)</label>
            <div
              className={`drop-zone ${srtFile ? "has-file" : ""}`}
              onClick={() => document.getElementById("srtFile")?.click()}
            >
              <input
                type="file"
                accept=".srt"
                id="srtFile"
                className="hidden"
                onChange={(e) => setSrtFile(e.target.files?.[0] || null)}
              />
              <div className="text-sm">
                {srtFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-green-400 font-medium">{srtFile.name}</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl mb-2">📝</div>
                    <span className="text-zinc-500">Click to upload SRT</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="alert-error flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Creating..." : "🚀 Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
