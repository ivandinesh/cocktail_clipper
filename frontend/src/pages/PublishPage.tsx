import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, ExternalLink, KeyRound, Loader2, LogOut, ShieldCheck, Upload, Youtube } from "lucide-react";
import { Button } from "../components/ui";
import { useProjectStore } from "../stores/projectStore";
import type { Clip, Project } from "../types";

type Connection = { configured: boolean; connected: boolean; error?: string | null };
type Job = { id: string; status: "queued" | "uploading" | "completed" | "failed"; progress: number; error?: string; video_url?: string };

export function PublishPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const navigate = useNavigate();
  const project = useProjectStore((state) => state.project);
  const setProject = useProjectStore((state) => state.setProject);
  const addToast = useProjectStore((state) => state.addToast);
  const [connection, setConnection] = useState<Connection>({ configured: false, connected: false });
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [privacy, setPrivacy] = useState("private");
  const [madeForKids, setMadeForKids] = useState(false);
  const [syntheticMedia, setSyntheticMedia] = useState(false);
  const [notifySubscribers, setNotifySubscribers] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const secretInput = useRef<HTMLInputElement>(null);

  const refreshConnection = useCallback(async () => {
    const response = await fetch("/publishing/youtube/status");
    if (response.ok) setConnection(await response.json());
  }, []);

  useEffect(() => {
    void refreshConnection();
    if (!projectId || project?.project.id === projectId) return;
    fetch(`/projects/${encodeURIComponent(projectId)}`).then((response) => response.json()).then((data: Project) => setProject(data)).catch(() => undefined);
  }, [projectId, project?.project.id, refreshConnection, setProject]);

  useEffect(() => {
    const connected = (event: MessageEvent) => { if (event.data === "youtube-connected") void refreshConnection(); };
    window.addEventListener("message", connected);
    return () => window.removeEventListener("message", connected);
  }, [refreshConnection]);

  const clips = useMemo(() => (project?.clips || []).filter((clip) => clip.individual_render_status === "completed" && clip.final_file?.startsWith("final/clips/")), [project?.clips]);
  const selected = clips.find((clip) => clip.id === selectedId) || clips[0];

  useEffect(() => {
    if (!selected) return;
    setSelectedId(selected.id); setTitle(selected.title || `Clip ${selected.id}`); setDescription(""); setTags(""); setJob(null);
  }, [selected?.id]);

  useEffect(() => {
    if (!job || !["queued", "uploading"].includes(job.status)) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/publishing/jobs/${encodeURIComponent(job.id)}`);
      if (!response.ok) return;
      const next = await response.json() as Job; setJob(next);
      if (next.status === "completed" || next.status === "failed") window.clearInterval(timer);
    }, 900);
    return () => window.clearInterval(timer);
  }, [job]);

  const uploadSecret = async (file?: File) => {
    if (!file) return; setBusy(true);
    try {
      const form = new FormData(); form.append("client_secret", file);
      const response = await fetch("/publishing/youtube/client-secret", { method: "POST", body: form }); const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not save OAuth configuration"); setConnection(data);
      addToast({ type: "success", title: "Google OAuth configured", message: "You can now connect your YouTube account." });
    } catch (reason) { addToast({ type: "error", title: "Configuration failed", message: reason instanceof Error ? reason.message : "Could not save OAuth configuration" }); }
    finally { setBusy(false); }
  };

  const connect = async () => {
    const response = await fetch("/publishing/youtube/connect", { method: "POST" }); const data = await response.json();
    if (!response.ok) { addToast({ type: "error", title: "Could not connect", message: data.detail }); return; }
    window.open(data.authorization_url, "youtube-oauth", "popup,width=560,height=720");
  };

  const disconnect = async () => { await fetch("/publishing/youtube/connection", { method: "DELETE" }); setConnection((value) => ({ ...value, connected: false })); };

  const publish = async () => {
    if (!selected || !projectId) return; setBusy(true); setJob(null);
    try {
      const response = await fetch(`/projects/${encodeURIComponent(projectId)}/clips/${encodeURIComponent(selected.id)}/publish/youtube`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), privacy, made_for_kids: madeForKids, contains_synthetic_media: syntheticMedia, notify_subscribers: notifySubscribers }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.detail || "Could not start publishing"); setJob(data);
    } catch (reason) { addToast({ type: "error", title: "Publishing failed", message: reason instanceof Error ? reason.message : "Could not publish clip" }); }
    finally { setBusy(false); }
  };

  if (!project) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-violet-600"/></div>;

  return <main className="h-full overflow-y-auto px-4 py-6 sm:px-8"><div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><button onClick={() => navigate(`/?projectId=${encodeURIComponent(projectId)}`)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-slate-600 shadow-sm hover:bg-slate-50" aria-label="Back to project"><ArrowLeft size={18}/></button><div><p className="text-xs font-bold uppercase tracking-[.18em] text-red-600">YouTube Studio</p><h1 className="text-3xl font-black tracking-tight text-slate-950">Publish clips</h1></div></div><div className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${connection.connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{connection.connected ? <ShieldCheck size={15}/> : <KeyRound size={15}/>} {connection.connected ? "YouTube connected" : "Not connected"}</div></div>

    {!connection.connected && <section className="mac-window rounded-[24px] p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="max-w-2xl"><h2 className="text-lg font-bold text-slate-950">Connect your YouTube account</h2><p className="mt-2 text-sm leading-6 text-slate-500">Create a Desktop OAuth client in Google Cloud, enable YouTube Data API v3, and upload the downloaded JSON. Credentials stay in the local ignored <code>.secrets</code> folder.</p></div><div className="flex shrink-0 gap-2"><input ref={secretInput} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void uploadSecret(event.target.files?.[0])}/><Button variant="secondary" onClick={() => secretInput.current?.click()} disabled={busy}><Upload size={15} className="mr-2"/>{connection.configured ? "Replace OAuth JSON" : "Add OAuth JSON"}</Button><Button onClick={connect} disabled={!connection.configured}><Youtube size={16} className="mr-2"/>Connect</Button></div></div></section>}

    {connection.connected && <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]"><section className="mac-window overflow-hidden rounded-[24px]"><div className="border-b border-black/5 px-5 py-4"><h2 className="font-bold text-slate-900">Rendered clips</h2><p className="mt-1 text-xs text-slate-500">Choose one clip to publish.</p></div><div className="max-h-[65vh] divide-y divide-black/5 overflow-y-auto">{clips.map((clip: Clip) => <button key={clip.id} onClick={() => setSelectedId(clip.id)} className={`w-full px-5 py-4 text-left transition ${selected?.id === clip.id ? "bg-red-50" : "hover:bg-slate-50"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{clip.title}</p><p className="mt-1 font-mono text-xs text-slate-400">{clip.start} → {clip.end}</p></div>{clip.publishing?.youtube?.status === "published" && <Check size={16} className="shrink-0 text-emerald-600"/>}</div></button>)}</div></section>

      <section className="mac-window rounded-[24px] p-6">{selected ? <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-red-600">Clip {selected.id}</p><h2 className="mt-1 text-xl font-black text-slate-950">YouTube details</h2></div><label className="block text-sm font-semibold text-slate-700">Title<input className="input-field mt-2" maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)}/><span className="mt-1 block text-right text-xs text-slate-400">{title.length}/100</span></label><label className="block text-sm font-semibold text-slate-700">Description<textarea className="input-field mt-2 min-h-32 resize-y" maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)}/></label><label className="block text-sm font-semibold text-slate-700">Tags<input className="input-field mt-2" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="health, shorts, education"/></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Privacy<select className="input-field mt-2" value={privacy} onChange={(event) => setPrivacy(event.target.value)}><option value="private">Private (recommended)</option><option value="unlisted">Unlisted</option><option value="public">Public</option></select></label><div className="space-y-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700"><label className="flex items-center gap-2"><input type="checkbox" checked={madeForKids} onChange={(event) => setMadeForKids(event.target.checked)}/> Made for kids</label><label className="flex items-center gap-2"><input type="checkbox" checked={syntheticMedia} onChange={(event) => setSyntheticMedia(event.target.checked)}/> Contains synthetic media</label><label className="flex items-center gap-2"><input type="checkbox" checked={notifySubscribers} onChange={(event) => setNotifySubscribers(event.target.checked)}/> Notify subscribers</label></div></div>
        {job && <div className={`rounded-xl border p-4 ${job.status === "failed" ? "border-rose-200 bg-rose-50" : job.status === "completed" ? "border-emerald-200 bg-emerald-50" : "border-violet-200 bg-violet-50"}`}><div className="flex items-center justify-between text-sm font-bold"><span>{job.status === "completed" ? "Published" : job.status === "failed" ? "Upload failed" : "Uploading to YouTube…"}</span><span>{Math.round(job.progress || 0)}%</span></div>{["queued", "uploading"].includes(job.status) && <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-200"><div className="h-full bg-violet-600 transition-all" style={{ width: `${Math.max(job.progress, 2)}%` }}/></div>}{job.error && <p className="mt-2 text-xs text-rose-700">{job.error}</p>}{job.video_url && <a href={job.video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">Open on YouTube <ExternalLink size={14}/></a>}</div>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-5"><Button variant="ghost" onClick={disconnect}><LogOut size={15} className="mr-2"/>Disconnect</Button><Button onClick={publish} disabled={busy || !title.trim() || ["queued", "uploading"].includes(job?.status || "")}><Youtube size={17} className="mr-2"/>{job?.status === "completed" ? "Publish again" : "Publish to YouTube"}</Button></div></div> : <p className="text-sm text-slate-500">Render a clip before publishing.</p>}</section></div>}
  </div></main>;
}
