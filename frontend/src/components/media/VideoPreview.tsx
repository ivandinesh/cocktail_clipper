import { useRef, useEffect, useState } from "react";
import { Play, Pause, Volume2, Maximize, ChevronLeft, ChevronRight } from "lucide-react";

interface VideoPreviewProps {
  src?: string;
  duration?: string;
  currentTime?: string;
  onPlayPause?: () => void;
  onSeek?: (time: number) => void;
  isPlaying?: boolean;
}

export function VideoPreview({ src, duration, currentTime = "00:00:00", onPlayPause, onSeek, isPlaying }: VideoPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);

  return (
    <div className="relative bg-zinc-950 rounded-2xl overflow-hidden aspect-video">
      {/* Video Canvas */}
      <div className="w-full h-full flex items-center justify-center">
        {src ? (
          <video
            ref={canvasRef}
            src={src}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
              <Play size={32} className="text-white ml-1" />
            </div>
            <span className="text-zinc-500 text-sm">No video loaded</span>
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/20 rounded-full mb-3 overflow-hidden cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          setProgress(pct * 100);
          onSeek?.(pct * 100);
        }}>
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onPlayPause} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              {isPlaying ? <Pause size={14} className="text-white" /> : <Play size={14} className="text-white ml-0.5" />}
            </button>
            <div className="flex items-center gap-1 text-white/70 text-xs font-mono">
              <span>{currentTime}</span>
              <span>/</span>
              <span>{duration || "00:00:00"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <Volume2 size={12} className="text-white/70" />
            </button>
            <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <Maximize size={12} className="text-white/70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
