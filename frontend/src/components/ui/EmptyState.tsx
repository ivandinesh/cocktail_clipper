import { ReactNode } from "react";
import { ImageOff } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
        {icon || <ImageOff size={32} className="text-zinc-400" />}
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 text-center max-w-sm mb-6">{description}</p>
      {action && (
        <button onClick={action.onClick} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
          {action.label}
        </button>
      )}
    </div>
  );
}
