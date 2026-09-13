import { useState } from "react";
import { useSearchParams } from "react-router-dom";

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
    <div className="p-6 max-w-2xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-2xl">
            ✂️
          </div>
          <div>
            <h1 className="text-3xl font-bold">Clip Cutter</h1>
            <p className="text-gray-400 text-sm">Extract video segments from your source using timestamps</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 mb-6 space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">💡 How to cut clips</h3>
        <p className="text-sm text-gray-400 mb-2">
          Enter the start and end time in <code className="text-blue-400">HH:MM:SS.mmm</code> format (e.g., 00:02:13.500).
        </p>
        <p className="text-xs text-gray-500">
          The clip will be extracted from the source video, subtitles will be automatically included.
        </p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="00:02:13.500"
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
            <input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="00:02:42.800"
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Clip Title</label>
          <p className="text-xs text-gray-500 mb-2">Optional — used to identify this clip in the table</p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., He revealed the secret"
            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-orange-500 outline-none transition-all"
          />
        </div>

        <button
          onClick={handleCut}
          disabled={loading || !projectId}
          className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:opacity-50 rounded-lg font-semibold text-white transition-all shadow-lg shadow-orange-600/20"
        >
          {loading ? "✂️ Cutting..." : "✂️ Cut Clip"}
        </button>

        {result && (
          <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${
            result.startsWith("✓")
              ? "bg-green-900/30 text-green-400 border border-green-700/30"
              : "bg-red-900/30 text-red-400 border border-red-700/30"
          }`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
