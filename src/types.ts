/**
 * Tududi API Types - matches actual API response format (snake_case)
 */

/**
 * Task status values used by the Tududi API
 */
export const TaskStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  ARCHIVED: 'archived',
  WAITING: 'waiting',
} as const;

export type TaskStatusValue = typeof TaskStatus[keyof typeof TaskStatus];

/**
 * Numeric status values returned in API responses
 */
export const TaskStatusNumeric = {
  NOT_STARTED: 0,
  IN_PROGRESS: 1,
  DONE: 2,
  ARCHIVED: 3,
  WAITING: 4,
} as const;

/**
 * Task priority values (numeric, used in API requests and responses)
 */
export const TaskPriority = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
} as const;

export type TaskPriorityValue = typeof TaskPriority[keyof typeof TaskPriority];

export interface TududuTask {
  id: number;
  uid: string;
  name: string;
  note?: string | null;
  status: number; // See TaskStatusNumeric
  priority: number; // See TaskPriority
  project_id?: number | null;
  area_id?: number | null;
  parent_task_id?: number | null;
  due_date?: string | null;
  defer_until?: string | null;
  completed_at?: string | null;
  Tags?: { id: number; name: string }[];
  Project?: TududuProject | null;
  subtasks?: TududuTask[];
  created_at: string;
  updated_at: string;
}

export interface TududuProject {
  id: number;
  uid?: string;
  name: string;
  description?: string | null;
  area_id?: number | null;
  color?: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TududuArea {
  id: number;
  uid?: string;
  name: string;
  description?: string | null;
  color?: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId?: string;
  areaId?: string;
  parentTaskId?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'not_started' | 'in_progress' | 'done' | 'archived' | 'waiting';
  projectId?: string;
  areaId?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  areaId?: string;
  color?: string;
}

export interface CreateAreaInput {
  name: string;
  description?: string;
  color?: string;
}

export interface SearchTasksParams {
  query?: string;
  projectId?: string;
  areaId?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

// Inbox types
export interface InboxItem {
  uid: string;
  title: string;
  content: string;
  status: 'added' | 'processed' | 'deleted';
  source: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInboxItemInput {
  content: string;
  source?: string;
}

export interface UpdateInboxItemInput {
  content?: string;
  status?: 'added' | 'processed' | 'deleted';
}
