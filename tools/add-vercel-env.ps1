# PowerShell script to add environment variables from .env.local to Vercel

# Read the .env.local file
$envContent = Get-Content .env.local

# Process each line
foreach ($line in $envContent) {
    # Skip empty lines and comments
    if ($line -and -not $line.StartsWith('#')) {
        # Split the line into key and value
        $parts = $line -split '=', 2
        if ($parts.Count -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            
            # Add the environment variable to Vercel for production
            Write-Host "Adding $key to production environment..."
            $value | vercel env add $key production
            
            # Add the environment variable to Vercel for preview
            Write-Host "Adding $key to preview environment..."
            $value | vercel env add $key preview
            
            # Add the environment variable to Vercel for development
            Write-Host "Adding $key to development environment..."
            $value | vercel env add $key development
        }
    }
}

Write-Host "All environment variables have been added to Vercel."
Write-Host "You can now deploy your project with: vercel --prod" 