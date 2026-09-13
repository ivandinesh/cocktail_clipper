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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Clip Cutter</h1>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="00:02:13.500"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white font-mono focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
            <input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="00:02:42.800"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white font-mono focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Clip Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title for this clip"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none"
          />
        </div>
        <button
          onClick={handleCut}
          disabled={loading || !projectId}
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-lg font-medium text-white transition-colors"
        >
          {loading ? "Cutting..." : "Cut Clip"}
        </button>
        {result && (
          <div className={`p-3 rounded-lg text-sm ${result.startsWith("✓") ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
