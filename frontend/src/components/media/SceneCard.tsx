import type { Scene } from "../../types";
import { Play, Check, Clock } from "lucide-react";

interface SceneCardProps {
  scene: Scene;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  viewMode?: "grid" | "list";
}

export function SceneCard({ scene, isSelected, onSelect, onPreview, viewMode = "grid" }: SceneCardProps) {
  const formatTime = (time: string) => {
    const [h, m, s] = time.split(":").map(Number);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const duration = (() => {
    const parts = scene.start.split(":");
    const [hs, ms, ss] = parts;
    const startSec = parseInt(hs) * 3600 + parseInt(ms) * 60 + parseFloat(ss);
    const endParts = scene.end.split(":");
    const [he, me, se] = endParts;
    const endSec = parseInt(he) * 3600 + parseInt(me) * 60 + parseFloat(se);
    const diff = endSec - startSec;
    return `${Math.floor(diff / 60)}m ${Math.floor(diff % 60)}s`;
  })();

  if (viewMode === "list") {
    return (
      <div
        onClick={onSelect}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 ${
          isSelected
            ? "border-blue-300 bg-blue-50 shadow-sm"
            : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
        }`}
      >
        <button onClick={(e) => { e.stopPropagation(); onPreview(); }} className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors shrink-0">
          <Play size={14} className="text-zinc-600 ml-0.5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900">{scene.title}</span>
            {scene.importance && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                {scene.importance}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-zinc-400 font-mono">{formatTime(scene.start)} → {formatTime(scene.end)}</span>
            <span className="text-xs text-zinc-400 flex items-center gap-1"><Clock size={10} />{duration}</span>
          </div>
        </div>
        {isSelected && <Check size={16} className="text-blue-600 shrink-0" />}
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 group ${
        isSelected
          ? "border-blue-500 shadow-lg shadow-blue-500/10"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md"
      }`}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-zinc-900 relative overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
            <Play size={20} className="text-white ml-0.5" />
          </div>
        </div>
        {scene.importance && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-[10px] text-white font-medium">
            {scene.importance}%
          </div>
        )}
        {isSelected && (
          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Check size={16} className="text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-zinc-400">{scene.index + 1}</span>
          <span className="text-xs font-mono text-zinc-300">{formatTime(scene.start)}</span>
          <span className="text-zinc-400">→</span>
          <span className="text-xs font-mono text-zinc-300">{formatTime(scene.end)}</span>
        </div>
        <h4 className="text-sm font-semibold text-zinc-900 truncate">{scene.title}</h4>
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{scene.summary}</p>
        {scene.tags && scene.tags.length > 0 && (
          <div className="flex gap-1 mt-2">
            {scene.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded-full">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
