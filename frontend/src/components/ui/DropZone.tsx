import type { ReactNode } from "react";

interface DropZoneProps {
  onDrop: (files: File[]) => void;
  onFileSelect: () => void;
  accept?: string;
  children?: ReactNode;
  className?: string;
  isDragging?: boolean;
}

export function DropZone({ onDrop, onFileSelect, accept = "*/*", children, className = "", isDragging = false }: DropZoneProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    onDrop(files);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
        isDragging
          ? "border-blue-500 bg-blue-50 scale-[1.02]"
          : "border-zinc-300 bg-white hover:border-blue-400 hover:bg-blue-50/50"
      } ${className}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={onFileSelect}
    >
      {children || (
        <div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-700">Drop your video here</p>
          <p className="text-xs text-zinc-400 mt-1">or click to browse files</p>
        </div>
      )}
    </div>
  );
}
