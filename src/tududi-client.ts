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
  async listTasks(): Promise<TududuTask[]> {
    const response = await this.client.get<TududuTask[]>('/api/tasks');
    return response.data;
  }

  async getTask(id: string): Promise<TududuTask> {
    const response = await this.client.get<TududuTask>(`/api/tasks/${id}`);
    return response.data;
  }

  async createTask(input: CreateTaskInput): Promise<TududuTask> {
    const response = await this.client.post<TududuTask>('/api/tasks', input);
    return response.data;
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<TududuTask> {
    const response = await this.client.patch<TududuTask>(`/api/tasks/${id}`, input);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.client.delete(`/api/tasks/${id}`);
  }

  async completeTask(id: string): Promise<TududuTask> {
    return this.updateTask(id, { completed: true });
  }

  async searchTasks(params: SearchTasksParams): Promise<TududuTask[]> {
    const response = await this.client.get<TududuTask[]>('/api/tasks/search', {
      params,
    });
    return response.data;
  }

  // Project operations
  async listProjects(): Promise<TududuProject[]> {
    const response = await this.client.get<TududuProject[]>('/api/projects');
    return response.data;
  }

  async getProject(id: string): Promise<TududuProject> {
    const response = await this.client.get<TududuProject>(`/api/projects/${id}`);
    return response.data;
  }

  async createProject(input: CreateProjectInput): Promise<TududuProject> {
    const response = await this.client.post<TududuProject>('/api/projects', input);
    return response.data;
  }

  // Area operations
  async listAreas(): Promise<TududuArea[]> {
    const response = await this.client.get<TududuArea[]>('/api/areas');
    return response.data;
  }

  async getArea(id: string): Promise<TududuArea> {
    const response = await this.client.get<TududuArea>(`/api/areas/${id}`);
    return response.data;
  }

  async createArea(input: CreateAreaInput): Promise<TududuArea> {
    const response = await this.client.post<TududuArea>('/api/areas', input);
    return response.data;
  }
}
