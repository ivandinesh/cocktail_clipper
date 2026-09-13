import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import type { Clip } from "../types";
import { ClipCard } from "../components/media/ClipCard";
import { Button } from "../components/ui";
import { EmptyState } from "../components/ui/EmptyState";


export function Clips() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);
  const setProcessing = useProjectStore((s) => s.setProcessing);
  const addToast = useProjectStore((s) => s.addToast);
  const clips: Clip[] = project?.clips || [];
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [cutting, setCutting] = useState(false);
  const [renderingSelected, setRenderingSelected] = useState(false);
  const [recutting, setRecutting] = useState(false);
  const selectedClip = clips.find((clip) => clip.id === selectedClipId) || null;
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (!selectedClip) return;
    setEditStart(selectedClip.start);
    setEditEnd(selectedClip.end);
    setEditTitle(selectedClip.title);
  }, [selectedClip]);


  const handleCutSelected = async () => {
    if (!projectId || clips.length === 0) return;
    setCutting(true);

    setProcessing({ active: true, operation: "Cutting clips…", progress: 0, current: 0, total: clips.length, items: [] });

    try {
      const response = await fetch(`/projects/${encodeURIComponent(projectId)}/cut-all`, { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.detail || "Could not cut clips");
      setProject(payload.project);

      setProcessing({ active: false, operation: "", progress: 100, current: payload.completed, total: payload.total, items: [] });
      addToast({ type: payload.failed ? "warning" : "success", title: payload.failed ? "Cutting partially complete" : "Clips ready", message: `${payload.completed} of ${payload.total} clips cut${payload.failed ? `, ${payload.failed} failed` : ""}.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not cut clips";
      setProcessing({ active: false, operation: "", progress: 0, current: 0, total: clips.length, items: [] });
      addToast({ type: "error", title: "Cutting failed", message });
    } finally {
      setCutting(false);
    }
  };

  const toggleSelectedClip = (clipId: string) => {
    setSelectedClipIds((current) => current.includes(clipId) ? current.filter((id) => id !== clipId) : [...current, clipId]);
  };

  const renderSelectedClips = async () => {
    if (!projectId || selectedClipIds.length === 0) return;
    setRenderingSelected(true);
    try {
      const response = await fetch(`/projects/${encodeURIComponent(projectId)}/render-clips`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clip_ids: selectedClipIds }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.detail || "Could not render selected clips");
      setProject(payload.project);
      setSelectedClipIds([]);
      addToast({ type: payload.errors?.length ? "warning" : "success", title: payload.errors?.length ? "Some clips failed" : "Clips rendered", message: `${payload.rendered?.length || 0} individual clip video(s) are ready to download.` });
    } catch (error) {
      addToast({ type: "error", title: "Individual render failed", message: error instanceof Error ? error.message : "Could not render selected clips" });
    } finally {
      setRenderingSelected(false);
    }
  };

  const handleRecut = async () => {
    if (!projectId || !selectedClip) return;
    setRecutting(true);
    try {
      const form = new FormData();
      form.append("start_time", editStart);
      form.append("end_time", editEnd);
      form.append("clip_title", editTitle);
      const response = await fetch(`/projects/${encodeURIComponent(projectId)}/clip/${encodeURIComponent(selectedClip.id)}/recut`, { method: "POST", body: form });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.detail || "Could not recut clip");
      const refreshed = await fetch(`/projects/${encodeURIComponent(projectId)}`);
      if (!refreshed.ok) throw new Error("Clip recut, but the project could not be refreshed.");
      setProject(await refreshed.json());
      addToast({ type: "success", title: "Clip recut", message: "The updated clip is ready for preview." });
    } catch (error) {
      addToast({ type: "error", title: "Recut failed", message: error instanceof Error ? error.message : "Could not recut clip" });
    } finally {
      setRecutting(false);
    }
  };

  const handleInclude = (clipId: string) => {
    if (!project) return;
    setProject({ ...project, clips: project.clips.map((clip) => clip.id === clipId ? { ...clip, include_in_stitch: clip.include_in_stitch === false } : clip) });
  };

  const handleDelete = (clipId: string) => {
    if (!project) return;
    setProject({ ...project, clips: project.clips.filter((clip) => clip.id !== clipId) });
  };

  return (
    <div className="p-0 animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Clips</h1>
          <p className="text-sm text-zinc-500 mt-1">{clips.length} clip{clips.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={handleCutSelected} disabled={cutting || clips.length === 0} variant="primary" size="sm">
          {cutting ? "Cutting…" : "Cut imported clips"}
        </Button>
      </div>

      {/* Processing */}
      {cutting && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm font-semibold text-violet-700">
          Cutting {clips.length} imported clips with FFmpeg…
        </div>
      )}

      {selectedClip && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div><p className="text-xs font-bold uppercase tracking-wider text-violet-600">Edit selected clip</p><p className="mt-1 text-sm font-semibold text-slate-800">{selectedClip.id} · change the range and recut from the source</p></div>
            <button onClick={() => setSelectedClipId(null)} className="text-xs font-semibold text-slate-500 hover:text-slate-900">Close</button>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]">
            <input value={editStart} onChange={(event) => setEditStart(event.target.value)} className="input-field font-mono text-xs" aria-label="Clip start time" />
            <input value={editEnd} onChange={(event) => setEditEnd(event.target.value)} className="input-field font-mono text-xs" aria-label="Clip end time" />
            <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="input-field text-sm" aria-label="Clip title" />
            <Button size="sm" onClick={handleRecut} disabled={recutting}>{recutting ? "Recutting…" : "Recut clip"}</Button>
          </div>
        </div>
      )}

      {selectedClipIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4">
          <div><p className="text-sm font-bold text-violet-900">{selectedClipIds.length} clip{selectedClipIds.length === 1 ? "" : "s"} selected</p><p className="text-xs text-violet-700">Render these separately with their own hook and subscribe outro.</p></div>
          <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setSelectedClipIds([])}>Clear</Button><Button size="sm" onClick={renderSelectedClips} disabled={renderingSelected}>{renderingSelected ? "Rendering…" : "Render selected clips"}</Button></div>
        </div>
      )}

      {/* Clip Grid */}
      {clips.length === 0 ? (
        <EmptyState
          title="No clips yet"
          description="Import and validate an AI scene plan above before cutting your first clips."
          action={{ label: "Import AI plan", onClick: () => document.getElementById("plan")?.scrollIntoView({ behavior: "smooth" }) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {clips.map((clip: Clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              isSelected={selectedClipIds.includes(clip.id)}
              onSelect={() => toggleSelectedClip(clip.id)}
              previewUrl={projectId ? `/projects/${encodeURIComponent(projectId)}/clips/${encodeURIComponent(clip.id)}/preview` : undefined}
              onEdit={() => setSelectedClipId(clip.id)}
              downloadUrl={projectId ? `/projects/${encodeURIComponent(projectId)}/clips/${encodeURIComponent(clip.id)}/download` : undefined}
              onPreview={() => {
                if (clip.clip_file) window.open(`/projects/${encodeURIComponent(projectId || "")}/clips/${encodeURIComponent(clip.id)}/preview`, "_blank", "noopener,noreferrer");
              }}
              onInclude={() => handleInclude(clip.id)}
              onDelete={() => handleDelete(clip.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
