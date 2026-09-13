import { AlertCircle, CheckCircle2, Info, X, CircleAlert } from "lucide-react";

interface ToastProps {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  onClose: () => void;
}

const config = {
  success: { Icon: CheckCircle2, shell: "border-emerald-200 bg-emerald-50", icon: "text-emerald-600", title: "text-emerald-950" },
  error: { Icon: CircleAlert, shell: "border-rose-200 bg-rose-50", icon: "text-rose-600", title: "text-rose-950" },
  info: { Icon: Info, shell: "border-sky-200 bg-sky-50", icon: "text-sky-600", title: "text-sky-950" },
  warning: { Icon: AlertCircle, shell: "border-amber-200 bg-amber-50", icon: "text-amber-600", title: "text-amber-950" },
};

export function Toast({ type, title, message, onClose }: ToastProps) {
  const { Icon, shell, icon, title: titleColor } = config[type];
  return (
    <div role={type === "error" ? "alert" : "status"} className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl shadow-slate-900/10 ${shell} animate-slide-in`}>
      <Icon size={18} className={`mt-0.5 shrink-0 ${icon}`} />
      <div className="min-w-0 flex-1"><p className={`text-sm font-bold ${titleColor}`}>{title}</p>{message && <p className="mt-1 break-words text-xs leading-5 text-slate-600">{message}</p>}</div>
      <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-black/5 hover:text-slate-700" aria-label="Dismiss notification"><X size={15} /></button>
    </div>
  );
}

interface ToastContainerProps { toasts: Array<{ id: string; type: string; title: string; message?: string }>; onRemove: (id: string) => void; }

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return <div aria-live="polite" className="pointer-events-none fixed bottom-16 left-1/2 z-[100] flex w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2">{toasts.map((toast) => <div key={toast.id} className="pointer-events-auto"><Toast type={toast.type as ToastProps["type"]} title={toast.title} message={toast.message} onClose={() => onRemove(toast.id)} /></div>)}</div>;
}
