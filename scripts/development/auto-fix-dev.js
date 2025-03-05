const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { injectErrorLogger } = require('./browser-error-logger');

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
    colorLog(colors.cyan, '=== PMU Profit System Development Server with Real-time Error Logging ===\n');
    
    // Step 1: Set up browser error logging
    colorLog(colors.blue, 'Setting up browser console error logging...');
    injectErrorLogger();
    colorLog(colors.green, 'Browser error logging enabled. Console errors will appear in this terminal.\n');
    
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
    
    // Step 3: Start the development server
    colorLog(colors.magenta, 'Starting Next.js development server...\n');
    
    // Use the existing start-dev.js script to start the server
    const devProcess = spawn('node', ['scripts/development/start-dev.js'], {
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
    colorLog(colors.red, 'Error running development server:');
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
runDevWithAutoFix(); 