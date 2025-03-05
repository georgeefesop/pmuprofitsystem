# Test MCP Server Connection

Write-Host "Testing MCP Server Connection..." -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host

# Check if Python processes are running
$pythonProcesses = Get-Process -Name python* -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Write-Host "✅ Python processes are running:" -ForegroundColor Green
    $pythonProcesses | ForEach-Object {
        Write-Host "   - $($_.ProcessName) (PID: $($_.Id))"
    }
} else {
    Write-Host "❌ No Python processes detected" -ForegroundColor Red
    Write-Host "   The MCP server might not be running." -ForegroundColor Red
    Write-Host "   Try starting it with: .\start_supabase_mcp.bat" -ForegroundColor Yellow
}

# Check if MCP configuration exists
$mcpConfigPath = "$env:APPDATA\supabase-mcp\.env"
if (Test-Path $mcpConfigPath) {
    Write-Host "✅ MCP server configuration found at: $mcpConfigPath" -ForegroundColor Green
    
    # Read and display non-sensitive configuration
    Write-Host "   Configuration details (excluding sensitive data):" -ForegroundColor Cyan
    Get-Content $mcpConfigPath | ForEach-Object {
        if (-not ($_ -match "PASSWORD|KEY|TOKEN|SECRET")) {
            Write-Host "   $($_)"
        } else {
            Write-Host "   [SENSITIVE DATA REDACTED]"
        }
    }
} else {
    Write-Host "❌ MCP server configuration not found at: $mcpConfigPath" -ForegroundColor Red
    Write-Host "   The MCP server might not be properly configured." -ForegroundColor Red
}

Write-Host
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "===========" -ForegroundColor Cyan
Write-Host "1. If the MCP server is running, you can use it to interact with your Supabase project." -ForegroundColor Green
Write-Host "2. If the MCP server is not running, start it with: .\start_supabase_mcp.bat" -ForegroundColor Yellow
Write-Host "3. If you need to configure the MCP server, edit: $mcpConfigPath" -ForegroundColor Yellow 