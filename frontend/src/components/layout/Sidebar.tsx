import { useNavigate, useSearchParams } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Film, Scissors, Download, Settings, ChevronDown } from "lucide-react";

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
  { id: "exports", label: "Exports", icon: Download },
];

export function Sidebar({ activeSection, onSectionChange, projectName, stats }: SidebarProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
    const routes: Record<string, string> = {
      overview: `/${query}`,
      sources: `/${query}`,
      scenes: `/scenes${query}`,
      clips: `/clips${query}`,
      exports: `/export${query}`,
    };
    navigate(routes[section] || `/${query}`);
  };

  return (
    <aside className="w-60 bg-white/75 backdrop-blur-xl border-r border-slate-200/80 flex flex-col h-full relative z-10">
      {/* Project Name */}
      <div className="px-4 py-5 border-b border-slate-200/80">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-500/30">
            ✦
          </div>
          <span className="text-sm font-bold text-slate-900 truncate">{projectName}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <ChevronDown size={12} />
          <span>Project</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-3">Workspace</p>
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleSectionChange(id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
              activeSection === id
                ? "bg-violet-50 text-violet-700 font-semibold shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon size={16} />
            {label}
            {stats && stats[id as keyof typeof stats] !== undefined && (
              <span className="ml-auto text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {stats[id as keyof typeof stats]}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Files Section */}
      <div className="border-t border-slate-200/80 py-4 px-2">
        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.18em] mb-2">Files</p>
        <div className="space-y-0.5 px-2">
          {[
            { name: "source.mp4", icon: "🎬" },
            { name: "source.srt", icon: "📝" },
            { name: "project.json", icon: "📄" },
          ].map((file) => (
            <button
              key={file.name}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
            >
              <span>{file.icon}</span>
              <span className="truncate">{file.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="border-t border-slate-200/80 py-4 px-2">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all">
          <Settings size={16} />
          Settings
        </button>
      </div>
    </aside>
  );
}
