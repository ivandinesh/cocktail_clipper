import { useState } from "react";
import "./index.css";
import { Dashboard } from "./Dashboard";

function App() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [view, setView] = useState<"create" | "dashboard">("create");

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectId("proj-" + Math.random().toString(36).substr(2, 9));
    setView("dashboard");
  };

  const handleRecut = (clipId: string) => {
    alert(`Recut functionality for clip ${clipId} - would navigate to recut UI`);
  };

  const handleRestitch = (clipId: string) => {
    alert(`Restitch functionality for clip ${clipId} - would restitch with branding`);
  };

  const handleEditHook = (clipId: string, hook: string) => {
    const newHook = prompt("Enter new hook text:", hook);
    if (newHook) {
      alert(`Hook updated for clip ${clipId}`);
    }
  };

  const handleEditTitle = (clipId: string, title: string) => {
    const newTitle = prompt("Enter new title:", title);
    if (newTitle) {
      alert(`Title updated for clip ${clipId}`);
    }
  };

  const handleEditTranscript = (clipId: string, transcript: string) => {
    const newTranscript = prompt("Enter new transcript:", transcript);
    if (newTranscript) {
      alert(`Transcript updated for clip ${clipId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">CocktailClips</h1>
            <nav>
              {view === "create" ? (
                <>
                  <span className="text-gray-400">Welcome</span>
                  <span className="ml-2 text-blue-400 font-medium">{projectName || "Guest"}</span>
                </>
              ) : (
                <>
                  <span className="text-gray-400">Project:</span>
                  <span className="ml-2 font-medium text-blue-400">{projectName || "—"}</span>
                  <button
                    onClick={() => setView("create")}
                    className="ml-4 text-sm text-blue-400 hover underline"
                  >
                    New Project
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {view === "create" && (
          <section className="max-w-2xl mb-8">
            <h2 className="text-2xl font-bold mb-4">Create New Project</h2>

            <form
              onSubmit={handleCreateProject}
              className="space-y-4"
              onKeyPress={(e) => e.key === "Enter" && handleCreateProject}
            >
              <div>
                <label className="block text-white mb-2">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Episode 12 - AI Podcast"
                  required
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded border"
                />
              </div>

              <div>
                <label className="block text-white mb-2">Upload MP4 Video</label>
                <input
                  type="file"
                  accept=".mp4"
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded border hidden"
                  id="videoFile"
                />
                <button
                  type="button"
                  className="w-full py-2 px-4 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm mb-2"
                  onClick={() => document.getElementById("videoFile")?.click()}
                >
                  Browse MP4
                </button>
                {projectName && (
                  <p className="text-green-400 mt-1">Project name ready: {projectName}</p>
                )}
              </div>

              <div>
                <label className="block text-white mb-2">Upload SRT Subtitles</label>
                <input
                  type="file"
                  accept=".srt"
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded border hidden"
                  id="srtFile"
                />
                <button
                  type="button"
                  className="w-full py-2 px-4 rounded bg-blue-600 hover:bg-blue-500 text-sm mb-2"
                  onClick={() => document.getElementById("srtFile")?.click()}
                >
                  Browse SRT
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded bg-blue-600 hover:bg-blue-500 text-white"
              >
                Create Project
              </button>
            </form>
          </section>
        )}

        {view === "dashboard" && (
          <Dashboard
            projectId={projectId}
            projectName={projectName}
            onBackToCreate={() => setView("create")}
            onProjectIdChange={(id) => {
              setProjectId(id);
              if (!id) setView("create");
            }}
            onProjectNameChange={setProjectName}
            onRecut={handleRecut}
            onRestitch={handleRestitch}
            onEditHook={handleEditHook}
            onEditTitle={handleEditTitle}
            onEditTranscript={handleEditTranscript}
          />
        )}
      </main>
    </div>
  );
}

export default App;
