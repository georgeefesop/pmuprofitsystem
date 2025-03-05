const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Function to log with colors that works in all environments
function colorLog(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Main function to run the development server with auto-fixing
async function runDevWithAutoFix() {
  try {
    colorLog(colors.cyan, '=== PMU Profit System Auto-Fix Development Server ===\n');
    
    // Step 1: Check for build errors
    colorLog(colors.blue, 'Checking for build errors before starting development server...');
    
    try {
      // Run the check-build-errors script
      execSync('node scripts/check-build-errors.js', { stdio: 'inherit' });
      colorLog(colors.green, 'No build errors found or all errors fixed automatically.\n');
    } catch (error) {
      colorLog(colors.yellow, 'Some build errors could not be fixed automatically. Continuing with development server anyway.\n');
    }
    
    // Step 2: Run TypeScript type checking
    colorLog(colors.blue, 'Running TypeScript type checking...');
    
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      colorLog(colors.green, 'TypeScript type checking passed.\n');
    } catch (error) {
      const typeCheckOutput = error.stdout?.toString() || error.stderr?.toString() || '';
      
      if (typeCheckOutput.includes('error')) {
        colorLog(colors.yellow, 'TypeScript errors found:');
        console.log(typeCheckOutput);
        colorLog(colors.yellow, 'Continuing with development server despite TypeScript errors.\n');
      }
    }
    
    // Step 3: Run ESLint
    colorLog(colors.blue, 'Running ESLint to check for code quality issues...');
    
    try {
      execSync('npx next lint --quiet', { stdio: 'pipe' });
      colorLog(colors.green, 'ESLint check passed.\n');
    } catch (error) {
      colorLog(colors.yellow, 'ESLint found some issues. Continuing with development server anyway.\n');
    }
    
    // Step 4: Start the development server
    colorLog(colors.magenta, 'Starting Next.js development server...\n');
    
    // Use the existing start-dev.js script to start the server
    const devProcess = spawn('node', ['scripts/start-dev.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      colorLog(colors.blue, 'Shutting down server...');
      devProcess.kill('SIGINT');
      process.exit(0);
    });
    
    devProcess.on('close', (code) => {
      colorLog(colors.blue, `Development server process exited with code ${code}`);
      process.exit(code);
    });
  } catch (error) {
    colorLog(colors.red, 'Error running development server with auto-fix:');
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
runDevWithAutoFix(); 