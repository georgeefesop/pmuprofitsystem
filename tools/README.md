# PMU Profit System Tools

This directory contains utility tools and scripts for development, testing, and deployment of the PMU Profit System.

## Directory Structure

- `bin/` - Binary tools and executables
- Various utility scripts for Supabase and other tasks

## Binary Tools

- `bin/bfg.jar` - BFG Repo-Cleaner for cleaning Git repositories
- `bin/python-installer.exe` - Python installer for Windows

## Supabase Scripts

- `test_supabase_connection.py` - Python script for testing Supabase connection
- `test_supabase_query.py` - Python script for testing Supabase queries

## Utility Scripts

- `add-vercel-env.ps1` - PowerShell script for adding environment variables to Vercel
- `check_supabase_installation.ps1` - PowerShell script for checking Supabase installation
- `supabase_tools.bat` - Windows batch file with Supabase utility tools
- `supabase_tools.ps1` - PowerShell script with Supabase utility tools

## Usage

### Testing Supabase Connection

```bash
# Python
python tools/test_supabase_connection.py
```

### Using Supabase Tools Menu

```bash
# Windows Command Prompt
tools\supabase_tools.bat

# PowerShell
.\tools\supabase_tools.ps1
```

This will display a menu with various Supabase utility tools.

### Checking Supabase Installation

```bash
# PowerShell
.\tools\check_supabase_installation.ps1
```

### Adding Environment Variables to Vercel

```bash
# PowerShell
.\tools\add-vercel-env.ps1
``` 