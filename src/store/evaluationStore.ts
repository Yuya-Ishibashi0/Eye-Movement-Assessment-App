import { create } from 'zustand';
import type { TaskLog } from '../types/evaluation';

export interface SubjectInfo {
  id: string;
  age: string;
  examiner: string;
  date: string;
  device: string;
}

export interface TaskRecord {
  taskName: string;
  videoBlob: Blob | null;
  logs: TaskLog[];
}

interface EvaluationState {
  subjectInfo: SubjectInfo;
  pixelsPerMm: number; // For calibration (e.g. 1cm = 10 * pixelsPerMm)
  records: Record<string, TaskRecord>;

  setSubjectInfo: (info: Partial<SubjectInfo>) => void;
  setCalibration: (pixelsPerMm: number) => void;
  addRecord: (taskName: string, videoBlob: Blob | null, logs: TaskLog[]) => void;
  resetSession: () => void;
}

const defaultSubjectInfo: SubjectInfo = {
  id: '',
  age: '',
  examiner: '',
  date: new Date().toISOString().split('T')[0],
  device: navigator.userAgent,
};

export const useEvaluationStore = create<EvaluationState>((set) => ({
  subjectInfo: { ...defaultSubjectInfo },
  pixelsPerMm: 3.78, // default ~96dpi
  records: {},

  setSubjectInfo: (info) =>
    set((state) => ({ subjectInfo: { ...state.subjectInfo, ...info } })),

  setCalibration: (pixelsPerMm) => set({ pixelsPerMm }),

  addRecord: (taskName, videoBlob, logs) =>
    set((state) => ({
      records: {
        ...state.records,
        [taskName]: { taskName, videoBlob, logs },
      },
    })),

  resetSession: () =>
    set({
      subjectInfo: { ...defaultSubjectInfo, date: new Date().toISOString().split('T')[0] },
      records: {},
      // Keep calibration as is
    }),
}));
