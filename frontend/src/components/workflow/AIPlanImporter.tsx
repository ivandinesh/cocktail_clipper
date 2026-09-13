import { useMemo, useRef, useState } from "react";
import { Check, Clipboard, FileJson, Upload, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useProjectStore } from "../../stores/projectStore";
import { Button } from "../ui";

type PlanClip = {
  id: string;
  start: string;
  end: string;
  title: string;
  hook?: string;
  next_hook?: string;
};

const AI_SCENE_PROMPT = `You are a short-form video editor. Analyze the transcript below and identify the strongest moments for short-form reels.

Rules:
- Return ONLY valid JSON. Do not include Markdown fences or commentary.
- Return 5 to 15 clips, depending on how many genuinely strong moments exist.
- Each clip should usually be 15 to 60 seconds and must be a complete, understandable moment.
- Use timestamps from the transcript exactly. Format every timestamp as HH:MM:SS.mmm.
- Never invent timestamps outside the transcript duration.
- Avoid overlapping clips unless there is a strong editorial reason.
- Give each clip a concise title.
- Write a compelling hook for the opening frame.
- Write a short subscribe/follow message for the ending frame.

Return exactly this shape:
{
  "clips": [
    {
      "id": "001",
      "start": "00:02:13.500",
      "end": "00:02:42.800",
      "title": "He revealed the secret",
      "hook": "You won't believe what he admitted",
      "next_hook": "Follow for more"
    }
  ]
}

Transcript:
PASTE TRANSCRIPT OR SRT TEXT HERE`;

function normalizeTimestamp(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (/^\d+:\d{2}$/.test(raw)) return `00:${raw}.000`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return `${raw}.000`;
  return raw;
}

function parsePlan(text: string): PlanClip[] {
  const payload = JSON.parse(text) as unknown;
  const rawItems = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object"
      ? ((payload as Record<string, unknown>).clips || (payload as Record<string, unknown>).scenes || (payload as Record<string, unknown>).segments)
      : null;

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("The plan must contain a non-empty clips or scenes array.");
  }

  const errors: string[] = [];
  const clips: PlanClip[] = [];
  rawItems.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      errors.push(`Item ${index + 1} is not an object.`);
      return;
    }
    const row = item as Record<string, unknown>;
    const start = normalizeTimestamp(row.start || row.start_time || row.from);
    const end = normalizeTimestamp(row.end || row.end_time || row.to);
    if (!/^\d{2}:\d{2}:\d{2}\.\d{3}$/.test(start) || !/^\d{2}:\d{2}:\d{2}\.\d{3}$/.test(end)) {
      errors.push(`Item ${index + 1} needs HH:MM:SS or HH:MM:SS.mmm timestamps.`);
      return;
    }
    if (start >= end) {
      errors.push(`Item ${index + 1} must end after it starts.`);
      return;
    }
    clips.push({
      id: String(row.id || String(index + 1).padStart(3, "0")),
      start,
      end,
      title: String(row.title || row.summary || row.description || `Clip ${index + 1}`),
      hook: row.hook ? String(row.hook) : "",
      next_hook: row.next_hook ? String(row.next_hook) : "Follow for more",
    });
  });

  if (errors.length > 0) throw new Error(errors.slice(0, 5).join(" "));
  return clips;
}

export function AIPlanImporter() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const setProject = useProjectStore((state) => state.setProject);
  const addToast = useProjectStore((state) => state.addToast);
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [plan, setPlan] = useState<PlanClip[]>([]);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewLabel = useMemo(() => {
    if (plan.length === 0) return "No plan validated yet";
    return `${plan.length} ${plan.length === 1 ? "clip" : "clips"} ready to import`;
  }, [plan.length]);

  const validate = () => {
    setError("");
    try {
      setPlan(parsePlan(text));
    } catch (err) {
      setPlan([]);
      setError(err instanceof Error ? err.message : "Could not validate this plan.");
    }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      setError("Choose a .json scene plan file.");
      return;
    }
    setText(await file.text());
    setPlan([]);
    setError("");
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(AI_SCENE_PROMPT);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const importPlan = async () => {
    if (!projectId || plan.length === 0) return;
    setImporting(true);
    setError("");
    try {
      const form = new FormData();
      form.append("project_id", projectId);
      form.append("scenes_file", new Blob([JSON.stringify({ clips: plan })], { type: "application/json" }), "scene-plan.json");
      const response = await fetch("/projects/import-scenes", { method: "POST", body: form });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.detail || "The scene plan could not be imported.");

      const refreshed = await fetch(`/projects/${encodeURIComponent(projectId)}`);
      if (!refreshed.ok) throw new Error("The plan imported, but the project could not be refreshed.");
      setProject(await refreshed.json());
      addToast({ type: "success", title: "Plan imported", message: `${plan.length} clips are ready to cut.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "The scene plan could not be imported.";
      setError(message);
      addToast({ type: "error", title: "Import failed", message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><FileJson size={18} className="text-violet-600" /> Import your AI scene plan</div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Generate the timestamps in ChatGPT, Claude, Gemini, or another AI tool, then paste the JSON here or upload it. CocktailClips validates and executes the plan locally.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()}><Upload size={14} className="mr-2" /> Upload JSON</Button>
        <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" onChange={(event) => void handleFile(event.target.files?.[0])} />
      </div>

      <details className="mt-5 rounded-xl border border-violet-200 bg-white">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-violet-700">Need a prompt? Copy the CocktailClips AI prompt</summary>
        <div className="border-t border-violet-100 p-4">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-200">{AI_SCENE_PROMPT}</pre>
          <Button variant="secondary" size="sm" className="mt-3" onClick={copyPrompt}><Clipboard size={14} className="mr-2" />{copied ? "Copied" : "Copy prompt"}</Button>
        </div>
      </details>

      <textarea value={text} onChange={(event) => { setText(event.target.value); setPlan([]); }} placeholder={'Paste AI output, for example:\n{"clips":[{"start":"00:02:13","end":"00:02:42","title":"The key moment","hook":"You won\'t believe this"}]}' } className="mt-5 min-h-36 w-full resize-y rounded-xl border border-violet-200 bg-white p-4 font-mono text-xs text-slate-800 outline-none ring-violet-200 transition focus:ring-4" />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={validate} disabled={!text.trim()}>Validate plan</Button>
        <Button variant="primary" size="sm" onClick={importPlan} disabled={importing || plan.length === 0}>{importing ? "Importing…" : "Import plan"}</Button>
        <span className="text-xs font-semibold text-slate-500">{previewLabel}</span>
      </div>

      {error && <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><X size={16} className="mt-0.5 shrink-0" />{error}</div>}

      {plan.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-xl border border-violet-100 bg-white">
          <div className="grid grid-cols-[52px_1fr_1fr_2fr] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400"><span>#</span><span>Start</span><span>End</span><span>Title</span></div>
          <div className="max-h-64 overflow-y-auto">
            {plan.map((clip, index) => <div key={`${clip.id}-${index}`} className="grid grid-cols-[52px_1fr_1fr_2fr] gap-3 border-b border-slate-50 px-4 py-3 text-xs text-slate-600 last:border-0"><span className="font-bold text-violet-600">{clip.id}</span><span className="font-mono">{clip.start}</span><span className="font-mono">{clip.end}</span><span className="truncate font-medium text-slate-800">{clip.title}</span></div>)}
          </div>
          <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 text-xs font-semibold text-emerald-700"><Check size={14} /> Validated and ready to import</div>
        </div>
      )}
    </div>
  );
}
