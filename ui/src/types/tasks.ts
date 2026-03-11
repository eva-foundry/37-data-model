/**
 * Tasks Types - Generated from Data Model Layer: tasks
 */

export interface TasksRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateTasksInput {
  id: string;
  [key: string]: any;
}

export interface UpdateTasksInput extends Partial<CreateTasksInput> {
  id: string;
}
