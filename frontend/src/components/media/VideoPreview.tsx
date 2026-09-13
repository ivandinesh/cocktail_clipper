import { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, Volume2, Maximize, ChevronLeft, ChevronRight } from "lucide-react";

interface VideoPreviewProps {
  src?: string;
  duration?: string;
  currentTime?: string;
  onPlayPause?: () => void;
  onSeek?: (time: number) => void;
  isPlaying?: boolean;
  startTime?: number;
  endTime?: number;
  className?: string;
}

export function VideoPreview({ src, duration, currentTime = "00:00:00", onPlayPause, onSeek, isPlaying, startTime, endTime, className = "" }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isLocalPlaying, setIsLocalPlaying] = useState(false);
  const [actualCurrentTime, setActualCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const handleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleFullscreen = () => {
    if (frameRef.current?.requestFullscreen) void frameRef.current.requestFullscreen();
  };

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsLocalPlaying(true);
      } else {
        videoRef.current.pause();
        setIsLocalPlaying(false);
      }
      onPlayPause?.();
    }
  }, [onPlayPause]);

  const handleSeek = useCallback((e: React.MouseEvent) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const time = pct * (videoRef.current.duration || 0);
    videoRef.current.currentTime = time;
    setProgress(pct * 100);
    onSeek?.(pct * 100);
  }, [onSeek]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
      if (endTime !== undefined && videoRef.current.currentTime >= endTime) {
        videoRef.current.pause();
        videoRef.current.currentTime = startTime ?? 0;
        setIsLocalPlaying(false);
      }
      setActualCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  }, [endTime, startTime]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
      setActualDuration(videoRef.current.duration);
      if (startTime !== undefined) {
        videoRef.current.currentTime = startTime;
        setActualCurrentTime(startTime);
      }
    }
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(safeSeconds / 3600)).padStart(2, "0")}:${String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (videoRef.current && startTime !== undefined && Number.isFinite(videoRef.current.duration)) {
      videoRef.current.currentTime = startTime;
      setActualCurrentTime(startTime);
    }
  }, [startTime, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener("timeupdate", handleTimeUpdate);
      return () => video.removeEventListener("timeupdate", handleTimeUpdate);
    }
  }, [handleTimeUpdate]);

  // Sync isPlaying prop with video element
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else if (!isPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  return (
    <div ref={frameRef} className={`video-preview-frame relative mx-auto overflow-hidden rounded-2xl bg-zinc-950 ${className}`}>
      {/* Video Canvas */}
      <div className="w-full h-full flex items-center justify-center">
        {src ? (
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-contain"
            onClick={handlePlayPause}
            onLoadedMetadata={handleLoadedMetadata}
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
        <div className="w-full h-1 bg-white/20 rounded-full mb-3 overflow-hidden cursor-pointer" onClick={handleSeek}>
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handlePlayPause} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              {isLocalPlaying ? <Pause size={14} className="text-white" /> : <Play size={14} className="text-white ml-0.5" />}
            </button>
            <div className="flex items-center gap-1 text-white/70 text-xs font-mono">
              <span>{actualDuration !== null ? formatTime(actualCurrentTime) : currentTime}</span>
              <span>/</span>
              <span>{actualDuration !== null ? formatTime(actualDuration) : duration || "00:00:00"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleMute} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20" aria-label={isMuted ? "Unmute video" : "Mute video"}>
              <Volume2 size={12} className={isMuted ? "text-white/40" : "text-white/70"} />
            </button>
            <button onClick={handleFullscreen} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20" aria-label="Fullscreen preview">
              <Maximize size={12} className="text-white/70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
