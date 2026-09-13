import { Scene } from "../../types";
import { Clock } from "lucide-react";

interface TimelineProps {
  scenes: Scene[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function Timeline({ scenes, selectedIndex, onSelect, onReorder }: TimelineProps) {
  const formatTime = (time: string) => {
    const [h, m, s] = time.split(":").map(Number);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getProgress = (scene: Scene) => {
    const start = parseInt(scene.start.split(":")[0]) * 3600 + parseInt(scene.start.split(":")[1]) * 60 + parseFloat(scene.start.split(":")[2]);
    const end = parseInt(scene.end.split(":")[0]) * 3600 + parseInt(scene.end.split(":")[1]) * 60 + parseFloat(scene.end.split(":")[2]);
    return end - start;
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-900">Timeline</h3>
        <span className="text-xs text-zinc-400">{scenes.length} scenes</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {scenes.map((scene, i) => (
          <div
            key={scene.id}
            onClick={() => onSelect(i)}
            className={`min-w-[140px] rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 shrink-0 ${
              selectedIndex === i
                ? "border-blue-500 shadow-md shadow-blue-500/10"
                : "border-zinc-200 hover:border-zinc-300"
            }`}
          >
            <div className="aspect-video bg-zinc-900 relative">
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs text-zinc-500 font-mono">{i + 1}</span>
              </div>
              <div className="absolute bottom-1 left-1 right-1">
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${getProgress(scene)}s` }} />
                </div>
              </div>
            </div>
            <div className="p-2">
              <p className="text-[10px] font-semibold text-zinc-700 truncate">{scene.title}</p>
              <p className="text-[9px] text-zinc-400 font-mono">{formatTime(scene.start)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
