import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import type { Clip, Scene } from "../types";
import { Timeline } from "../components/media/Timeline";
import { Button } from "../components/ui";
import { ProcessingStatus } from "../components/workflow/ProcessingStatus";
import { Inspector } from "../components/layout/Inspector";
import { ProgressBar } from "../components/ui";

export function Stitch() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);
  const addToast = useProjectStore((s) => s.addToast);
  const selectedClipId = useProjectStore((s) => s.selectedClipId);
  const setSelectedClip = useProjectStore((s) => s.setSelectedClip);
  const [stitching, setStitching] = useState(false);
  const [stitchProgress, setStitchProgress] = useState(0);

  const clips: Clip[] = project?.clips?.filter((c: Clip) => c.include_in_stitch !== false) || [];

  const handleStitch = async () => {
    if (!projectId) return;
    setStitching(true);
    setStitchProgress(0);
    try {
      const response = await fetch(`/projects/${encodeURIComponent(projectId)}/render-reel`, { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.detail || "Could not render reel");
      setProject(payload.project);
      setStitchProgress(100);
      addToast({ type: "success", title: "Reel rendered", message: "Your vertical reel is ready in the Export section." });
      document.getElementById("export")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      addToast({ type: "error", title: "Render failed", message: error instanceof Error ? error.message : "Could not render reel" });
    } finally {
      setStitching(false);
    }
  };

  const totalDuration = clips.reduce((acc: number, c: Clip) => {
    const parts = c.start.split(":");
    const [hs, ms, ss] = parts;
    const start = parseInt(hs) * 3600 + parseInt(ms) * 60 + parseFloat(ss);
    const endParts = c.end.split(":");
    const [he, me, se] = endParts;
    const end = parseInt(he) * 3600 + parseInt(me) * 60 + parseFloat(se);
    return acc + (end - start);
  }, 0);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="p-0 animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Stitch</h1>
          <p className="text-sm text-zinc-500 mt-1">{clips.length} clips in sequence</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">
            Final: <span className="font-semibold text-zinc-900">{formatDuration(totalDuration)}</span>
          </span>
          <Button onClick={handleStitch} disabled={stitching || clips.length === 0} variant="green" size="sm">
            {stitching ? "Stitching…" : "Stitch Sequence"}
          </Button>
        </div>
      </div>

      {/* Progress */}
      {stitching && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          Rendering hook, {clips.length} clips, and subscribe outro into a 9:16 reel…
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="col-span-2">
          <Timeline
            scenes={clips as unknown as Scene[]}
            selectedIndex={null}
            onSelect={(i) => {
              if (clips[i]) setSelectedClip(clips[i].id);
            }}
          />
        </div>

        {/* Inspector */}
        {selectedClipId && (
          <Inspector title="Inspector" onClose={() => setSelectedClip(null)}>
            <div className="space-y-4">
              <div className="p-3 bg-zinc-50 rounded-xl">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Clip</label>
                <p className="text-sm text-zinc-900 mt-1">{selectedClipId}</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Include in Stitch</label>
                <label className="flex items-center mt-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-zinc-700 ml-2">Include</span>
                </label>
              </div>
            </div>
          </Inspector>
        )}
      </div>
    </div>
  );
}
