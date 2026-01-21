import axios, { AxiosInstance } from 'axios';
import { logger } from './logger.js';
import {
  TududuTask,
  TududuProject,
  TududuArea,
  CreateTaskInput,
  UpdateTaskInput,
  CreateProjectInput,
  CreateAreaInput,
  SearchTasksParams,
  TaskPriority,
  InboxItem,
  CreateInboxItemInput,
  UpdateInboxItemInput,
} from './types.js';

export class TududuClient {
  private client: AxiosInstance;
  private sessionCookie?: string;

  constructor(apiUrl: string, apiKey?: string, email?: string, password?: string) {
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable cookies for session auth
    });

    // Add Authorization header if API key is provided
    if (apiKey) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
    }

    // If email/password provided, login and store session
    if (email && password && !apiKey) {
      this.login(email, password).catch((error) => {
        logger.error({ error: error.message }, 'Failed to login to Tududi');
        throw error;
      });
    }

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error({ error: error.message }, 'Tududi API error');
        throw error;
      }
    );
  }

  private async login(email: string, password: string): Promise<void> {
    try {
      const response = await this.client.post('/api/login', {
        email,
        password,
      });

      // Extract session cookie from response
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        this.sessionCookie = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
        // Set cookie for future requests
        this.client.defaults.headers.common['Cookie'] = this.sessionCookie;
      }

      logger.info('Successfully logged in to Tududi');
    } catch (error) {
      logger.error({ error }, 'Login failed');
      throw new Error('Failed to authenticate with Tududi');
    }
  }

  // Task operations
  async listTasks(params?: { type?: 'today' | 'upcoming' | 'completed' | 'archived' | 'all'; status?: 'pending' | 'completed' | 'archived'; order_by?: string }): Promise<TududuTask[]> {
    const response = await this.client.get<{ tasks: TududuTask[] }>('/api/v1/tasks', { params });
    return response.data.tasks;
  }

  async getTask(uid: string): Promise<TududuTask> {
    const response = await this.client.get<TududuTask>(`/api/v1/task/${uid}`);
    return response.data;
  }

  async createTask(input: CreateTaskInput): Promise<TududuTask> {
    // Map title to name for tududi API
    const payload: Record<string, unknown> = {
      name: input.title,
      note: input.description,
      project_id: input.projectId,
      area_id: input.areaId,
      due_date: input.dueDate,
      priority: input.priority === 'low' ? TaskPriority.LOW : input.priority === 'medium' ? TaskPriority.MEDIUM : TaskPriority.HIGH,
    };
    if (input.parentTaskId) {
      // API expects numeric ID, so look up parent task first
      const parentTask = await this.getTask(input.parentTaskId);
      payload.parent_task_id = parentTask.id;
    }
    if (input.status) payload.status = input.status;
    // Recurrence fields
    if (input.recurrenceType) payload.recurrence_type = input.recurrenceType;
    if (input.recurrenceInterval !== undefined) payload.recurrence_interval = input.recurrenceInterval;
    if (input.recurrenceEndDate) payload.recurrence_end_date = input.recurrenceEndDate;
    if (input.recurrenceWeekday !== undefined) payload.recurrence_weekday = input.recurrenceWeekday;
    if (input.recurrenceWeekdays) payload.recurrence_weekdays = input.recurrenceWeekdays;
    if (input.recurrenceMonthDay !== undefined) payload.recurrence_month_day = input.recurrenceMonthDay;
    if (input.recurrenceWeekOfMonth !== undefined) payload.recurrence_week_of_month = input.recurrenceWeekOfMonth;
    if (input.completionBased !== undefined) payload.completion_based = input.completionBased;
    const response = await this.client.post<TududuTask>('/api/v1/task', payload);
    return response.data;
  }

  async updateTask(uid: string, input: UpdateTaskInput): Promise<TududuTask> {
    const payload: Record<string, unknown> = {};
    if (input.title) payload.name = input.title;
    if (input.description) payload.note = input.description;
    if (input.status) payload.status = input.status;
    if (input.priority) payload.priority = input.priority === 'low' ? TaskPriority.LOW : input.priority === 'medium' ? TaskPriority.MEDIUM : TaskPriority.HIGH;
    if (input.dueDate) payload.due_date = input.dueDate;
    // Recurrence fields
    if (input.recurrenceType) payload.recurrence_type = input.recurrenceType;
    if (input.recurrenceInterval !== undefined) payload.recurrence_interval = input.recurrenceInterval;
    if (input.recurrenceEndDate) payload.recurrence_end_date = input.recurrenceEndDate;
    if (input.recurrenceWeekday !== undefined) payload.recurrence_weekday = input.recurrenceWeekday;
    if (input.recurrenceWeekdays) payload.recurrence_weekdays = input.recurrenceWeekdays;
    if (input.recurrenceMonthDay !== undefined) payload.recurrence_month_day = input.recurrenceMonthDay;
    if (input.recurrenceWeekOfMonth !== undefined) payload.recurrence_week_of_month = input.recurrenceWeekOfMonth;
    if (input.completionBased !== undefined) payload.completion_based = input.completionBased;
    const response = await this.client.patch<TududuTask>(`/api/v1/task/${uid}`, payload);
    return response.data;
  }

  async deleteTask(uid: string): Promise<void> {
    await this.client.delete(`/api/v1/task/${uid}`);
  }

  async completeTask(id: string): Promise<TududuTask> {
    return this.updateTask(id, { status: 'done' });
  }

  async listSubtasks(parentUid: string): Promise<TududuTask[]> {
    const response = await this.client.get<TududuTask[]>(`/api/task/${parentUid}/subtasks`);
    return response.data;
  }

  async getCompletedTasksForDate(date?: string): Promise<TududuTask[]> {
    // Get all completed tasks sorted by completion date
    // Note: type=all + status=completed is needed because there's no 'type=completed' case in tududi
    const tasks = await this.listTasks({ type: 'all', status: 'completed', order_by: 'completed_at:desc' });

    if (!date) {
      // Default to today
      date = new Date().toISOString().split('T')[0];
    }

    // Filter to tasks completed on the specified date
    return tasks.filter(task => {
      if (!task.completed_at) return false;
      const completedDate = task.completed_at.split('T')[0];
      return completedDate === date;
    });
  }

  async searchTasks(params: SearchTasksParams): Promise<TududuTask[]> {
    // Use API filtering for completed status, then filter locally for other params
    const apiParams: { type?: string; status?: string; order_by?: string } = {};
    if (params.completed === true) {
      apiParams.type = 'all';
      apiParams.status = 'completed';
      apiParams.order_by = 'completed_at:desc';
    } else if (params.completed === false) {
      apiParams.type = 'all';
      apiParams.status = 'active';
    }

    const tasks = await this.listTasks(apiParams as any);
    return tasks.filter(task => {
      if (params.query && !task.name?.toLowerCase().includes(params.query.toLowerCase())) return false;
      if (params.projectId && task.project_id !== parseInt(params.projectId)) return false;
      return true;
    });
  }

  // Project operations
  async listProjects(): Promise<TududuProject[]> {
    const response = await this.client.get<{ projects: TududuProject[] }>('/api/v1/projects');
    return response.data.projects;
  }

  async getProject(uid: string): Promise<TududuProject> {
    const response = await this.client.get<TududuProject>(`/api/v1/project/${uid}`);
    return response.data;
  }

  async createProject(input: CreateProjectInput): Promise<TududuProject> {
    const response = await this.client.post<TududuProject>('/api/v1/project', input);
    return response.data;
  }

  // Area operations
  async listAreas(): Promise<TududuArea[]> {
    const response = await this.client.get<TududuArea[]>('/api/v1/areas');
    return response.data;
  }

  async getArea(uid: string): Promise<TududuArea> {
    const response = await this.client.get<TududuArea>(`/api/v1/area/${uid}`);
    return response.data;
  }

  async createArea(input: CreateAreaInput): Promise<TududuArea> {
    const response = await this.client.post<TududuArea>('/api/v1/areas', input);
    return response.data;
  }

  // Inbox operations
  async listInboxItems(limit?: number, offset?: number): Promise<InboxItem[]> {
    const params: { limit?: number; offset?: number } = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const response = await this.client.get<InboxItem[] | { items: InboxItem[] }>('/api/inbox', { params });
    // Handle both array and paginated response formats
    return Array.isArray(response.data) ? response.data : response.data.items;
  }

  async getInboxItem(uid: string): Promise<InboxItem> {
    const response = await this.client.get<InboxItem>(`/api/inbox/${uid}`);
    return response.data;
  }

  async createInboxItem(input: CreateInboxItemInput): Promise<InboxItem> {
    const payload = {
      content: input.content,
      source: input.source || 'mcp',
    };
    const response = await this.client.post<InboxItem>('/api/inbox', payload);
    return response.data;
  }

  async updateInboxItem(uid: string, input: UpdateInboxItemInput): Promise<InboxItem> {
    const response = await this.client.patch<InboxItem>(`/api/inbox/${uid}`, input);
    return response.data;
  }

  async deleteInboxItem(uid: string): Promise<void> {
    await this.client.delete(`/api/inbox/${uid}`);
  }

  async processInboxItem(uid: string): Promise<InboxItem> {
    const response = await this.client.patch<InboxItem>(`/api/inbox/${uid}/process`);
    return response.data;
  }
}
