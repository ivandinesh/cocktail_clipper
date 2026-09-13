import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function StitchPanel() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [progress, setProgress] = useState(0);

  const handleStitch = async () => {
    if (!projectId) return;
    setLoading(true);
    setResult("");
    setProgress(0);
    try {
      const res = await fetch(`http://localhost:8000/projects/${projectId}/stitch`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`✓ Stitched: ${data.total_clips} clips → final/${data.final_file}`);
        setProgress(100);
      } else {
        setResult(`Error: ${data.detail}`);
      }
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`http://localhost:8000/projects/${projectId}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "final_video.mp4";
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {}
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-green-600/20 border border-green-500/30 flex items-center justify-center text-2xl">
            🧵
          </div>
          <div>
            <h1 className="text-3xl font-bold">Stitch & Brand</h1>
            <p className="text-gray-400 text-sm">Combine all clips with intro/outro branding into final videos</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 mb-6 space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">💡 How stitching works</h3>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center text-xs font-bold">1</span>
          <span>Intro card with channel name appears first</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center text-xs font-bold">2</span>
          <span>All cut clips are concatenated in order</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center text-xs font-bold">3</span>
          <span>Outro card with next_hook text appears last</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Subtitles are automatically burned into each clip. Logo overlay is applied if available.
        </p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-5">
        <div className="bg-gray-950 rounded-lg p-5 space-y-3">
          <p className="text-gray-400 text-sm">
            Combines all cut clips with intro/outro branding into final videos.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Status:</span>
            <span className={`${projectId ? "text-yellow-400" : "text-gray-600"}`}>
              {projectId ? "⚡ Ready to stitch" : "❌ Select a project"}
            </span>
          </div>
        </div>

        <button
          onClick={handleStitch}
          disabled={loading || !projectId}
          className="w-full py-3.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 rounded-lg font-semibold text-white transition-all shadow-lg shadow-green-600/20"
        >
          {loading ? "🧵 Stitching..." : "🧵 Stitch All Clips"}
        </button>

        {progress > 0 && progress < 100 && (
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}

        {result && (
          <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${
            result.startsWith("✓")
              ? "bg-green-900/30 text-green-400 border border-green-700/30"
              : "bg-red-900/30 text-red-400 border border-red-700/30"
          }`}>
            {result}
          </div>
        )}

        {result.startsWith("✓") && (
          <button
            onClick={handleDownload}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg font-semibold text-white transition-all shadow-lg shadow-blue-600/20"
          >
            📥 Download Final Video
          </button>
        )}
      </div>
    </div>
  );
}
