export interface Project {
  project: {
    id: string;
    name: string;
  };
  source: {
    video: string;
    subtitle: string;
  };
  branding: {
    channel: string;
    intro_duration: number;
    outro_duration: number;
    hook_duration?: number;
    outro_text: string;
  };
  clips: Clip[];
  scenes?: Scene[];
  output?: {
    file: string;
    status: "not_started" | "rendering" | "completed" | "failed";
    width?: number;
    height?: number;
  };
}

export interface Clip {
  id: string;
  start: string;
  end: string;
  title: string;
  hook: string;
  next_hook: string;
  transcript: string;
  clip_file: string | null;
  final_file: string | null;
  status: "planned" | "processing" | "cut" | "completed" | "failed";
  scene_index?: number;
  include_in_stitch?: boolean;
}

export interface Scene {
  id: string;
  index: number;
  start: string;
  end: string;
  title: string;
  summary: string;
  importance?: number;
  tags?: string[];
  selected?: boolean;
  thumbnail?: string;
}

export interface ProcessingState {
  active: boolean;
  operation: string;
  progress: number;
  current: number;
  total: number;
  items: ProcessingItem[];
}

export interface ProcessingItem {
  id: string;
  name: string;
  status: "waiting" | "processing" | "completed" | "error";
  progress: number;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  createdAt?: number;
}

export type ViewMode = "visual" | "json";
export type LayoutView = "grid" | "list";
