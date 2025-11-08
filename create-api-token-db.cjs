#!/usr/bin/env node

/**
 * Script to create a Tududi API token directly in the database
 * This is a workaround for versions that don't have the API endpoint yet
 * Usage: node create-api-token-db.cjs <user_id> <db_path>
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Parse command line arguments
const userId = process.argv[2] || '1';
const dbPath = process.argv[3] || '/app/backend/db/database.sqlite';

console.log('🔐 Creating Tududi API Token (Direct Database Method)...');
console.log(`User ID: ${userId}`);
console.log(`Database: ${dbPath}`);
console.log('');

// Generate a random token
function generateRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Main function
async function createApiToken() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Failed to connect to database:', err.message);
        reject(err);
        return;
      }

      console.log('✅ Connected to database');
      console.log('');

      // Generate token
      const rawToken = generateRawToken();
      const tokenPrefix = rawToken.slice(0, 12);
      const tokenName = `MCP Server Token - ${new Date().toISOString().split('T')[0]}`;

      console.log('Step 1: Hashing token...');

      // Hash the token
      bcrypt.hash(rawToken, 12, (err, tokenHash) => {
        if (err) {
          console.error('❌ Failed to hash token:', err.message);
          db.close();
          reject(err);
          return;
        }

        console.log('✅ Token hashed');
        console.log('');
        console.log('Step 2: Inserting into database...');

        // Insert into database
        const sql = `
          INSERT INTO api_tokens (user_id, name, token_hash, token_prefix, created_at, updated_at)
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        `;

        db.run(sql, [userId, tokenName, tokenHash, tokenPrefix], function(err) {
          if (err) {
            console.error('❌ Failed to insert token:', err.message);
            db.close();
            reject(err);
            return;
          }

          console.log('✅ Token created successfully!');
          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🔑 YOUR API TOKEN (save this, it won\'t be shown again):');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          console.log(rawToken);
          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          console.log('📝 Update your .env file:');
          console.log(`TUDUDI_API_URL=http://100.115.44.81:3002`);
          console.log(`TUDUDI_API_KEY=${rawToken}`);
          console.log('');

          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err.message);
            }
            resolve(rawToken);
          });
        });
      });
    });
  });
}

// Run the script
createApiToken()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });

