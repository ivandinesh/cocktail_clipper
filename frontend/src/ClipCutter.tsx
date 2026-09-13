import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./index.css";

export default function ClipCutter() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [startTime, setStartTime] = useState("00:00:00.000");
  const [endTime, setEndTime] = useState("00:00:10.000");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleCut = async () => {
    if (!projectId) return;
    setLoading(true);
    setResult("");
    try {
      const formData = new FormData();
      formData.append("start_time", startTime);
      formData.append("end_time", endTime);
      formData.append("clip_title", title || `Clip ${Date.now()}`);

      const res = await fetch(`http://localhost:8000/projects/${projectId}/cut`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`✓ Clip cut: ${data.clip_id} (${startTime} → ${endTime})`);
        setTitle("");
      } else {
        setResult(`Error: ${data.detail}`);
      }
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="hero-icon" style={{ width: 80, height: 80, fontSize: 36 }}>✂️</div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight">Clip Cutter</h1>
        <p className="text-zinc-500 text-lg">Extract video segments from your source using timestamps</p>
      </div>

      {/* How it works */}
      <div className="page-card mb-8">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">💡 How to cut clips</h3>
        <div className="space-y-2">
          <div className="step-card">
            <div className="step-number bg-orange-600/20 text-orange-400">1</div>
            <div className="text-sm text-zinc-400">Enter start and end time in <span className="code-text">HH:MM:SS.mmm</span> format</div>
          </div>
          <div className="step-card">
            <div className="step-number bg-orange-600/20 text-orange-400">2</div>
            <div className="text-sm text-zinc-400">Optionally name the clip for easy identification</div>
          </div>
          <div className="step-card">
            <div className="step-number bg-green-600/20 text-green-400">3</div>
            <div className="text-sm text-zinc-400">Clip is extracted with subtitles automatically included</div>
          </div>
        </div>
      </div>

      <div className="page-card space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Start Time</label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="00:02:13.500"
              className="input-field font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">End Time</label>
            <input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="00:02:42.800"
              className="input-field font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Clip Title</label>
          <p className="text-xs text-zinc-600 mb-3">Optional — used to identify this clip in the table</p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., He revealed the secret"
            className="input-field"
          />
        </div>

        <button
          onClick={handleCut}
          disabled={loading || !projectId}
          className="btn-orange w-full"
        >
          {loading ? "✂️ Cutting..." : "✂️ Cut Clip"}
        </button>

        {result && (
          <div className={`flex items-center gap-2 ${result.startsWith("✓") ? "alert-success" : "alert-error"}`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
