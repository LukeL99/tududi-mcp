import { TududuClient } from '../tududi-client.js';

describe('TududuClient', () => {
  let client: TududuClient;

  beforeAll(() => {
    // Set up environment variables for tests
    process.env.LOG_LEVEL = 'silent';
  });

  beforeEach(() => {
    client = new TududuClient('http://localhost:3000', 'test-api-key');
  });

  it('should create a client instance', () => {
    expect(client).toBeInstanceOf(TududuClient);
  });

  it('should have required methods', () => {
    expect(typeof client.listTasks).toBe('function');
    expect(typeof client.createTask).toBe('function');
    expect(typeof client.updateTask).toBe('function');
    expect(typeof client.deleteTask).toBe('function');
    expect(typeof client.completeTask).toBe('function');
    expect(typeof client.listProjects).toBe('function');
    expect(typeof client.createProject).toBe('function');
    expect(typeof client.listAreas).toBe('function');
    expect(typeof client.searchTasks).toBe('function');
  });
});

