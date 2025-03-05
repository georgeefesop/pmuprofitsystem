# Supabase Tools PowerShell Script

function Show-Menu {
    Clear-Host
    Write-Host "Supabase Tools Menu" -ForegroundColor Cyan
    Write-Host "===================" -ForegroundColor Cyan
    Write-Host
    Write-Host "1. Test Supabase MCP server connection"
    Write-Host "2. Start Supabase MCP Server (in a new window)"
    Write-Host "3. Check MCP Server Status"
    Write-Host "4. Exit"
    Write-Host
}

function Test-SupabaseConnection {
    Write-Host
    Write-Host "Testing Supabase MCP server connection..." -ForegroundColor Yellow
    & .\test_mcp_server.ps1
    Write-Host
    Read-Host "Press Enter to continue"
}

function Start-SupabaseMCP {
    Write-Host
    Write-Host "Starting Supabase MCP Server in a new window..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd supabase-mcp-server ; python -m supabase_mcp.main"
    Write-Host "MCP Server started in a new window." -ForegroundColor Green
    Write-Host
    Read-Host "Press Enter to continue"
}

function Check-MCPStatus {
    Write-Host
    Write-Host "Checking MCP Server status..." -ForegroundColor Yellow
    $pythonProcesses = Get-Process -Name python -ErrorAction SilentlyContinue
    
    if ($pythonProcesses) {
        Write-Host "MCP Server appears to be running." -ForegroundColor Green
    } else {
        Write-Host "MCP Server does not appear to be running." -ForegroundColor Red
    }
    Write-Host
    Read-Host "Press Enter to continue"
}

# Main loop
do {
    Show-Menu
    $choice = Read-Host "Enter your choice (1-4)"
    
    switch ($choice) {
        "1" { Test-SupabaseConnection }
        "2" { Start-SupabaseMCP }
        "3" { Check-MCPStatus }
        "4" { 
            Write-Host "Exiting..." -ForegroundColor Yellow
            return 
        }
        default {
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            Read-Host "Press Enter to continue"
        }
    }
} while ($true) 