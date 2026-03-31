export type TaskType =
  | 'FIXATION'
  | 'SACCADE_LR'
  | 'SACCADE_UD'
  | 'PURSUIT_LR'
  | 'PURSUIT_UD'
  | 'PURSUIT_CIRCLE'
  | 'REST';

export interface TaskDefinition {
  id: TaskType;
  name: string;
  durationMs: number;
}

export const TASKS: TaskDefinition[] = [
  { id: 'FIXATION', name: '注視', durationMs: 10000 },
  { id: 'REST', name: '休憩', durationMs: 5000 },
  { id: 'SACCADE_LR', name: '左右サッケード', durationMs: 10000 },
  { id: 'REST', name: '休憩', durationMs: 5000 },
  { id: 'SACCADE_UD', name: '上下サッケード', durationMs: 10000 },
  { id: 'REST', name: '休憩', durationMs: 5000 },
  { id: 'PURSUIT_LR', name: '左右追視', durationMs: 16730 },
  { id: 'REST', name: '休憩', durationMs: 5000 },
  { id: 'PURSUIT_UD', name: '上下追視', durationMs: 16730 },
  { id: 'REST', name: '休憩', durationMs: 5000 },
  { id: 'PURSUIT_CIRCLE', name: '円追視', durationMs: 40000 },
];
