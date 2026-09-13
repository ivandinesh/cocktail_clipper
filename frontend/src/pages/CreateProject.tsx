import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Download, FileText, Link2, LoaderCircle, Upload, Youtube } from "lucide-react";
import { DropZone } from "../components/ui/DropZone";
import { Button } from "../components/ui";
import { useProjectStore } from "../stores/projectStore";

interface CreateProjectProps { compact?: boolean }
interface MediaMetadata { title: string; creator: string; duration?: number; thumbnail?: string; subtitles: { manual: string[]; automatic: string[]; available: boolean } }
interface ImportJob { id: string; status: "processing" | "completed" | "failed"; stage: string; progress: number; project_id: string; downloaded_bytes?: number; total_bytes?: number; speed?: number; error?: string }

const formatTime = (seconds?: number) => {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = Math.floor(seconds % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};
const formatBytes = (bytes?: number) => bytes ? `${(bytes / 1048576).toFixed(1)} MB` : "—";

export function CreateProject({ compact = false }: CreateProjectProps) {
  const [mode, setMode] = useState<"local" | "youtube">("local");
  const [projectName, setProjectName] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [quality, setQuality] = useState("1080p");
  const [importSubtitles, setImportSubtitles] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const detectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const addToast = useProjectStore((state) => state.addToast);
  const apiBaseUrl = import.meta.env.VITE_API_URL || "";

  const inspectUrl = useCallback(async (value: string) => {
    if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(value.trim())) { setMetadata(null); setError(value.trim() ? "Paste a valid YouTube video link" : ""); return; }
    setDetecting(true); setError(""); setMetadata(null);
    try {
      const response = await fetch(`${apiBaseUrl}/imports/metadata`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: value.trim() }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "Could not inspect this YouTube video");
      setMetadata(data); setProjectName((name) => name || data.title);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not inspect this video"); }
    finally { setDetecting(false); }
  }, [apiBaseUrl]);

  const handleUrlChange = (value: string) => {
    setUrl(value); setError(""); setMetadata(null);
    if (detectTimer.current) clearTimeout(detectTimer.current);
    if (value.trim()) detectTimer.current = setTimeout(() => inspectUrl(value), 650);
  };
  useEffect(() => () => { if (detectTimer.current) clearTimeout(detectTimer.current); }, []);

  useEffect(() => {
    if (!job || job.status !== "processing") return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`${apiBaseUrl}/imports/${job.id}`);
      if (!response.ok) return;
      const next = await response.json() as ImportJob;
      setJob(next);
      if (next.status === "completed") {
        window.clearInterval(timer);
        addToast({ type: "success", title: "YouTube import ready", message: "Video and available transcript were added." });
        navigate(`/?projectId=${next.project_id}`);
      } else if (next.status === "failed") { window.clearInterval(timer); setError(next.error || "YouTube import failed"); }
    }, 750);
    return () => window.clearInterval(timer);
  }, [job, apiBaseUrl, addToast, navigate]);

  const handleDrop = useCallback((files: File[]) => {
    const video = files.find((file) => file.name.toLowerCase().endsWith(".mp4"));
    const subtitle = files.find((file) => file.name.toLowerCase().endsWith(".srt"));
    if (video) setVideoFile(video); if (subtitle) setSrtFile(subtitle);
  }, []);

  const createLocal = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); if (!videoFile) { setError("Choose an MP4 video first"); return; } setLoading(true);
    try {
      const body = new FormData(); body.append("video", videoFile); if (srtFile) body.append("subtitle", srtFile); body.append("project_name", projectName || "Untitled Project");
      const response = await fetch(`${apiBaseUrl}/projects/create`, { method: "POST", body }); const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail || "Project creation failed"); navigate(`/?projectId=${data.project_id}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Project creation failed"); } finally { setLoading(false); }
  };

  const startYoutubeImport = async () => {
    if (!metadata) return; setError(""); setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/imports/start`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, project_name: projectName || metadata.title, quality, import_subtitles: importSubtitles }) });
      const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.detail || "Could not start import"); setJob(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not start import"); } finally { setLoading(false); }
  };

  const busy = loading || job?.status === "processing";
  const stageLabel = job?.stage === "merging" ? "Merging audio and video…" : job?.stage === "preparing" ? "Preparing import…" : "Downloading video…";

  return <div className={`${compact ? "p-4 sm:p-6" : "flex min-h-[calc(100vh-64px)] items-center justify-center p-6 sm:p-10"} relative overflow-y-auto`}><div className="w-full max-w-2xl animate-fade-in-up">
    {!compact && <div className="mb-9 text-center"><div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-3xl text-white shadow-2xl shadow-indigo-500/30">✦</div><p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-violet-600">Local-first video studio</p><h1 className="text-gradient mb-4 text-5xl font-black tracking-[-0.06em] sm:text-6xl">CocktailClips</h1></div>}
    <div className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-xl shadow-slate-900/10 backdrop-blur-xl sm:p-7">
      <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">Create a project</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Import media</h2><p className="mt-2 text-sm text-slate-500">Upload an MP4 or import a YouTube video with its available transcript.</p></div>
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => { setMode("local"); setError(""); }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${mode === "local" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}><Upload size={16}/> Local file</button><button type="button" onClick={() => { setMode("youtube"); setError(""); }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${mode === "youtube" ? "bg-white text-red-600 shadow-sm" : "text-slate-500"}`}><Youtube size={17}/> YouTube</button></div>
      {mode === "local" ? <form onSubmit={createLocal} className="space-y-5"><DropZone onDrop={handleDrop} onFileSelect={() => document.getElementById("videoFile")?.click()}><Upload className="mx-auto mb-3 text-blue-600" size={30}/><p className="font-bold text-slate-800">Drop your video here</p><p className="mt-1 text-sm text-slate-500">MP4 video · optional SRT transcript</p></DropZone><input type="file" accept=".mp4" id="videoFile" className="hidden" onChange={(event) => setVideoFile(event.target.files?.[0] || null)}/><input type="file" accept=".srt" id="srtFile" className="hidden" onChange={(event) => setSrtFile(event.target.files?.[0] || null)}/><div className="flex flex-wrap gap-2">{videoFile && <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><Check className="mr-1 inline" size={13}/>{videoFile.name}</span>}<button type="button" onClick={() => document.getElementById("srtFile")?.click()} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"><FileText className="mr-1 inline" size={13}/>{srtFile?.name || "Add SRT"}</button></div><ProjectName value={projectName} onChange={setProjectName}/><Button type="submit" disabled={busy || !videoFile} className="w-full" size="lg">{loading ? "Creating…" : "Create project"}</Button></form> :
      <div className="space-y-5"><label className="block text-sm font-semibold text-slate-700">YouTube video link<div className="relative mt-2"><Link2 className="absolute left-3 top-3 text-slate-400" size={18}/><input className="input-field pl-10" value={url} onChange={(event) => handleUrlChange(event.target.value)} placeholder="https://youtube.com/watch?v=…" disabled={busy}/>{detecting && <LoaderCircle className="absolute right-3 top-3 animate-spin text-violet-600" size={18}/>}</div></label>
      {metadata && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 sm:flex">{metadata.thumbnail && <img src={metadata.thumbnail} className="aspect-video w-full object-cover sm:w-52" alt="Video thumbnail"/>}<div className="min-w-0 flex-1 p-4"><div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600"><Youtube size={15}/> YouTube · {formatTime(metadata.duration)}</div><h3 className="line-clamp-2 font-bold text-slate-950">{metadata.title}</h3><p className="mt-1 truncate text-sm text-slate-500">{metadata.creator}</p><p className="mt-3 text-xs font-medium text-slate-500">{metadata.subtitles.available ? `Captions available · ${metadata.subtitles.manual.length ? "manual preferred" : "automatic"}` : "No captions reported"}</p></div></div>}
      {metadata && <><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Video quality<select className="input-field mt-2" value={quality} onChange={(event) => setQuality(event.target.value)}><option value="best">Best available</option><option value="1080p">1080p</option><option value="720p">720p</option><option value="480p">480p</option></select></label><label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={importSubtitles} onChange={(event) => setImportSubtitles(event.target.checked)} disabled={!metadata.subtitles.available}/><span>Import transcript<br/><span className="text-xs font-normal text-slate-500">Save as SRT when available</span></span></label></div><ProjectName value={projectName} onChange={setProjectName}/></>}
      {job?.status === "processing" && <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4"><div className="mb-2 flex justify-between text-sm font-bold text-violet-900"><span>{stageLabel}</span><span>{Math.round(job.progress || 0)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-violet-200"><div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${job.progress || 2}%` }}/></div><p className="mt-2 text-xs text-violet-700">{formatBytes(job.downloaded_bytes)} / {formatBytes(job.total_bytes)}{job.speed ? ` · ${formatBytes(job.speed)}/s` : ""}</p></div>}
      <Button type="button" onClick={startYoutubeImport} disabled={busy || !metadata} className="w-full" size="lg"><Download size={17}/>{busy ? "Importing…" : "Import YouTube video"}</Button></div>}
      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    </div></div></div>;
}

function ProjectName({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-semibold text-slate-700">Project name<input className="input-field mt-2" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Untitled project"/></label>;
}
