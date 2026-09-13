import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function ImportScenes() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleImport = async () => {
    if (!file || !projectId) return;
    setLoading(true);
    setResult("");
    try {
      const formData = new FormData();
      formData.append("scenes_file", file);
      const res = await fetch(`http://localhost:8000/projects/${projectId}/import-scenes`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`✓ ${data.total_clips} clips imported successfully`);
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
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-2xl">
            📥
          </div>
          <div>
            <h1 className="text-3xl font-bold">Import AI Scenes</h1>
            <p className="text-gray-400 text-sm">Upload AI-generated clip timestamps to auto-populate your project</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 mb-6 space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">💡 How to use</h3>
        <p className="text-sm text-gray-400 mb-2">
          If you have an AI tool that generates scene timestamps, export them as JSON and upload here.
        </p>
        <p className="text-xs text-gray-500">
          Expected JSON format: <code className="text-blue-400">{"{ clips: [{ start, end, title, hook, next_hook }] }"}</code>
        </p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Upload AI-generated JSON
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all hover:border-blue-500 hover:bg-gray-900/50 ${
              file ? "border-green-500/50 bg-green-900/10" : "border-gray-700"
            }`}
            onClick={() => document.getElementById("sceneFile")?.click()}
          >
            <input
              type="file"
              accept=".json"
              className="hidden"
              id="sceneFile"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="text-sm">
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-green-400 font-medium">{file.name}</span>
                </div>
              ) : (
                <div>
                  <div className="text-gray-500 text-3xl mb-2">📄</div>
                  <span className="text-gray-400">Click to upload JSON</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleImport}
          disabled={loading || !file || !projectId}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 rounded-lg font-semibold text-white transition-all shadow-lg shadow-blue-600/20"
        >
          {loading ? "Importing..." : "📥 Import Scenes"}
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
