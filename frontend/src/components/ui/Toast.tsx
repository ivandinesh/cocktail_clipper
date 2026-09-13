import { ReactNode } from "react";
import { X } from "lucide-react";

interface ToastProps {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  onClose: () => void;
}

const icons = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

const colors = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

export function Toast({ type, title, message, onClose }: ToastProps) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm ${colors[type]} animate-slide-in`}>
      <span className="text-sm font-bold">{icons[type]}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {message && <p className="text-xs opacity-75 mt-0.5">{message}</p>}
      </div>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; type: string; title: string; message?: string }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2">
      {toasts.map((t) => (
        <Toast key={t.id} type={t.type as any} title={t.title} message={t.message} onClose={() => onRemove(t.id)} />
      ))}
    </div>
  );
}
