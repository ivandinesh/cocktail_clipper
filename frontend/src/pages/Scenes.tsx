import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import type { Scene } from "../types";
import { SceneCard } from "../components/media/SceneCard";
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

  const handlePreview = (_scene: Scene) => {
    // Preview scene
  };

  return (
    <div className="p-8 animate-fade-in-up space-y-6 overflow-y-auto h-full">
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
          <Button onClick={handleAnalyze} disabled={analyzing} variant="primary" size="sm">
            {analyzing ? "Analyzing…" : "Analyze Video"}
          </Button>
        </div>
      </div>

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
          description="Analyze your video or transcript to detect scenes. Each scene will be shown as a visual card."
          action={{ label: "Analyze Video", onClick: handleAnalyze }}
        />
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-3 gap-4" : "space-y-3"}>
          {scenes.map((scene: Scene, i: number) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              isSelected={selectedSceneIndex === i}
              onSelect={() => handleSelectScene(i)}
              onPreview={() => handlePreview(scene)}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
