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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Import AI Scenes</h1>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Upload AI-generated JSON
          </label>
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".json"
              className="hidden"
              id="sceneFile"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="sceneFile" className="cursor-pointer">
              <div className="text-gray-400 text-sm">
                {file ? <span className="text-green-400">{file.name}</span> : "Click to upload JSON"}
              </div>
            </label>
          </div>
        </div>
        <button
          onClick={handleImport}
          disabled={loading || !file || !projectId}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-medium text-white transition-colors"
        >
          {loading ? "Importing..." : "Import Scenes"}
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
