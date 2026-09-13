import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import type { Clip } from "../types";
import { Timeline } from "../components/media/Timeline";
import { Button } from "../components/ui";
import { EmptyState } from "../components/ui/EmptyState";
import { ProgressBar } from "../components/ui";
import { ProcessingStatus } from "../components/workflow/ProcessingStatus";

export function Export() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const project = useProjectStore((s) => s.project);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);

  const clips: Clip[] = project?.clips?.filter((c: Clip) => c.status === "completed") || [];

  const handleExport = async () => {
    if (!projectId) return;
    setExporting(true);
    setExportProgress(0);
    setExportComplete(false);

    const interval = setInterval(() => {
      setExportProgress((prev) => {
        const next = prev + 3;
        if (next >= 100) {
          clearInterval(interval);
          setExporting(false);
          setExportComplete(true);
          return 100;
        }
        return next;
      });
    }, 200);
  };

  return (
    <div className="p-8 animate-fade-in-up space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Export</h1>
          <p className="text-sm text-zinc-500 mt-1">Render your final video</p>
        </div>
      </div>

      {exportComplete ? (
        <div className="card p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Export Complete</h2>
          <p className="text-sm text-zinc-500 mb-6">Your final video is ready</p>
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-zinc-50 rounded-xl mb-6">
            <span className="text-sm font-medium text-zinc-900">final-video.mp4</span>
            <span className="text-xs text-zinc-400">03:42 • 1080p • 142 MB</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary">Reveal in Folder</Button>
            <Button variant="secondary">Play</Button>
            <Button variant="primary" onClick={() => { setExportComplete(false); setExportProgress(0); }}>New Export</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-8">
          {/* Settings */}
          <div className="col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Export Settings</h2>
              <div className="space-y-4">
                {["Filename", "Resolution", "Aspect Ratio", "Captions", "Hook", "End Hook"].map((label) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600">{label}</span>
                    <span className="text-sm font-medium text-zinc-900">Original</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Estimated Duration</h2>
              <p className="text-3xl font-bold text-zinc-900">03:42</p>
            </div>
          </div>

          {/* Export Button */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Ready to Export</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Clips</span>
                  <span className="font-medium text-zinc-900">{clips.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Captions</span>
                  <span className="font-medium text-zinc-900">On</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Hook</span>
                  <span className="font-medium text-zinc-900">On</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">End Hook</span>
                  <span className="font-medium text-zinc-900">On</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={exporting || clips.length === 0}
              className="w-full"
              size="lg"
              variant="green"
            >
              {exporting ? "Exporting…" : "Export Video"}
            </Button>
          </div>
        </div>
      )}

      {/* Progress */}
      {exporting && (
        <div className="space-y-4">
          <ProcessingStatus processing={{
            active: true,
            operation: "Rendering final video",
            progress: exportProgress,
            current: Math.floor(exportProgress / 10),
            total: 10,
            items: [
              { id: "render", name: "Rendering", status: exportProgress < 70 ? "processing" : "completed", progress: Math.min(100, exportProgress) },
              { id: "captions", name: "Adding captions…", status: exportProgress >= 70 ? "processing" : "waiting", progress: Math.max(0, exportProgress - 70) },
            ],
          }} />
          <ProgressBar value={exportProgress} variant="success" />
          <p className="text-xs text-zinc-400 text-center">{exportProgress}%</p>
        </div>
      )}
    </div>
  );
}
