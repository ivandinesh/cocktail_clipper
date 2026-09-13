import { useState } from "react";
import { Check, Copy, Download, Upload, Wand2, Code, AlertCircle } from "lucide-react";
import type { Project } from "../../types";
import { Button } from "../ui";
import { ProgressBar } from "../ui";

interface JSONEditorProps {
  project: Project;
  onSave: (json: string) => void;
}

export function JSONEditor({ project, onSave }: JSONEditorProps) {
  const [mode, setMode] = useState<"visual" | "json">("visual");
  const [jsonText, setJsonText] = useState(JSON.stringify(project, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleValidate = () => {
    try {
      JSON.parse(jsonText);
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode("visual")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === "visual" ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <Wand2 size={12} className="inline mr-1" />
          Visual
        </button>
        <button
          onClick={() => setMode("json")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === "json" ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          <Code size={12} className="inline mr-1" />
          JSON
        </button>
      </div>

      {mode === "visual" ? (
        /* Visual Mode */
        <div className="space-y-3">
          <div className="p-3 bg-zinc-50 rounded-xl">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Project Name</label>
            <p className="text-sm text-zinc-900 mt-1">{project.project.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-zinc-50 rounded-xl">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Source Video</label>
              <p className="text-sm text-zinc-900 mt-1">{project.source.video}</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Subtitle</label>
              <p className="text-sm text-zinc-900 mt-1">{project.source.subtitle}</p>
            </div>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Brand cards</label>
            <p className="text-sm text-zinc-900 mt-1">{project.branding.opening_image && project.branding.closing_image ? "Opening and closing images ready" : "Images not configured"}</p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Clips</label>
            <p className="text-sm text-zinc-900 mt-1">{project.clips.length} clips</p>
            {project.clips.map((clip, i) => (
              <div key={i} className="flex items-center gap-2 mt-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${
                  clip.status === "completed" ? "bg-green-500" :
                  clip.status === "cut" ? "bg-orange-500" : "bg-zinc-300"
                }`} />
                <span className="text-zinc-700">{clip.title}</span>
                <span className="text-zinc-400 font-mono">{clip.start} → {clip.end}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* JSON Mode */
        <div className="space-y-3">
          <textarea
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setError(null); }}
            className="w-full h-64 px-3 py-2 bg-zinc-950 text-green-400 font-mono text-xs rounded-xl border border-zinc-800 focus:outline-none focus:border-blue-500 resize-none"
            spellCheck={false}
          />
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle size={12} />
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleValidate}>✓ Validate</Button>
            <Button size="sm" variant="secondary" onClick={handleFormat}>Format</Button>
            <Button size="sm" variant="secondary" onClick={handleCopy}>Copy</Button>
            <Button size="sm" variant="secondary" onClick={() => onSave(jsonText)}>Save</Button>
          </div>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
          <Check size={12} />
          Saved successfully
        </div>
      )}
    </div>
  );
}
