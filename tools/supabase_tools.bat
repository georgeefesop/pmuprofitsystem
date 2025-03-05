@echo off
setlocal enabledelayedexpansion

:menu
cls
echo Supabase Tools Menu
echo ===================
echo.
echo 1. Test Supabase MCP server connection
echo 2. Start Supabase MCP Server (in a new window)
echo 3. Check MCP Server Status
echo 4. Exit
echo.

set /p choice=Enter your choice (1-4): 

if "%choice%"=="1" (
    echo.
    echo Testing Supabase MCP server connection...
    powershell -File test_mcp_server.ps1
    echo.
    pause
    goto menu
)

if "%choice%"=="2" (
    echo.
    echo Starting Supabase MCP Server in a new window...
    start cmd /k "cd supabase-mcp-server && py -m supabase_mcp.main"
    echo.
    echo MCP Server started in a new window.
    echo.
    pause
    goto menu
)

if "%choice%"=="3" (
    echo.
    echo Checking MCP Server status...
    tasklist /fi "imagename eq python.exe" | find /i "python.exe" > nul
    if !errorlevel! equ 0 (
        echo MCP Server appears to be running.
    ) else (
        echo MCP Server does not appear to be running.
    )
    echo.
    pause
    goto menu
)

if "%choice%"=="4" (
    echo.
    echo Exiting...
    exit /b 0
)

echo.
echo Invalid choice. Please try again.
echo.
pause
goto menu