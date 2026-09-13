import type { Clip } from "../../types";
import { Play, Check, Clock, Trash2 } from "lucide-react";

interface ClipCardProps {
  clip: Clip;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onInclude: () => void;
  onDelete?: () => void;
}

export function ClipCard({ clip, isSelected, onSelect, onPreview, onInclude, onDelete }: ClipCardProps) {
  const formatTime = (time: string) => {
    const [h, m, s] = time.split(":").map(Number);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const duration = (() => {
    const parts = clip.start.split(":");
    const [hs, ms, ss] = parts;
    const startSec = parseInt(hs) * 3600 + parseInt(ms) * 60 + parseFloat(ss);
    const endParts = clip.end.split(":");
    const [he, me, se] = endParts;
    const endSec = parseInt(he) * 3600 + parseInt(me) * 60 + parseFloat(se);
    return `${Math.floor((endSec - startSec) / 60)}m ${Math.floor((endSec - startSec) % 60)}s`;
  })();

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 group bg-white ${
        isSelected
          ? "border-blue-500 shadow-lg shadow-blue-500/10"
          : "border-zinc-200 hover:border-zinc-300 hover:shadow-md"
      }`}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-zinc-900 relative overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
            <Play size={20} className="text-white ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-[10px] text-white font-mono">
          {duration}
        </div>
        {clip.status === "completed" && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-semibold text-zinc-900 truncate flex-1">{clip.title}</h4>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
          <span>{formatTime(clip.start)}</span>
          <span>→</span>
          <span>{formatTime(clip.end)}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            clip.status === "completed" ? "bg-green-50 text-green-600" :
            clip.status === "cut" ? "bg-orange-50 text-orange-600" :
            "bg-zinc-100 text-zinc-500"
          }`}>
            {clip.status}
          </span>
          {clip.include_in_stitch !== false && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">in stitch</span>
          )}
        </div>
      </div>
    </div>
  );
}
