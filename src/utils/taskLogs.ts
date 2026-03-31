import type { TaskType } from '../components/Execution/tasks';
import type { TaskLog, TaskLogEvent } from '../types/evaluation';

export function createTaskLog(event: TaskLogEvent, task: TaskType): TaskLog {
  return {
    event,
    task,
    time: Date.now(),
  };
}
