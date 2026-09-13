import type { ReactNode } from "react";
import { Settings, ChevronDown } from "lucide-react";

interface TopToolbarProps {
  projectName: string;
  status: string;
  processing: boolean;
  progress: number;
  onExport: () => void;
  onSettings: () => void;
  canExport: boolean;
}

export function TopToolbar({ projectName, status, processing, progress, onExport, onSettings, canExport }: TopToolbarProps) {
  return (
    <header className="h-12 bg-white/80 backdrop-blur-xl border-b border-zinc-200/60 flex items-center justify-between px-4 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          ◆
        </div>
        <span className="text-sm font-semibold text-zinc-900">{projectName}</span>
        <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
          <ChevronDown size={10} />
          Project
        </span>
      </div>

      {/* Center - Status */}
      <div className="flex items-center gap-2">
        {processing && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-blue-700">{status}</span>
            {progress > 0 && (
              <div className="w-20 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        )}
        {!processing && status && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-xs font-medium text-green-700">{status}</span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          disabled={!canExport}
          className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            canExport
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
              : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
          }`}
        >
          Export
        </button>
        <button onClick={onSettings} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500">
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
