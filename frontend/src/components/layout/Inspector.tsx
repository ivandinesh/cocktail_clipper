import { ReactNode } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface InspectorProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  collapsible?: boolean;
}

export function Inspector({ title, children, onClose, collapsible = true }: InspectorProps) {
  return (
    <aside className="w-72 bg-white/80 backdrop-blur-xl border-l border-zinc-200/60 flex flex-col h-full shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 flex-1">
        {children}
      </div>
    </aside>
  );
}

interface InspectorFieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

export function InspectorField({ label, children, hint }: InspectorFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-zinc-400">{hint}</p>}
    </div>
  );
}
