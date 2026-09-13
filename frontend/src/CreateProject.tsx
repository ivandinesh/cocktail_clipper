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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-blue-400">Cocktail</span>Clips
          </h1>
          <p className="text-gray-400 text-sm">Create a new project from your video and subtitles</p>
        </div>

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
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Video File (MP4)
            </label>
            <div
              className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-900/50 transition-colors"
              onClick={() => document.getElementById("videoFile")?.click()}
            >
              <input
                type="file"
                accept=".mp4"
                id="videoFile"
                className="hidden"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
              <div className="text-gray-400 text-sm">
                {videoFile ? (
                  <span className="text-green-400">{videoFile.name}</span>
                ) : (
                  <span>Click to upload MP4</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Subtitle File (SRT)
            </label>
            <div
              className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-900/50 transition-colors"
              onClick={() => document.getElementById("srtFile")?.click()}
            >
              <input
                type="file"
                accept=".srt"
                id="srtFile"
                className="hidden"
                onChange={(e) => setSrtFile(e.target.files?.[0] || null)}
              />
              <div className="text-gray-400 text-sm">
                {srtFile ? (
                  <span className="text-green-400">{srtFile.name}</span>
                ) : (
                  <span>Click to upload SRT</span>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-colors"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
