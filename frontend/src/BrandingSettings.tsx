import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

interface Branding {
  channel: string;
  intro_duration: number;
  outro_duration: number;
  outro_text: string;
}

export default function BrandingSettings() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [branding, setBranding] = useState<Branding>({
    channel: "CocktailClips",
    intro_duration: 2,
    outro_duration: 2,
    outro_text: "Follow for Part 2",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetch(`http://localhost:8000/projects/${projectId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.branding) setBranding(data.branding);
        })
        .catch(() => {});
    }
  }, [projectId]);

  const handleSave = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branding }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Branding Settings</h1>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Channel Name</label>
          <input
            type="text"
            value={branding.channel}
            onChange={(e) => setBranding({ ...branding, channel: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Intro Duration (s)</label>
            <input
              type="number"
              value={branding.intro_duration}
              onChange={(e) => setBranding({ ...branding, intro_duration: Number(e.target.value) })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Outro Duration (s)</label>
            <input
              type="number"
              value={branding.outro_duration}
              onChange={(e) => setBranding({ ...branding, outro_duration: Number(e.target.value) })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Outro Text</label>
          <input
            type="text"
            value={branding.outro_text}
            onChange={(e) => setBranding({ ...branding, outro_text: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-medium text-white transition-colors"
        >
          {loading ? "Saving..." : saved ? "✓ Saved!" : "Save Branding"}
        </button>
      </div>
    </div>
  );
}
