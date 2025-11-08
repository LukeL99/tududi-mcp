# PowerShell script to create a Tududi API token using session authentication
# Usage: .\create-api-token.ps1 -Email "admin@example.com" -Password "your-password" -TududiUrl "http://100.115.44.81:3002"

param(
    [string]$Email = "admin@example.com",
    [string]$Password = "your-password",
    [string]$TududiUrl = "http://100.115.44.81:3002"
)

Write-Host "🔐 Creating Tududi API Token..." -ForegroundColor Cyan
Write-Host "URL: $TududiUrl"
Write-Host "Email: $Email"
Write-Host ""

# Step 1: Login and get session cookie
Write-Host "Step 1: Logging in..." -ForegroundColor Yellow

$loginBody = @{
    email = $Email
    password = $Password
} | ConvertTo-Json

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

try {
    $loginResponse = Invoke-WebRequest -Uri "$TududiUrl/api/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -WebSession $session `
        -ErrorAction Stop

    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Login failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Step 2: Create API token
Write-Host "Step 2: Creating API token..." -ForegroundColor Yellow

$tokenName = "MCP Server Token - $(Get-Date -Format 'yyyy-MM-dd')"
$tokenBody = @{
    name = $tokenName
} | ConvertTo-Json

try {
    $tokenResponse = Invoke-WebRequest -Uri "$TududiUrl/api/profile/api-keys" `
        -Method POST `
        -ContentType "application/json" `
        -Body $tokenBody `
        -WebSession $session `
        -ErrorAction Stop

    $tokenData = $tokenResponse.Content | ConvertFrom-Json
    $apiToken = $tokenData.token

    if ([string]::IsNullOrEmpty($apiToken)) {
        Write-Host "❌ Failed to create API token:" -ForegroundColor Red
        Write-Host $tokenResponse.Content
        exit 1
    }

    Write-Host "✅ API Token created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🔑 YOUR API TOKEN (save this, it won't be shown again):" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host $apiToken -ForegroundColor White
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Update your .env file:" -ForegroundColor Yellow
    Write-Host "TUDUDI_API_URL=$TududiUrl"
    Write-Host "TUDUDI_API_KEY=$apiToken"
    Write-Host ""
    Write-Host "🧪 Test the token:" -ForegroundColor Yellow
    Write-Host "curl -H `"Authorization: Bearer $apiToken`" $TududiUrl/api/v1/tasks"
    Write-Host ""

    # Optionally update .env file
    $updateEnv = Read-Host "Would you like to update .env file automatically? (y/n)"
    if ($updateEnv -eq "y" -or $updateEnv -eq "Y") {
        $envContent = @"
# Tududi API Configuration
TUDUDI_API_URL=$TududiUrl
TUDUDI_API_KEY=$apiToken

# Logging Configuration
LOG_LEVEL=info
"@
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "✅ .env file updated!" -ForegroundColor Green
    }

} catch {
    Write-Host "❌ Failed to create API token:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        Write-Host $reader.ReadToEnd()
    }
    exit 1
}

