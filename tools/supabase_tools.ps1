# Supabase Tools PowerShell Script

function Show-Menu {
    Clear-Host
    Write-Host "Supabase Tools Menu" -ForegroundColor Cyan
    Write-Host "===================" -ForegroundColor Cyan
    Write-Host
    Write-Host "1. Test Supabase Connection"
    Write-Host "2. Exit"
    Write-Host
}

function Test-SupabaseConnection {
    Write-Host
    Write-Host "Testing Supabase connection..." -ForegroundColor Yellow
    & python .\test_supabase_connection.py
    Write-Host
    Read-Host "Press Enter to continue"
}

# Main loop
do {
    Show-Menu
    $choice = Read-Host "Enter your choice (1-2)"
    
    switch ($choice) {
        "1" { Test-SupabaseConnection }
        "2" { 
            Write-Host "Exiting..." -ForegroundColor Yellow
            return 
        }
        default {
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            Read-Host "Press Enter to continue"
        }
    }
} while ($true) 