import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Download, Film, Play, Sparkles } from "lucide-react";
import { useProjectStore } from "../stores/projectStore";
import type { Clip } from "../types";
import { Button } from "../components/ui";

export function Export() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const project = useProjectStore((state) => state.project);
  const setProject = useProjectStore((state) => state.setProject);
  const addToast = useProjectStore((state) => state.addToast);
  const [rendering, setRendering] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [channel, setChannel] = useState("CocktailClips");
  const [hookDuration, setHookDuration] = useState("1.5");
  const [outroDuration, setOutroDuration] = useState("2");
  const [outroText, setOutroText] = useState("Follow for more");

  useEffect(() => {
    if (!project?.branding) return;
    setChannel(project.branding.channel || "CocktailClips");
    setHookDuration(String(project.branding.hook_duration ?? 1.5));
    setOutroDuration(String(project.branding.outro_duration ?? 2));
    setOutroText(project.branding.outro_text || "Follow for more");
  }, [project?.branding]);

  const clips: Clip[] = project?.clips?.filter((clip) => clip.status === "cut" || clip.status === "completed") || [];
  const outputReady = project?.output?.status === "completed";

  const saveBranding = async () => {
    if (!projectId) return;
    setSavingBranding(true);
    try {
      const form = new FormData();
      form.append("channel", channel);
      form.append("hook_duration", hookDuration);
      form.append("outro_duration", outroDuration);
      form.append("outro_text", outroText);
      const response = await fetch(`/projects/${encodeURIComponent(projectId)}/branding`, { method: "POST", body: form });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.detail || "Could not save branding settings");
      setProject(payload.project);
      addToast({ type: "success", title: "Branding saved", message: "Render the reel again to apply the changes." });
    } catch (error) {
      addToast({ type: "error", title: "Settings not saved", message: error instanceof Error ? error.message : "Could not save branding settings" });
    } finally {
      setSavingBranding(false);
    }
  };

  const renderReel = async () => {
    if (!projectId) return;
    setRendering(true);
    try {
      const response = await fetch(`/projects/${encodeURIComponent(projectId)}/render-reel`, { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.detail || "Could not render reel");
      setProject(payload.project);
      addToast({ type: "success", title: "Reel ready", message: "Your 9:16 video is ready to preview and download." });
    } catch (error) {
      addToast({ type: "error", title: "Render failed", message: error instanceof Error ? error.message : "Could not render reel" });
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Export</h1>
        <p className="mt-1 text-sm text-zinc-500">Create one local vertical reel from your cut clips.</p>
      </div>

      {outputReady ? (
        <div className="card overflow-hidden p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 size={21} /></div>
            <div><h2 className="text-xl font-bold text-slate-900">Your reel is ready</h2><p className="text-sm text-slate-500">1080 × 1920 · MP4 · stored locally</p></div>
          </div>
          <video controls className="mx-auto aspect-[9/16] max-h-[560px] rounded-2xl bg-black" src={`/projects/${encodeURIComponent(projectId || "")}/download`} />
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a href={`/projects/${encodeURIComponent(projectId || "")}/download`} download="reel.mp4" className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"><Download size={16} /> Download reel</a>
            <Button variant="secondary" onClick={renderReel}><Sparkles size={16} className="mr-2" /> Render again</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="card p-6">
            <div className="mb-5 flex items-center gap-3"><Sparkles className="text-violet-600" /><div><h2 className="text-lg font-bold text-slate-900">Branding settings</h2><p className="text-sm text-slate-500">These values are saved in the local project and used on the next render.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Channel name<input value={channel} onChange={(event) => setChannel(event.target.value)} className="input-field mt-2" /></label>
              <label className="text-sm font-semibold text-slate-700">Subscribe text<input value={outroText} onChange={(event) => setOutroText(event.target.value)} className="input-field mt-2" /></label>
              <label className="text-sm font-semibold text-slate-700">Hook duration (seconds)<input type="number" min="0.5" max="10" step="0.5" value={hookDuration} onChange={(event) => setHookDuration(event.target.value)} className="input-field mt-2" /></label>
              <label className="text-sm font-semibold text-slate-700">Outro duration (seconds)<input type="number" min="0.5" max="10" step="0.5" value={outroDuration} onChange={(event) => setOutroDuration(event.target.value)} className="input-field mt-2" /></label>
            </div>
            <Button variant="secondary" size="sm" className="mt-5" onClick={saveBranding} disabled={savingBranding}>{savingBranding ? "Saving…" : "Save branding"}</Button>
          </div>
          <div className="card p-6">
            <div className="mb-5 flex items-center gap-3"><Film className="text-violet-600" /><div><h2 className="text-lg font-bold text-slate-900">Final reel recipe</h2><p className="text-sm text-slate-500">The renderer will create this sequence locally.</p></div></div>
            <div className="space-y-3 text-sm">
              {["First frame of the first clip with hook text", `${clips.length} normalized clips in 9:16 format`, "Subscribe outro card", "One final reel.mp4 output"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{index + 1}</span><span className="text-slate-700">{item}</span></div>)}
            </div>
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-bold text-slate-900">Ready to render?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Make sure every clip you want is cut before rendering. The final file will be saved inside the project folder.</p>
            <div className="my-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"><span className="text-slate-500">Cut clips</span><strong className="text-slate-900">{clips.length}</strong></div>
            <Button onClick={renderReel} disabled={rendering || clips.length === 0} variant="green" size="lg" className="w-full"><Play size={16} className="mr-2" />{rendering ? "Rendering reel…" : "Render final reel"}</Button>
            {clips.length === 0 && <p className="mt-3 text-center text-xs text-amber-600">Cut at least one imported clip first.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
