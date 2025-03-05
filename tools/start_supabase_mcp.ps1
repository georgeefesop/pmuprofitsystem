# Automatic Supabase MCP Server Starter
# This script automatically starts the Supabase MCP server in a new window

Write-Host "Starting Supabase MCP Server in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd supabase-mcp-server ; python -m supabase_mcp.main"
Write-Host "MCP Server started in a new window." -ForegroundColor Green
Write-Host "You can close this window now." -ForegroundColor Yellow 