import type { TaskType } from '../components/Execution/tasks';

export type TaskLogEvent = 'TASK_START' | 'TASK_END';

export interface TaskLog {
  event: TaskLogEvent;
  task: TaskType;
  time: number;
}
