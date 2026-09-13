
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { TopToolbar } from "./components/layout/TopToolbar";
import { WorkspaceRail } from "./components/layout/WorkspaceRail";
import { WorkflowRail } from "./components/layout/WorkflowRail";

import { LandingPage } from "./pages/LandingPage";
import { WorkflowPage } from "./pages/WorkflowPage";



import { useProjectStore } from "./stores/projectStore";
import { ToastContainer } from "./components/ui/Toast";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import type { Clip } from "./types";

function ProjectLayout() {
  return <WorkflowPage />;
}

export default function App() {
  const [searchParams] = useSearchParams();
  const storedProjectId = useProjectStore((s) => s.projectId);
  const projectId = searchParams.get("projectId") || storedProjectId;
  const {
    project,
    processing,
    addToast,
  } = useProjectStore();

  const handleExport = useCallback(() => {
    if (!projectId) return;
    document.getElementById("export")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [projectId]);

  const handleSettings = useCallback(() => {
    addToast({ type: "info", title: "Settings", message: "Settings panel coming soon" });
  }, [addToast]);

  const canExport = Boolean(project && project.clips.some((c: Clip) => c.status === "completed"));

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: " ", action: () => { /* Play/Pause will be handled by VideoPreview */ } },
    { key: "?", action: () => addToast({ type: "info", title: "Keyboard Shortcuts", message: "Space: Play/Pause | ←→: Seek | I/O: In/Out | Cmd+S: Save | Cmd+E: Export" }) },
  ], !!projectId);

  return (
    <div className="h-screen flex flex-col bg-modern text-slate-900 overflow-hidden relative">
      <TopToolbar
        projectName={project?.project.name || "CocktailClips"}
        status={processing.active ? processing.operation : "Ready"}
        processing={processing.active}
        progress={processing.progress}
        onExport={handleExport}
        onSettings={handleSettings}
        canExport={canExport}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <WorkflowRail projectActive={Boolean(projectId)} />
        <div className="min-w-0 flex-1 overflow-hidden">{projectId ? <ProjectLayout /> : <LandingPage />}</div>
        <WorkspaceRail />
      </div>
      <ToastContainer
        toasts={useProjectStore((s) => s.toasts)}
        onRemove={(id) => useProjectStore.getState().removeToast(id)}
      />
    </div>
  );
}
