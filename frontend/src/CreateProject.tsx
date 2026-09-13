import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    setLoading(false);
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-6">
            <span className="text-3xl">🎬</span>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            CocktailClips
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Create short-form video clips from your long videos and subtitles.
            Upload your MP4 and SRT files, and we'll handle the rest.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 mb-8 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">How it works</h3>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
            <span>Upload your video (MP4) and subtitles (SRT)</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
            <span>Cut clips from your video using timestamps</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
            <span>Stitch with branding and download final videos</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Episode 12 - AI Podcast"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Video File (MP4)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all hover:border-blue-500 hover:bg-gray-900/50 ${
                videoFile ? "border-green-500/50 bg-green-900/10" : "border-gray-700"
              }`}
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
                    <div className="text-gray-500 text-2xl mb-1">📁</div>
                    <span className="text-gray-400">Click to upload MP4</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Subtitle File (SRT)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all hover:border-blue-500 hover:bg-gray-900/50 ${
                srtFile ? "border-green-500/50 bg-green-900/10" : "border-gray-700"
              }`}
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
                    <div className="text-gray-500 text-2xl mb-1">📝</div>
                    <span className="text-gray-400">Click to upload SRT</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-all shadow-lg shadow-blue-600/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Creating...
              </span>
            ) : (
              "🚀 Create Project"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
