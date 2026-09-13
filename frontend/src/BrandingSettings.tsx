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
    <div className="p-6 max-w-2xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-2xl">
            🎨
          </div>
          <div>
            <h1 className="text-3xl font-bold">Branding Settings</h1>
            <p className="text-gray-400 text-sm">Customize your channel identity and video branding</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 mb-6 space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">💡 How branding works</h3>
        <p className="text-sm text-gray-400">
          Your channel name appears on intro cards. Intro/outro durations control how long each card stays on screen.
          The outro text displays at the end of each stitched video.
        </p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Channel Name</label>
          <p className="text-xs text-gray-500 mb-2">This name appears on your intro cards and overlays</p>
          <input
            type="text"
            value={branding.channel}
            onChange={(e) => setBranding({ ...branding, channel: e.target.value })}
            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 outline-none transition-all"
            placeholder="e.g., CocktailClips"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Intro Duration (seconds)</label>
            <p className="text-xs text-gray-500 mb-2">How long the intro card shows before the clip</p>
            <input
              type="number"
              value={branding.intro_duration}
              onChange={(e) => setBranding({ ...branding, intro_duration: Number(e.target.value) })}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Outro Duration (seconds)</label>
            <p className="text-xs text-gray-500 mb-2">How long the outro card shows after the clip</p>
            <input
              type="number"
              value={branding.outro_duration}
              onChange={(e) => setBranding({ ...branding, outro_duration: Number(e.target.value) })}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Outro Text</label>
          <p className="text-xs text-gray-500 mb-2">Text displayed on the outro card (e.g., "Follow for Part 2")</p>
          <input
            type="text"
            value={branding.outro_text}
            onChange={(e) => setBranding({ ...branding, outro_text: e.target.value })}
            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 outline-none transition-all"
            placeholder="e.g., Follow for Part 2"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 rounded-lg font-semibold text-white transition-all shadow-lg shadow-purple-600/20"
        >
          {loading ? "Saving..." : saved ? "✓ Saved!" : "Save Branding"}
        </button>
      </div>
    </div>
  );
}
