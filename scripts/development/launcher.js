const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Make the shell script executable on Unix-like systems
if (process.platform !== 'win32') {
  const shellScriptPath = path.join(__dirname, 'start-dev.sh');
  try {
    fs.chmodSync(shellScriptPath, '755');
    console.log('Made shell script executable');
  } catch (error) {
    console.error('Failed to make shell script executable:', error);
  }
}

console.log('Launching PMU Profit System development server...');

// For Windows, use the start command with /B flag to run in background
if (process.platform === 'win32') {
  // The /B flag runs the command without creating a new window, but still in the background
  // We redirect output to nul to avoid it showing in the current console
  exec('start /B cmd /C "node scripts/start-dev.js > nul 2>&1"', (error) => {
    if (error) {
      console.error('Failed to start server in background:', error);
      console.log('Please run npm run dev:direct instead');
    } else {
      console.log('Server started in the background. You can continue using this terminal.');
      console.log('To view the server, open http://localhost:3000 in your browser.');
    }
    // Exit immediately regardless of success or failure
    process.exit(0);
  });
} else {
  // For non-Windows platforms
  let command;
  
  if (process.platform === 'darwin') {
    // macOS
    command = `osascript -e 'tell application "Terminal" to do script "cd \\"${process.cwd()}\\" && node scripts/start-dev.js"'`;
  } else {
    // Linux - use nohup to run in background
    command = `nohup node ${path.join(process.cwd(), 'scripts', 'start-dev.js')} > /dev/null 2>&1 &`;
  }

  // Execute the command but don't wait for it
  exec(command, (error) => {
    if (error) {
      console.error('Failed to start server in background:', error);
      console.log('Please run npm run dev:direct instead');
    } else {
      console.log('Server started in the background. You can continue using this terminal.');
      console.log('To view the server, open http://localhost:3000 in your browser.');
    }
    // Exit immediately
    process.exit(0);
  });
}

// Force exit after a short timeout in case the exec callback doesn't trigger
setTimeout(() => {
  console.log('Ensuring launcher exits properly...');
  process.exit(0);
}, 1000); 