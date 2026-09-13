import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "./index.css";

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
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="hero-icon" style={{ width: 80, height: 80, fontSize: 36 }}>🎨</div>
        <h1 className="text-4xl font-bold mb-2 tracking-tight">Branding Settings</h1>
        <p className="text-zinc-500 text-lg">Customize your channel identity and video branding</p>
      </div>

      {/* How it works */}
      <div className="page-card mb-8">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">💡 How branding works</h3>
        <div className="space-y-3">
          <div className="step-card">
            <div className="step-number bg-blue-600/20 text-blue-400">1</div>
            <div className="text-sm text-zinc-400">Channel name appears on intro cards and overlays</div>
          </div>
          <div className="step-card">
            <div className="step-number bg-purple-600/20 text-purple-400">2</div>
            <div className="text-sm text-zinc-400">Intro/outro durations control card display time</div>
          </div>
          <div className="step-card">
            <div className="step-number bg-green-600/20 text-green-400">3</div>
            <div className="text-sm text-zinc-400">Outro text displays at the end of each stitched video</div>
          </div>
        </div>
      </div>

      <div className="page-card space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Channel Name</label>
          <p className="text-xs text-zinc-600 mb-3">Appears on intro cards and video overlays</p>
          <input
            type="text"
            value={branding.channel}
            onChange={(e) => setBranding({ ...branding, channel: e.target.value })}
            className="input-field"
            placeholder="e.g., CocktailClips"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Intro Duration (s)</label>
            <p className="text-xs text-zinc-600 mb-3">How long the intro card shows</p>
            <input
              type="number"
              value={branding.intro_duration}
              onChange={(e) => setBranding({ ...branding, intro_duration: Number(e.target.value) })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Outro Duration (s)</label>
            <p className="text-xs text-zinc-600 mb-3">How long the outro card shows</p>
            <input
              type="number"
              value={branding.outro_duration}
              onChange={(e) => setBranding({ ...branding, outro_duration: Number(e.target.value) })}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Outro Text</label>
          <p className="text-xs text-zinc-600 mb-3">Displayed on the outro card</p>
          <input
            type="text"
            value={branding.outro_text}
            onChange={(e) => setBranding({ ...branding, outro_text: e.target.value })}
            className="input-field"
            placeholder="e.g., Follow for Part 2"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-purple w-full"
        >
          {loading ? "Saving..." : saved ? "✓ Saved!" : "Save Branding"}
        </button>
      </div>
    </div>
  );
}
