import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import type { Project } from "../types";
import { JSONEditor } from "../components/workflow/JSONEditor";
import { Button } from "../components/ui";

export function MasterJSON() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);

  const [jsonText, setJsonText] = useState(
    project ? JSON.stringify(project, null, 2) : "{}"
  );

  const handleSave = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      setProject(parsed);
    } catch {}
  };

  return (
    <div className="p-0 animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Master JSON</h1>
          <p className="text-sm text-zinc-500 mt-1">The single source of truth for your project</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => {
            setJsonText(JSON.stringify(project, null, 2));
          }}>Refresh</Button>
          <Button variant="primary" size="sm" onClick={() => handleSave(jsonText)}>Save</Button>
        </div>
      </div>

      <div className="card p-6">
        <JSONEditor project={project || { project: { id: "", name: "" }, source: { video: "", subtitle: "" }, branding: { intro_duration: 0, outro_duration: 0, opening_image: null, closing_image: null }, clips: [] }} onSave={handleSave} />
      </div>
    </div>
  );
}
