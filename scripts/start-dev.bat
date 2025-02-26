@echo off
echo Starting PMU Profit System development server...
start "PMU Profit System Dev Server" cmd /k "cd %~dp0.. && node scripts/start-dev.js"
echo Server started in a new window. You can continue using this terminal. 