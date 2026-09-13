import type { ReactNode } from "react";
import { LayoutDashboard, FolderOpen, Film, Scissors, Layers, Download, Settings, ChevronDown } from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  projectName: string;
  stats?: {
    scenes?: number;
    clips?: number;
    exports?: number;
  };
}

const sections = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "sources", label: "Sources", icon: FolderOpen },
  { id: "scenes", label: "Scenes", icon: Film },
  { id: "clips", label: "Clips", icon: Scissors },
  { id: "stitch", label: "Stitch", icon: Layers },
  { id: "exports", label: "Exports", icon: Download },
];

export function Sidebar({ activeSection, onSectionChange, projectName, stats }: SidebarProps) {
  return (
    <aside className="w-56 bg-white/80 backdrop-blur-xl border-r border-zinc-200/60 flex flex-col h-full">
      {/* Project Name */}
      <div className="px-4 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            ◆
          </div>
          <span className="text-sm font-semibold text-zinc-900 truncate">{projectName}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <ChevronDown size={12} />
          <span>Project</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        <p className="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">PROJECT</p>
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSectionChange(id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
              activeSection === id
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            <Icon size={16} />
            {label}
            {stats && stats[id as keyof typeof stats] !== undefined && (
              <span className="ml-auto text-xs text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">
                {stats[id as keyof typeof stats]}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Files Section */}
      <div className="border-t border-zinc-100 py-3 px-2">
        <p className="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">FILES</p>
        <div className="space-y-0.5 px-2">
          {[
            { name: "source.mp4", icon: "🎬" },
            { name: "source.srt", icon: "📝" },
            { name: "project.json", icon: "📄" },
          ].map((file) => (
            <button
              key={file.name}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-all"
            >
              <span>{file.icon}</span>
              <span className="truncate">{file.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="border-t border-zinc-100 py-3 px-2">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-all">
          <Settings size={16} />
          Settings
        </button>
      </div>
    </aside>
  );
}
