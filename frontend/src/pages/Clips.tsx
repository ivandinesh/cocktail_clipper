import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import { ClipCard } from "../components/media/ClipCard";
import { Button } from "../components/ui";
import { EmptyState } from "../components/ui/EmptyState";
import { ProcessingStatus } from "../components/workflow/ProcessingStatus";
import { ProgressBar } from "../components/ui";

export function Clips() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const project = useProjectStore((s) => s.project);
  const clips = project?.clips || [];
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [cutting, setCutting] = useState(false);
  const [cutProgress, setCutProgress] = useState(0);

  const handleCutSelected = async () => {
    if (!projectId) return;
    setCutting(true);
    setCutProgress(0);

    // Simulate cutting
    const interval = setInterval(() => {
      setCutProgress((prev) => {
        const next = prev + 10;
        if (next >= 100) {
          clearInterval(interval);
          setCutting(false);
          return 100;
        }
        return next;
      });
    }, 500);
  };

  const handleInclude = (clipId: string) => {
    // Toggle include
  };

  const handleDelete = (clipId: string) => {
    // Delete clip
  };

  return (
    <div className="p-8 animate-fade-in-up space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Clips</h1>
          <p className="text-sm text-zinc-500 mt-1">{clips.length} clip{clips.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={handleCutSelected} disabled={cutting || clips.length === 0} variant="primary" size="sm">
          {cutting ? "Cutting…" : "Cut Selected Clips"}
        </Button>
      </div>

      {/* Processing */}
      {cutting && (
        <div className="space-y-4">
          <ProcessingStatus processing={{
            active: true,
            operation: "Cutting clips",
            progress: cutProgress,
            current: Math.floor(cutProgress / 10),
            total: clips.length,
            items: clips.map((c: any, i: number) => ({
              id: c.id,
              name: c.title,
              status: i < Math.floor(cutProgress / 10) ? "completed" : i === Math.floor(cutProgress / 10) ? "processing" : "waiting",
              progress: i < Math.floor(cutProgress / 10) ? 100 : i === Math.floor(cutProgress / 10) ? cutProgress % 10 : 0,
            })),
          }} />
          <ProgressBar value={cutProgress} />
        </div>
      )}

      {/* Clip Grid */}
      {clips.length === 0 ? (
        <EmptyState
          title="No clips yet"
          description="Select scenes from the Scenes view and create your first clips."
          action={{ label: "Review Scenes", onClick: () => window.location.href = "/scenes" }}
        />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {clips.map((clip: any) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              isSelected={selectedClipId === clip.id}
              onSelect={() => setSelectedClipId(selectedClipId === clip.id ? null : clip.id)}
              onPreview={() => {}}
              onInclude={() => handleInclude(clip.id)}
              onDelete={() => handleDelete(clip.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
