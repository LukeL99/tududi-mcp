/**
 * Tududi API Types
 */

export interface TududuTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  projectId?: string;
  areaId?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TududuProject {
  id: string;
  name: string;
  description?: string;
  areaId?: string;
  color?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TududuArea {
  id: string;
  name: string;
  description?: string;
  color?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId?: string;
  areaId?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
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
