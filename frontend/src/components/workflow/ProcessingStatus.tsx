import { ProcessingState } from "../../types";
import { Loader2, Check, Circle } from "lucide-react";

interface ProcessingStatusProps {
  processing: ProcessingState;
}

export function ProcessingStatus({ processing }: ProcessingStatusProps) {
  if (!processing.active) return null;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="text-blue-600 animate-spin" />
          <span className="text-sm font-semibold text-zinc-900">{processing.operation}</span>
        </div>
        <span className="text-xs text-zinc-500">{processing.progress}%</span>
      </div>

      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${processing.progress}%` }}
        />
      </div>

      <div className="space-y-2">
        {processing.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {item.status === "completed" ? (
              <Check size={12} className="text-green-500 shrink-0" />
            ) : item.status === "processing" ? (
              <Loader2 size={12} className="text-blue-600 animate-spin shrink-0" />
            ) : (
              <Circle size={12} className="text-zinc-300 shrink-0" />
            )}
            <span className={item.status === "processing" ? "text-blue-600 font-medium" : "text-zinc-500"}>
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
