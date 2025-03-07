@echo off
setlocal enabledelayedexpansion

:menu
cls
echo Supabase Tools Menu
echo ===================
echo.
echo 1. Test Supabase Connection
echo 2. Exit
echo.

set /p choice=Enter your choice (1-2): 

if "%choice%"=="1" (
    echo.
    echo Testing Supabase connection...
    python test_supabase_connection.py
    echo.
    pause
    goto menu
)

if "%choice%"=="2" (
    echo.
    echo Exiting...
    exit /b 0
)

echo.
echo Invalid choice. Please try again.
echo.
pause
goto menu