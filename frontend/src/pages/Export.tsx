import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Clapperboard, Download, Eye, ImagePlus, Loader2, Play, Sparkles, Upload, X, Youtube } from "lucide-react";
import { useProjectStore } from "../stores/projectStore";
import type { Clip } from "../types";
import { Button } from "../components/ui";

type ImageSlotProps = {
  label: string;
  hint: string;
  file: File | null;
  stored: boolean;
  storedUrl: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
};

function BrandingImageSlot({ label, hint, file, stored, storedUrl, inputRef }: ImageSlotProps) {
  const preview = useMemo(() => file ? URL.createObjectURL(file) : stored ? storedUrl : null, [file, stored, storedUrl]);
  useEffect(() => () => { if (file && preview) URL.revokeObjectURL(preview); }, [file, preview]);

  return (
    <button type="button" onClick={() => inputRef.current?.click()} className="group relative min-h-56 overflow-hidden rounded-2xl border border-black/10 bg-slate-950 text-left shadow-inner transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-xl">
      {preview ? <img src={preview} alt={`${label} preview`} className="absolute inset-0 h-full w-full object-contain" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,#312e81,transparent_55%)]" />}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/65 to-transparent p-5 pt-14 text-white">
        <div className="flex items-end justify-between gap-4">
          <div><div className="mb-1 flex items-center gap-2 text-sm font-bold"><ImagePlus size={16} /> {label}</div><p className="text-xs leading-5 text-white/65">{file?.name || (stored ? "Saved to this project" : hint)}</p></div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md transition group-hover:bg-white group-hover:text-slate-950"><Upload size={15} /></span>
        </div>
      </div>
      {(file || stored) && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur"><Check size={11} /> Ready</span>}
    </button>
  );
}

function clipDuration(clip: Clip) {
  const seconds = (value: string) => {
    const [hours, minutes, secs] = value.split(":").map(Number);
    return hours * 3600 + minutes * 60 + secs;
  };
  const duration = Math.max(0, seconds(clip.end) - seconds(clip.start));
  return `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, "0")}`;
}

export function Export() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const navigate = useNavigate();
  const project = useProjectStore((state) => state.project);
  const setProject = useProjectStore((state) => state.setProject);
  const addToast = useProjectStore((state) => state.addToast);
  const [savingBranding, setSavingBranding] = useState(false);
  const [renderingIds, setRenderingIds] = useState<string[]>([]);
  const [renderingAll, setRenderingAll] = useState(false);
  const [openingDuration, setOpeningDuration] = useState("1.5");
  const [closingDuration, setClosingDuration] = useState("1.5");
  const [openingImage, setOpeningImage] = useState<File | null>(null);
  const [closingImage, setClosingImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ clip: Clip; nonce: number } | null>(null);
  const openingInput = useRef<HTMLInputElement>(null);
  const closingInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!project?.branding) return;
    setOpeningDuration(String(project.branding.hook_duration ?? 1.5));
    setClosingDuration(String(project.branding.outro_duration ?? 1.5));
  }, [project?.branding]);

  useEffect(() => {
    if (!preview) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setPreview(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [preview]);

  const clips = project?.clips || [];
  const renderableClips = clips.filter((clip) => (clip.status === "cut" || clip.status === "completed") && clip.clip_file);
  const renderedCount = clips.filter((clip) => clip.individual_render_status === "completed" && clip.final_file?.startsWith("final/clips/")).length;
  const openingStored = Boolean(project?.branding?.opening_image);
  const closingStored = Boolean(project?.branding?.closing_image);
  const brandingReady = openingStored && closingStored;
  const imageUrl = (slot: "opening" | "closing") => `/projects/${encodeURIComponent(projectId || "")}/branding/${slot}?v=${encodeURIComponent(project?.branding?.[`${slot}_image`] || "")}`;

  const saveBranding = async () => {
    if (!projectId) return;
    if (!openingImage && !openingStored) { addToast({ type: "warning", title: "Opening image needed", message: "Choose the image shown before every clip." }); return; }
    if (!closingImage && !closingStored) { addToast({ type: "warning", title: "Closing image needed", message: "Choose the image shown after every clip." }); return; }
    setSavingBranding(true);
    try {
      const form = new FormData();
      form.append("hook_duration", openingDuration);
      form.append("outro_duration", closingDuration);
      if (openingImage) form.append("opening_image", openingImage);
      if (closingImage) form.append("closing_image", closingImage);
      const response = await fetch(`/projects/${encodeURIComponent(projectId)}/branding`, { method: "POST", body: form });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.detail || "Could not save branding images");
      setProject(payload.project);
      setOpeningImage(null);
      setClosingImage(null);
      addToast({ type: "success", title: "Brand cards saved", message: "These images will bookend every exported clip." });
    } catch (error) {
      addToast({ type: "error", title: "Branding not saved", message: error instanceof Error ? error.message : "Could not save branding images" });
    } finally { setSavingBranding(false); }
  };

  const renderClips = async (clipIds: string[], all = false) => {
    if (!projectId || clipIds.length === 0 || !brandingReady) return;
    setRenderingIds(clipIds);
    setRenderingAll(all);
    try {
      const response = await fetch(`/projects/${encodeURIComponent(projectId)}/render-clips`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clip_ids: clipIds }) });
      const payload = await response.json().catch(() => null);
      if (payload?.project) setProject(payload.project);
      if (!response.ok) throw new Error(payload?.errors?.[0]?.error || payload?.detail || "Could not render clips");
      const count = payload?.rendered?.length || 0;
      addToast({ type: payload?.errors?.length ? "warning" : "success", title: payload?.errors?.length ? "Export partially completed" : "Clips exported", message: `${count} branded clip${count === 1 ? "" : "s"} saved in final/clips/.` });
    } catch (error) {
      addToast({ type: "error", title: "Export failed", message: error instanceof Error ? error.message : "Could not render clips" });
    } finally { setRenderingIds([]); setRenderingAll(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Delivery</p><h1 className="mt-1 text-3xl font-black tracking-[-0.035em] text-slate-950">Export branded clips</h1><p className="mt-1 text-sm text-slate-500">Every clip is saved separately with the same opening and closing cards.</p></div>
        <div className="flex items-center gap-2"><div className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-black/5"><span className="text-emerald-600">{renderedCount}</span> of {clips.length} exported</div><Button variant="secondary" onClick={() => navigate(`/publish?projectId=${encodeURIComponent(projectId || "")}`)} disabled={renderedCount === 0}><Youtube size={16} className="mr-2 text-red-600"/>Publish</Button></div>
      </div>

      <div className="mac-window overflow-hidden rounded-[24px]">
        <div className="flex items-center justify-between border-b border-black/5 bg-white/55 px-5 py-3"><div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Sparkles size={16} className="text-violet-600" /> Shared brand cards</div><span className="hidden text-xs text-slate-400 sm:block">9:16 artwork · PNG, JPG or WebP</span></div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <BrandingImageSlot label="Opening image" hint="Shown before every clip" file={openingImage} stored={openingStored} storedUrl={imageUrl("opening")} inputRef={openingInput} />
          <BrandingImageSlot label="Closing image" hint="Shown after every clip" file={closingImage} stored={closingStored} storedUrl={imageUrl("closing")} inputRef={closingInput} />
          <input ref={openingInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => setOpeningImage(event.target.files?.[0] || null)} />
          <input ref={closingInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => setClosingImage(event.target.files?.[0] || null)} />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-black/5 bg-slate-50/70 px-5 py-4">
          <div className="flex gap-3">
            <label className="text-xs font-semibold text-slate-500">Opening seconds<input type="number" min="0.5" max="10" step="0.5" value={openingDuration} onChange={(event) => setOpeningDuration(event.target.value)} className="mt-1 block w-28 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" /></label>
            <label className="text-xs font-semibold text-slate-500">Closing seconds<input type="number" min="0.5" max="10" step="0.5" value={closingDuration} onChange={(event) => setClosingDuration(event.target.value)} className="mt-1 block w-28 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" /></label>
          </div>
          <Button variant="secondary" onClick={saveBranding} disabled={savingBranding}><Upload size={15} className="mr-2" />{savingBranding ? "Saving…" : "Save brand cards"}</Button>
        </div>
      </div>

      <div className="mac-window overflow-hidden rounded-[24px]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 bg-white/55 px-5 py-4">
          <div><h2 className="font-bold text-slate-900">Final clips</h2><p className="mt-0.5 text-xs text-slate-500">Rendered files are automatically saved to the project’s final/clips folder.</p></div>
          <Button onClick={() => void renderClips(renderableClips.map((clip) => clip.id), true)} disabled={!brandingReady || renderableClips.length === 0 || renderingIds.length > 0}><Play size={15} className="mr-2" />{renderingAll ? `Rendering ${renderingIds.length} clips…` : "Render all clips"}</Button>
        </div>

        {!brandingReady && <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-800">Save both brand cards before rendering clips.</div>}
        {clips.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">Import an AI plan and cut its clips before exporting.</div> : <div className="divide-y divide-black/5">
          {clips.map((clip, index) => {
            const canRender = Boolean(clip.clip_file && (clip.status === "cut" || clip.status === "completed"));
            const isRendering = renderingIds.includes(clip.id);
            const isReady = clip.individual_render_status === "completed" && Boolean(clip.final_file?.startsWith("final/clips/"));
            const downloadUrl = `/projects/${encodeURIComponent(projectId || "")}/clips/${encodeURIComponent(clip.id)}/download`;
            return <div key={clip.id} className="grid items-center gap-4 px-5 py-4 sm:grid-cols-[44px_72px_minmax(0,1fr)_auto]">
              <div className="text-center font-mono text-xs font-bold text-slate-400">{String(index + 1).padStart(2, "0")}</div>
              <div className="flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-white shadow-inner"><Clapperboard size={22} className="opacity-75" /></div>
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-bold text-slate-900">{clip.title}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isReady ? "bg-emerald-50 text-emerald-700" : clip.individual_render_status === "failed" ? "bg-rose-50 text-rose-700" : canRender ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-500"}`}>{isReady ? "Exported" : clip.individual_render_status === "failed" ? "Failed" : canRender ? "Ready to render" : "Cut required"}</span></div><p className="mt-1 font-mono text-xs text-slate-400">{clip.start} → {clip.end} · {clipDuration(clip)}</p>{clip.render_error && <p className="mt-1 truncate text-xs text-rose-600" title={clip.render_error}>{clip.render_error}</p>}<p className="mt-1 text-xs text-slate-400">{isReady ? clip.final_file : "Opening + clip + closing"}</p></div>
              <div className="flex flex-wrap justify-end gap-2">
                {isReady && <><button type="button" onClick={() => setPreview({ clip, nonce: Date.now() })} className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"><Eye size={14} /> Preview</button><a href={downloadUrl} download className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"><Download size={14} /> Download</a></>}
                <Button size="sm" onClick={() => void renderClips([clip.id])} disabled={!brandingReady || !canRender || renderingIds.length > 0}>{isRendering ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Play size={14} className="mr-2" />}{isRendering ? "Rendering…" : isReady ? "Render again" : "Render clip"}</Button>
              </div>
            </div>;
          })}
        </div>}
      </div>
      {preview && <div role="dialog" aria-modal="true" aria-label={`Preview ${preview.clip.title}`} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}>
        <div className="w-full max-w-4xl overflow-hidden rounded-[24px] border border-white/15 bg-slate-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">Rendered preview</p><h3 className="truncate text-sm font-semibold">{preview.clip.title}</h3></div><button type="button" onClick={() => setPreview(null)} aria-label="Close preview" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"><X size={17}/></button></div>
          <div className="flex max-h-[78vh] justify-center bg-black"><video key={preview.nonce} src={`/projects/${encodeURIComponent(projectId || "")}/clips/${encodeURIComponent(preview.clip.id)}/rendered-preview?v=${preview.nonce}`} className="max-h-[78vh] w-auto max-w-full" controls autoPlay playsInline /></div>
        </div>
      </div>}
    </div>
  );
}
