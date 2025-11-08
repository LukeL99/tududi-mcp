#!/usr/bin/env node

/**
 * Script to create a Tududi API token using session authentication
 * Usage: node create-api-token.js <email> <password> <tududi_url>
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const email = process.argv[2] || 'admin@example.com';
const password = process.argv[3] || 'your-password';
const tududiUrl = process.argv[4] || 'http://100.115.44.81:3002';

console.log('🔐 Creating Tududi API Token...');
console.log(`URL: ${tududiUrl}`);
console.log(`Email: ${email}`);
console.log('');

// Helper function to make HTTP requests
function makeRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

// Main function
async function createApiToken() {
  try {
    // Step 1: Login
    console.log('Step 1: Logging in...');

    const loginData = JSON.stringify({
      email: email,
      password: password,
    });

    const loginResponse = await makeRequest(`${tududiUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData),
      },
    }, loginData);

    if (loginResponse.statusCode !== 200) {
      console.error('❌ Login failed:');
      console.error(loginResponse.body);
      process.exit(1);
    }

    // Extract session cookie
    const setCookieHeader = loginResponse.headers['set-cookie'];
    if (!setCookieHeader) {
      console.error('❌ No session cookie received');
      process.exit(1);
    }

    const sessionCookie = Array.isArray(setCookieHeader)
      ? setCookieHeader.join('; ')
      : setCookieHeader;

    console.log('✅ Login successful!');
    console.log('');

    // Step 2: Create API token
    console.log('Step 2: Creating API token...');

    const tokenName = `MCP Server Token - ${new Date().toISOString().split('T')[0]}`;
    const tokenData = JSON.stringify({
      name: tokenName,
    });

    const tokenResponse = await makeRequest(`${tududiUrl}/api/profile/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(tokenData),
        'Cookie': sessionCookie,
      },
    }, tokenData);

    if (tokenResponse.statusCode !== 201) {
      console.error('❌ Failed to create API token:');
      console.error(tokenResponse.body);
      process.exit(1);
    }

    const tokenResult = JSON.parse(tokenResponse.body);
    const apiToken = tokenResult.token;

    if (!apiToken) {
      console.error('❌ No token in response:');
      console.error(tokenResponse.body);
      process.exit(1);
    }

    console.log('✅ API Token created successfully!');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 YOUR API TOKEN (save this, it won\'t be shown again):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(apiToken);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 Update your .env file:');
    console.log(`TUDUDI_API_URL=${tududiUrl}`);
    console.log(`TUDUDI_API_KEY=${apiToken}`);
    console.log('');
    console.log('🧪 Test the token:');
    console.log(`curl -H "Authorization: Bearer ${apiToken}" ${tududiUrl}/api/v1/tasks`);
    console.log('');

    // Update .env file
    const envPath = path.join(__dirname, '.env');
    const envContent = `# Tududi API Configuration
TUDUDI_API_URL=${tududiUrl}
TUDUDI_API_KEY=${apiToken}

# Logging Configuration
LOG_LEVEL=info
`;

    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ .env file updated!');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
createApiToken();

