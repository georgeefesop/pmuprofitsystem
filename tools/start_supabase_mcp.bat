@echo off
echo Starting Supabase MCP server in a new window...
start cmd /k "cd supabase-mcp-server && py -m supabase_mcp.main"
echo Supabase MCP server started in a new window.
echo You can close this window now. 