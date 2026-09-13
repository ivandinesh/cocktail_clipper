import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import { Timeline } from "../components/media/Timeline";
import { Button } from "../components/ui";
import { EmptyState } from "../components/ui/EmptyState";
import { Inspector } from "../components/layout/Inspector";
import { ProgressBar } from "../components/ui";

export function Stitch() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const project = useProjectStore((s) => s.project);
  const selectedClipId = useProjectStore((s) => s.selectedClipId);
  const setSelectedClip = useProjectStore((s) => s.setSelectedClip);
  const [stitching, setStitching] = useState(false);
  const [stitchProgress, setStitchProgress] = useState(0);

  const clips = project?.clips?.filter((c: any) => c.include_in_stitch !== false) || [];

  const handleStitch = async () => {
    if (!projectId) return;
    setStitching(true);
    setStitchProgress(0);

    const interval = setInterval(() => {
      setStitchProgress((prev) => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(interval);
          setStitching(false);
          return 100;
        }
        return next;
      });
    }, 300);
  };

  const totalDuration = clips.reduce((acc: number, c: any) => {
    const [hs, ms] = c.start.split(":");
    const [he, me] = c.end.split(":");
    const s = parseInt(hs) * 3600 + parseInt(ms) * 60 + parseFloat(he);
    const e = parseInt(he) * 3600 + parseInt(me) * 60 + parseFloat(me);
    return acc + (e - s);
  }, 0);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="p-8 animate-fade-in-up space-y-6 overflow-y-auto h-full">
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
        <div className="space-y-4">
          <ProcessingStatus processing={{
            active: true,
            operation: "Stitching…",
            progress: stitchProgress,
            current: Math.floor(stitchProgress / 5),
            total: clips.length,
            items: clips.map((c: any, i: number) => ({
              id: c.id,
              name: c.title,
              status: i < Math.floor(stitchProgress / 5) ? "completed" : i === Math.floor(stitchProgress / 5) ? "processing" : "waiting",
              progress: i < Math.floor(stitchProgress / 5) ? 100 : i === Math.floor(stitchProgress / 5) ? stitchProgress % 5 : 0,
            })),
          }} />
          <ProgressBar value={stitchProgress} variant="success" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-8">
        {/* Timeline */}
        <div className="col-span-2">
          <Timeline
            scenes={clips}
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
