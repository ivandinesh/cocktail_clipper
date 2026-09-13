import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import type { Scene } from "../types";
import { SceneCard } from "../components/media/SceneCard";
import { VideoPreview } from "../components/media/VideoPreview";
import { Button } from "../components/ui";
import { EmptyState } from "../components/ui/EmptyState";
import { DropZone } from "../components/ui/DropZone";
import { ProcessingStatus } from "../components/workflow/ProcessingStatus";
import { ProgressBar } from "../components/ui";

export function Scenes() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);
  const setSelectedScene = useProjectStore((s) => s.setSelectedScene);
  const selectedSceneIndex = useProjectStore((s) => s.selectedSceneIndex);
  const setProcessing = useProjectStore((s) => s.setProcessing);
  const resetProcessing = useProjectStore((s) => s.resetProcessing);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  const scenes: Scene[] = project?.scenes || [];
  const selectedScene = selectedSceneIndex !== null ? scenes[selectedSceneIndex] : null;
  const toSeconds = (time: string) => {
    const [hours, minutes, seconds] = time.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const handleAnalyze = async () => {
    if (!projectId) return;
    setAnalyzing(true);
    setAnalyzeProgress(0);
    setProcessing({ active: true, operation: "Analyzing transcript…", progress: 0, current: 0, total: 27, items: [] });

    // Simulate analysis progress
    const interval = setInterval(() => {
      setAnalyzeProgress((prev) => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(interval);
          setAnalyzing(false);
          setProcessing({ active: false, operation: "", progress: 100, current: 27, total: 27, items: [] });
          // Mock scenes
          const mockScenes: Scene[] = Array.from({ length: 27 }, (_, i) => ({
            id: `scene-${i + 1}`,
            index: i,
            start: `${String(Math.floor(i * 15 / 60)).padStart(2, "0")}:${String(i * 15 % 60).padStart(2, "0")}:00.000`,
            end: `${String(Math.floor((i + 1) * 15 / 60)).padStart(2, "0")}:${String((i + 1) * 15 % 60).padStart(2, "0")}:00.000`,
            title: `Scene ${i + 1}`,
            summary: "AI-generated scene description placeholder",
            importance: Math.floor(Math.random() * 40 + 60),
            tags: ["topic"],
            selected: false,
          }));
          setProject({ ...project!, scenes: mockScenes });
          return 100;
        }
        return next;
      });
    }, 200);
  };

  const handleSelectScene = (index: number) => {
    setSelectedScene(selectedSceneIndex === index ? null : index);
  };


  return (
    <div className="p-0 animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Scenes</h1>
          <p className="text-sm text-zinc-500 mt-1">{scenes.length} scenes detected</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "grid" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "list" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"
              }`}
            >
              List
            </button>
          </div>
          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">Import plan above</span>
        </div>
      </div>

      {selectedScene && projectId && (
        <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_260px]">
          <VideoPreview
            src={`/projects/${encodeURIComponent(projectId)}/source`}
            startTime={toSeconds(selectedScene.start)}
            endTime={toSeconds(selectedScene.end)}
            duration="Loading…"
          />
          <div className="flex flex-col justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Selected moment</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">{selectedScene.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{selectedScene.summary}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <div className="flex justify-between"><span>In</span><strong className="font-mono">{selectedScene.start}</strong></div>
              <div className="mt-2 flex justify-between"><span>Out</span><strong className="font-mono">{selectedScene.end}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {analyzing && (
        <div className="space-y-4">
          <ProcessingStatus processing={{
            active: true,
            operation: "Analyzing transcript…",
            progress: analyzeProgress,
            current: Math.floor(analyzeProgress / 5),
            total: 27,
            items: Array.from({ length: Math.floor(analyzeProgress / 5) }, (_, i) => ({
              id: `scene-${i + 1}`,
              name: `Scene ${i + 1}`,
              status: "completed" as const,
              progress: 100,
            })),
          }} />
          <ProgressBar value={analyzeProgress} />
          <p className="text-xs text-zinc-400 text-center">{Math.floor(analyzeProgress / 5)} of 27 segments processed</p>
        </div>
      )}

      {/* Content */}
      {scenes.length === 0 && !analyzing ? (
        <EmptyState
          title="No scenes yet"
          description="Import an AI-generated scene plan above to review timestamps and titles before cutting clips."
          action={undefined}
        />
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-3"}>
          {scenes.map((scene: Scene, i: number) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              isSelected={selectedSceneIndex === i}
              onSelect={() => handleSelectScene(i)}
              onPreview={() => handleSelectScene(i)}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
