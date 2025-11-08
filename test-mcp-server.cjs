#!/usr/bin/env node

/**
 * Test script for the Tududi MCP server
 */

const { spawn } = require('child_process');
const readline = require('readline');

console.log('🧪 Testing Tududi MCP Server...\n');

// Start the MCP server
const server = spawn('node', ['dist/server.js'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe'],
});

let responseBuffer = '';
let requestId = 1;

// Handle server output
server.stdout.on('data', (data) => {
  const text = data.toString();
  responseBuffer += text;
  
  // Try to parse JSON responses
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  lines.forEach((line) => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('📥 Response:', JSON.stringify(response, null, 2));
      } catch (e) {
        // Not JSON, might be log output
        if (!line.includes('INFO') && !line.includes('ERROR')) {
          console.log('📄 Output:', line);
        }
      }
    }
  });
});

server.stderr.on('data', (data) => {
  const text = data.toString();
  if (text.includes('INFO')) {
    console.log('ℹ️ ', text.trim());
  } else if (text.includes('ERROR')) {
    console.error('❌', text.trim());
  }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Wait for server to start
setTimeout(() => {
  console.log('\n📤 Sending test requests...\n');
  
  // Test 1: List tools
  console.log('Test 1: List available tools');
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'tools/list',
  };
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // Test 2: List tasks
  setTimeout(() => {
    console.log('\nTest 2: List tasks from Tududi');
    const listTasksRequest = {
      jsonrpc: '2.0',
      id: requestId++,
      method: 'tools/call',
      params: {
        name: 'tududi_list_tasks',
        arguments: {},
      },
    };
    server.stdin.write(JSON.stringify(listTasksRequest) + '\n');
    
    // Give time for response then exit
    setTimeout(() => {
      console.log('\n✅ Tests complete!');
      server.kill();
      process.exit(0);
    }, 3000);
  }, 2000);
}, 2000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Interrupted');
  server.kill();
  process.exit(0);
});

