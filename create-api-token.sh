#!/bin/bash

# Script to create a Tududi API token using session authentication
# Usage: ./create-api-token.sh <email> <password> <tududi_url>

EMAIL="${1:-admin@example.com}"
PASSWORD="${2:-your-password}"
TUDUDI_URL="${3:-http://100.115.44.81:3002}"

echo "🔐 Creating Tududi API Token..."
echo "URL: $TUDUDI_URL"
echo "Email: $EMAIL"
echo ""

# Step 1: Login and get session cookie
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt -X POST "$TUDUDI_URL/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "error"; then
  echo "❌ Login failed:"
  echo "$LOGIN_RESPONSE"
  rm -f cookies.txt
  exit 1
fi

echo "✅ Login successful!"
echo ""

# Step 2: Create API token
echo "Step 2: Creating API token..."
TOKEN_NAME="MCP Server Token - $(date +%Y-%m-%d)"
TOKEN_RESPONSE=$(curl -s -b cookies.txt -X POST "$TUDUDI_URL/api/profile/api-keys" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$TOKEN_NAME\"}")

# Clean up cookies
rm -f cookies.txt

# Extract token from response
API_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$API_TOKEN" ]; then
  echo "❌ Failed to create API token:"
  echo "$TOKEN_RESPONSE"
  exit 1
fi

echo "✅ API Token created successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 YOUR API TOKEN (save this, it won't be shown again):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$API_TOKEN"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Update your .env file:"
echo "TUDUDI_API_URL=$TUDUDI_URL"
echo "TUDUDI_API_KEY=$API_TOKEN"
echo ""
echo "🧪 Test the token:"
echo "curl -H \"Authorization: Bearer $API_TOKEN\" $TUDUDI_URL/api/v1/tasks"
echo ""

