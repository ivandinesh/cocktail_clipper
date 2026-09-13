import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./index.css";

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
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="hero-icon" style={{ width: 80, height: 80, fontSize: 36 }}>🧵</div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight">Stitch & Brand</h1>
        <p className="text-zinc-500 text-lg">Combine all clips with intro/outro branding into final videos</p>
      </div>

      {/* How it works */}
      <div className="page-card mb-8">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">💡 How stitching works</h3>
        <div className="space-y-3">
          <div className="step-card">
            <div className="step-number bg-zinc-700 text-zinc-300">1</div>
            <div className="text-sm text-zinc-400">Intro card with channel name appears first</div>
          </div>
          <div className="step-card">
            <div className="step-number bg-zinc-700 text-zinc-300">2</div>
            <div className="text-sm text-zinc-400">All cut clips are concatenated in order</div>
          </div>
          <div className="step-card">
            <div className="step-number bg-zinc-700 text-zinc-300">3</div>
            <div className="text-sm text-zinc-400">Outro card with next_hook text appears last</div>
          </div>
          <div className="step-card">
            <div className="step-number bg-blue-600/20 text-blue-400">4</div>
            <div className="text-sm text-zinc-400">Subtitles are burned in automatically. Logo overlay if available.</div>
          </div>
        </div>
      </div>

      <div className="page-card space-y-5">
        <div className="bg-black/30 rounded-xl p-6 space-y-3">
          <p className="text-zinc-400 text-sm">
            Combines all cut clips with intro/outro branding into final videos.
          </p>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-600">Status:</span>
            <span className={projectId ? "text-yellow-400" : "text-zinc-700"}>
              {projectId ? "⚡ Ready to stitch" : "❌ Select a project"}
            </span>
          </div>
        </div>

        <button
          onClick={handleStitch}
          disabled={loading || !projectId}
          className="btn-green w-full"
        >
          {loading ? "🧵 Stitching..." : "🧵 Stitch All Clips"}
        </button>

        {progress > 0 && progress < 100 && (
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(to right, #3b82f6, #8b5cf6)"
              }}
            />
          </div>
        )}

        {result && (
          <div className={`flex items-center gap-2 ${result.startsWith("✓") ? "alert-success" : "alert-error"}`}>
            {result}
          </div>
        )}

        {result.startsWith("✓") && (
          <button
            onClick={handleDownload}
            className="btn-primary w-full"
          >
            📥 Download Final Video
          </button>
        )}
      </div>
    </div>
  );
}
