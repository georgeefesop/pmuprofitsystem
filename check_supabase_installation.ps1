# Check Supabase Installation Script

Write-Host "Checking Supabase installation..." -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host

# Check if Supabase CLI is installed
$supabaseInstalled = $false
try {
    $supabaseVersion = Invoke-Expression "supabase --version" -ErrorAction SilentlyContinue
    if ($supabaseVersion) {
        Write-Host "✅ Supabase CLI is installed: $supabaseVersion" -ForegroundColor Green
        $supabaseInstalled = $true
    } else {
        Write-Host "❌ Supabase CLI is not installed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Supabase CLI is not installed" -ForegroundColor Red
}

# Check if Docker is installed (required for Supabase)
$dockerInstalled = $false
try {
    $dockerVersion = Invoke-Expression "docker --version" -ErrorAction SilentlyContinue
    if ($dockerVersion) {
        Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
        $dockerInstalled = $true
    } else {
        Write-Host "❌ Docker is not installed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
}

# Check if Docker is running
$dockerRunning = $false
if ($dockerInstalled) {
    try {
        $dockerInfo = Invoke-Expression "docker info" -ErrorAction SilentlyContinue
        if ($dockerInfo) {
            Write-Host "✅ Docker is running" -ForegroundColor Green
            $dockerRunning = $true
        } else {
            Write-Host "❌ Docker is installed but not running" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Docker is installed but not running" -ForegroundColor Yellow
    }
}

# Check for Supabase project
$supabaseProjectExists = Test-Path -Path "supabase"
if ($supabaseProjectExists) {
    Write-Host "✅ Supabase project directory found" -ForegroundColor Green
} else {
    Write-Host "❌ No Supabase project directory found" -ForegroundColor Yellow
}

Write-Host
Write-Host "Summary and Next Steps:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

if (-not $supabaseInstalled) {
    Write-Host "1. Install Supabase CLI:" -ForegroundColor Yellow
    Write-Host "   npm install -g supabase"
    Write-Host "   or"
    Write-Host "   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git"
    Write-Host "   scoop install supabase"
}

if (-not $dockerInstalled) {
    Write-Host "2. Install Docker Desktop:" -ForegroundColor Yellow
    Write-Host "   https://www.docker.com/products/docker-desktop/"
}

if ($dockerInstalled -and -not $dockerRunning) {
    Write-Host "3. Start Docker Desktop" -ForegroundColor Yellow
}

if ($supabaseInstalled -and $dockerRunning) {
    if (-not $supabaseProjectExists) {
        Write-Host "4. Initialize a Supabase project:" -ForegroundColor Yellow
        Write-Host "   supabase init"
    }
    
    Write-Host "5. Start Supabase locally:" -ForegroundColor Green
    Write-Host "   supabase start"
    
    Write-Host
    Write-Host "After starting Supabase, you can run the MCP server with:" -ForegroundColor Green
    Write-Host "   .\start_supabase_mcp.bat"
}

Write-Host
Write-Host "Note: The MCP server connects to Supabase, but Supabase itself needs to be running first." -ForegroundColor Cyan 