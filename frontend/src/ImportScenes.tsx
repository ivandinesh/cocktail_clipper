import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./index.css";

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
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="hero-icon" style={{ width: 80, height: 80, fontSize: 36 }}>📥</div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight">Import AI Scenes</h1>
        <p className="text-zinc-500 text-lg">Upload AI-generated clip timestamps to auto-populate your project</p>
      </div>

      {/* How it works */}
      <div className="page-card mb-8">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">💡 How to use</h3>
        <div className="space-y-2">
          <div className="step-card">
            <div className="step-number bg-blue-600/20 text-blue-400">1</div>
            <div className="text-sm text-zinc-400">Export scene timestamps from your AI tool as JSON</div>
          </div>
          <div className="step-card">
            <div className="step-number bg-blue-600/20 text-blue-400">2</div>
            <div className="text-sm text-zinc-400">Upload the JSON file here</div>
          </div>
          <div className="step-card">
            <div className="step-number bg-green-600/20 text-green-400">3</div>
            <div className="text-sm text-zinc-400">Clips are automatically added to your project</div>
          </div>
        </div>
        <p className="text-xs text-zinc-600 mt-4">
          Expected format: <span className="code-text">{"{ clips: [{ start, end, title, hook, next_hook }] }"}</span>
        </p>
      </div>

      <div className="page-card space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-3">Upload AI-generated JSON</label>
          <div
            className={`drop-zone ${file ? "has-file" : ""}`}
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
                  <div className="text-4xl mb-3">📄</div>
                  <span className="text-zinc-500">Click to upload JSON</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleImport}
          disabled={loading || !file || !projectId}
          className="btn-primary w-full"
        >
          {loading ? "Importing..." : "📥 Import Scenes"}
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
