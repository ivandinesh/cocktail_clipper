import { create } from "zustand";
import type { Project, Clip, Scene, ProcessingState, ToastMessage } from "../types";

interface ProjectStore {
  project: Project | null;
  projectId: string | null;
  loading: boolean;
  error: string | null;
  processing: ProcessingState;
  toasts: ToastMessage[];
  activityLog: ToastMessage[];
  selectedClipId: string | null;
  selectedSceneIndex: number | null;
  sidebarSection: string;

  setProject: (project: Project) => void;
  setProjectId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  addClip: (clip: Clip) => void;
  setClips: (clips: Clip[]) => void;
  setProcessing: (processing: Partial<ProcessingState>) => void;
  resetProcessing: () => void;
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  clearActivityLog: () => void;
  setSelectedClip: (id: string | null) => void;
  setSelectedScene: (index: number | null) => void;
  setSidebarSection: (section: string) => void;
  updateProjectField: (field: string, value: any) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: null,
  projectId: null,
  loading: false,
  error: null,
  processing: {
    active: false,
    operation: "",
    progress: 0,
    current: 0,
    total: 0,
    items: [],
  },
  toasts: [],
  activityLog: [],
  selectedClipId: null,
  selectedSceneIndex: null,
  sidebarSection: "overview",

  setProject: (project) => set({ project }),
  setProjectId: (id) => set({ projectId: id }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  updateClip: (clipId, updates) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          clips: state.project.clips.map((c) =>
            c.id === clipId ? { ...c, ...updates } : c
          ),
        },
      };
    }),

  addClip: (clip) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          clips: [...state.project.clips, clip],
        },
      };
    }),

  setClips: (clips) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: { ...state.project, clips },
      };
    }),

  setProcessing: (updates) =>
    set((state) => ({
      processing: { ...state.processing, ...updates },
    })),

  resetProcessing: () =>
    set({
      processing: {
        active: false,
        operation: "",
        progress: 0,
        current: 0,
        total: 0,
        items: [],
      },
    }),

  addToast: (toast) =>
    set((state) => {
      const entry = { ...toast, id: `${Date.now()}-${state.activityLog.length}`, createdAt: Date.now() };
      return {
        toasts: [...state.toasts, entry],
        activityLog: [...state.activityLog, entry].slice(-50),
      };
    }),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearActivityLog: () => set({ activityLog: [] }),

  setSelectedClip: (id) => set({ selectedClipId: id }),
  setSelectedScene: (index) => set({ selectedSceneIndex: index }),
  setSidebarSection: (section) => set({ sidebarSection: section }),

  updateProjectField: (field, value) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: { ...state.project, [field]: value },
      };
    }),
}));
