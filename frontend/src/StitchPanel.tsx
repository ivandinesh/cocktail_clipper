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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Stitch & Brand</h1>
      <div className="space-y-5">
        <div className="bg-gray-900 rounded-lg p-5 space-y-3">
          <p className="text-gray-400 text-sm">
            Combines all cut clips with intro/outro branding into final videos.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">Status:</span>
            <span className="text-yellow-400">
              {projectId ? "Ready to stitch" : "Select a project"}
            </span>
          </div>
        </div>

        <button
          onClick={handleStitch}
          disabled={loading || !projectId}
          className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg font-medium text-white transition-colors"
        >
          {loading ? "Stitching..." : "Stitch All Clips"}
        </button>

        {progress > 0 && progress < 100 && (
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        {result && (
          <div className={`p-3 rounded-lg text-sm ${result.startsWith("✓") ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
            {result}
          </div>
        )}

        {result.startsWith("✓") && (
          <button
            onClick={handleDownload}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-white transition-colors"
          >
            Download Final Video
          </button>
        )}
      </div>
    </div>
  );
}
