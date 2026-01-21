#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getConfig } from './config.js';
import { logger } from './logger.js';
import { TududuClient } from './tududi-client.js';

// Initialize configuration and client
const config = getConfig();
const tududuClient = new TududuClient(
  config.tududuApiUrl,
  config.tududuApiKey,
  config.tududuEmail,
  config.tududuPassword
);

// Create MCP server
const server = new Server(
  {
    name: 'tududi-mcp',
    version: '0.2.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'tududi_list_tasks',
        description: 'List all tasks from Tududi. Each task has a "uid" field (string) that should be used for update/delete/complete operations.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'tududi_create_task',
        description: 'Create a new task in Tududi. Can be a subtask if parentTaskId is provided. Note: Only 1 level of nesting is supported (tasks can have subtasks, but subtasks cannot have their own subtasks).',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Task title (maps to "name" in Tududi)',
            },
            description: {
              type: 'string',
              description: 'Task description/note',
            },
            projectId: {
              type: 'string',
              description: 'Project UID to assign task to',
            },
            areaId: {
              type: 'string',
              description: 'Area UID to assign task to',
            },
            parentTaskId: {
              type: 'string',
              description: 'Parent task UID to create this as a subtask. Must be a root task (not already a subtask).',
            },
            dueDate: {
              type: 'string',
              description: 'Due date in ISO format',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Task priority',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'tududi_update_task',
        description: 'Update an existing task',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Task UID (the string identifier like "abc123xyz")',
            },
            title: {
              type: 'string',
              description: 'New task title',
            },
            description: {
              type: 'string',
              description: 'New task description',
            },
            completed: {
              type: 'boolean',
              description: 'Task completion status',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Task priority',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'tududi_delete_task',
        description: 'Delete a task',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Task UID (the string identifier like "abc123xyz")',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'tududi_complete_task',
        description: 'Mark a task as complete',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Task UID (the string identifier like "abc123xyz")',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'tududi_list_subtasks',
        description: 'List all subtasks of a parent task. Only 1 level of nesting is supported. Completing a parent auto-completes subtasks, and completing all subtasks auto-completes the parent.',
        inputSchema: {
          type: 'object',
          properties: {
            parentId: {
              type: 'string',
              description: 'Parent task UID',
            },
          },
          required: ['parentId'],
        },
      },
      {
        name: 'tududi_list_projects',
        description: 'List all projects from Tududi. Each project has a "uid" field (string) for reference.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'tududi_create_project',
        description: 'Create a new project in Tududi',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Project name',
            },
            description: {
              type: 'string',
              description: 'Project description',
            },
            areaId: {
              type: 'string',
              description: 'Area UID to assign project to',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'tududi_list_areas',
        description: 'List all areas from Tududi. Each area has a "uid" field (string) for reference.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'tududi_create_area',
        description: 'Create a new area in Tududi',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Area name',
            },
            description: {
              type: 'string',
              description: 'Area description',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'tududi_search_tasks',
        description: 'Search tasks with filters',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (searches task names)',
            },
            projectId: {
              type: 'string',
              description: 'Filter by project numeric ID',
            },
            areaId: {
              type: 'string',
              description: 'Filter by area numeric ID',
            },
            completed: {
              type: 'boolean',
              description: 'Filter by completion status',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Filter by priority',
            },
          },
        },
      },
      {
        name: 'tududi_daily_completed',
        description: 'Get tasks completed on a specific date (defaults to today). Useful for end-of-day wrap-ups.',
        inputSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format (defaults to today)',
            },
          },
        },
      },
      {
        name: 'tududi_list_inbox',
        description: 'List all items in the Tududi inbox. The inbox is a quick capture space for notes and ideas.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max items to return' },
            offset: { type: 'number', description: 'Number of items to skip' },
          },
        },
      },
      {
        name: 'tududi_get_inbox_item',
        description: 'Get a single inbox item by its UID',
        inputSchema: {
          type: 'object',
          properties: {
            uid: { type: 'string', description: 'Inbox item UID' },
          },
          required: ['uid'],
        },
      },
      {
        name: 'tududi_create_inbox_item',
        description: 'Add a new item to the inbox for quick capture',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'The content to capture' },
            source: { type: 'string', description: 'Source of the item (defaults to "mcp")' },
          },
          required: ['content'],
        },
      },
      {
        name: 'tududi_update_inbox_item',
        description: 'Update an inbox item content or status',
        inputSchema: {
          type: 'object',
          properties: {
            uid: { type: 'string', description: 'Inbox item UID' },
            content: { type: 'string', description: 'New content' },
            status: { type: 'string', enum: ['added', 'processed', 'deleted'], description: 'New status' },
          },
          required: ['uid'],
        },
      },
      {
        name: 'tududi_delete_inbox_item',
        description: 'Delete an inbox item (soft delete)',
        inputSchema: {
          type: 'object',
          properties: {
            uid: { type: 'string', description: 'Inbox item UID' },
          },
          required: ['uid'],
        },
      },
      {
        name: 'tududi_process_inbox_item',
        description: 'Mark an inbox item as processed (typically after converting to a task)',
        inputSchema: {
          type: 'object',
          properties: {
            uid: { type: 'string', description: 'Inbox item UID' },
          },
          required: ['uid'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'tududi_list_tasks': {
        const tasks = await tududuClient.listTasks();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tasks, null, 2),
            },
          ],
        };
      }

      case 'tududi_create_task': {
        const task = await tududuClient.createTask(args as any);
        return {
          content: [
            {
              type: 'text',
              text: `Task created successfully:\n${JSON.stringify(task, null, 2)}`,
            },
          ],
        };
      }

      case 'tududi_update_task': {
        const { id, ...updateData } = args as any;
        const task = await tududuClient.updateTask(id, updateData);
        return {
          content: [
            {
              type: 'text',
              text: `Task updated successfully:\n${JSON.stringify(task, null, 2)}`,
            },
          ],
        };
      }

      case 'tududi_delete_task': {
        const { id } = args as any;
        await tududuClient.deleteTask(id);
        return {
          content: [
            {
              type: 'text',
              text: `Task ${id} deleted successfully`,
            },
          ],
        };
      }

      case 'tududi_complete_task': {
        const { id } = args as any;
        const task = await tududuClient.completeTask(id);
        return {
          content: [
            {
              type: 'text',
              text: `Task completed successfully:\n${JSON.stringify(task, null, 2)}`,
            },
          ],
        };
      }

      case 'tududi_list_subtasks': {
        const { parentId } = args as { parentId: string };
        const subtasks = await tududuClient.listSubtasks(parentId);
        return {
          content: [{ type: 'text', text: JSON.stringify(subtasks, null, 2) }],
        };
      }

      case 'tududi_list_projects': {
        const projects = await tududuClient.listProjects();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(projects, null, 2),
            },
          ],
        };
      }

      case 'tududi_create_project': {
        const project = await tududuClient.createProject(args as any);
        return {
          content: [
            {
              type: 'text',
              text: `Project created successfully:\n${JSON.stringify(project, null, 2)}`,
            },
          ],
        };
      }

      case 'tududi_list_areas': {
        const areas = await tududuClient.listAreas();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(areas, null, 2),
            },
          ],
        };
      }

      case 'tududi_create_area': {
        const area = await tududuClient.createArea(args as any);
        return {
          content: [
            {
              type: 'text',
              text: `Area created successfully:\n${JSON.stringify(area, null, 2)}`,
            },
          ],
        };
      }

      case 'tududi_search_tasks': {
        const tasks = await tududuClient.searchTasks(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tasks, null, 2),
            },
          ],
        };
      }

      case 'tududi_daily_completed': {
        const { date } = args as { date?: string };
        const tasks = await tududuClient.getCompletedTasksForDate(date);
        const dateStr = date || new Date().toISOString().split('T')[0];
        return {
          content: [
            {
              type: 'text',
              text: tasks.length > 0
                ? `Tasks completed on ${dateStr}:\n${JSON.stringify(tasks, null, 2)}`
                : `No tasks completed on ${dateStr}`,
            },
          ],
        };
      }

      case 'tududi_list_inbox': {
        const { limit, offset } = args as { limit?: number; offset?: number };
        const items = await tududuClient.listInboxItems(limit, offset);
        return {
          content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
        };
      }

      case 'tududi_get_inbox_item': {
        const { uid } = args as { uid: string };
        const item = await tududuClient.getInboxItem(uid);
        return {
          content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
        };
      }

      case 'tududi_create_inbox_item': {
        const item = await tududuClient.createInboxItem(args as any);
        return {
          content: [{ type: 'text', text: `Inbox item created:\n${JSON.stringify(item, null, 2)}` }],
        };
      }

      case 'tududi_update_inbox_item': {
        const { uid, ...updateData } = args as any;
        const item = await tududuClient.updateInboxItem(uid, updateData);
        return {
          content: [{ type: 'text', text: `Inbox item updated:\n${JSON.stringify(item, null, 2)}` }],
        };
      }

      case 'tududi_delete_inbox_item': {
        const { uid } = args as { uid: string };
        await tududuClient.deleteInboxItem(uid);
        return {
          content: [{ type: 'text', text: `Inbox item ${uid} deleted successfully` }],
        };
      }

      case 'tududi_process_inbox_item': {
        const { uid } = args as { uid: string };
        const item = await tududuClient.processInboxItem(uid);
        return {
          content: [{ type: 'text', text: `Inbox item processed:\n${JSON.stringify(item, null, 2)}` }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error({ error, tool: name }, 'Tool execution failed');
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  logger.info('Starting Tududi MCP server...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Tududi MCP server running');
}

main().catch((error) => {
  logger.error({ error }, 'Server failed to start');
  process.exit(1);
});
