import { Routes, Route, Navigate } from "react-router-dom";
import { useCallback } from "react";
import { TopToolbar } from "./components/layout/TopToolbar";
import { Sidebar } from "./components/layout/Sidebar";
import { CreateProject } from "./pages/CreateProject";
import { ProjectHome } from "./pages/ProjectHome";
import { Scenes } from "./pages/Scenes";
import { Clips } from "./pages/Clips";
import { Stitch } from "./pages/Stitch";
import { Export } from "./pages/Export";
import { MasterJSON } from "./pages/MasterJSON";
import { Inspector } from "./components/layout/Inspector";
import { useProjectStore } from "./stores/projectStore";
import { ToastContainer } from "./components/ui/Toast";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import type { Clip } from "./types";

function ProjectLayout() {
  const { selectedClipId, setSelectedClip } = useProjectStore();

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<ProjectHome />} />
          <Route path="/scenes" element={<Scenes />} />
          <Route path="/clips" element={<Clips />} />
          <Route path="/stitch" element={<Stitch />} />
          <Route path="/export" element={<Export />} />
          <Route path="/json" element={<MasterJSON />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Inspector */}
      {selectedClipId && (
        <Inspector title="Inspector" onClose={() => setSelectedClip(null)}>
          <div className="space-y-4">
            <div className="p-3 bg-zinc-50 rounded-xl">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Clip</label>
              <p className="text-sm text-zinc-900 mt-1">{selectedClipId}</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Status</label>
              <span className="text-sm text-zinc-900 mt-1 inline-block">Selected</span>
            </div>
          </div>
        </Inspector>
      )}
    </div>
  );
}

export default function App() {
  const {
    projectId,
    project,
    selectedClipId,
    setSelectedClip,
    setSidebarSection,
    processing,
    addToast,
  } = useProjectStore();

  const handleExport = useCallback(() => {
    if (!projectId) return;
    addToast({ type: "info", title: "Export", message: "Starting export..." });
  }, [projectId, addToast]);

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
    <div className="h-screen flex flex-col bg-zinc-50 text-zinc-900 overflow-hidden">
      <TopToolbar
        projectName={project?.project.name || "CocktailClips"}
        status={processing.active ? processing.operation : "Ready"}
        processing={processing.active}
        progress={processing.progress}
        onExport={handleExport}
        onSettings={handleSettings}
        canExport={canExport}
      />

      <div className="flex flex-1 overflow-hidden">
        {projectId ? (
          <>
            <Sidebar
              activeSection={useProjectStore((s) => s.sidebarSection)}
              onSectionChange={(section) => setSidebarSection(section)}
              projectName={project?.project.name || "CocktailClips"}
              stats={{
                scenes: project?.scenes?.length || 0,
                clips: project?.clips?.length || 0,
                exports: 0,
              }}
            />
            <ProjectLayout />
          </>
        ) : (
          <CreateProject />
        )}
      </div>

      <ToastContainer
        toasts={useProjectStore((s) => s.toasts)}
        onRemove={(id) => useProjectStore.getState().removeToast(id)}
      />
    </div>
  );
}
