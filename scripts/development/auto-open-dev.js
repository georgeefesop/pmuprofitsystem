const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const PORT = 3000;
const URL = `http://localhost:${PORT}`;

console.log('Starting PMU Profit System development server with auto-browser opening...');

// Function to open browser based on platform
function openBrowser(url) {
  console.log(`Opening browser at ${url}`);
  
  let command;
  switch (process.platform) {
    case 'darwin': // macOS
      command = `open ${url}`;
      break;
    case 'win32': // Windows
      command = `start ${url}`;
      break;
    default: // Linux and others
      command = `xdg-open ${url}`;
      break;
  }
  
  exec(command, (error) => {
    if (error) {
      console.error('Failed to open browser:', error);
      console.log(`Please manually open your browser and navigate to ${url}`);
    } else {
      console.log('Browser opened successfully.');
    }
  });
}

// Function to check if port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    
    server.once('error', () => {
      // Port is in use
      resolve(true);
    });
    
    server.once('listening', () => {
      // Port is available, close the server
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

// Function to kill process on port (Windows)
async function killProcessOnPort(port) {
  if (process.platform !== 'win32') {
    console.log('Port killing only supported on Windows');
    return;
  }
  
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error || !stdout) {
        console.log(`No process found using port ${port}`);
        resolve();
        return;
      }

      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length > 4 && line.includes('LISTENING')) {
          const pid = parts[parts.length - 1];
          console.log(`Found process ${pid} using port ${port}, killing it...`);
          
          exec(`taskkill /F /PID ${pid}`, (killError) => {
            if (killError) {
              console.error(`Failed to kill process ${pid}:`, killError);
            } else {
              console.log(`Successfully killed process ${pid}`);
            }
            resolve();
          });
          return;
        }
      }
      
      console.log(`No process found listening on port ${port}`);
      resolve();
    });
  });
}

// Main function to start server and open browser
async function startServerAndOpenBrowser() {
  try {
    // Check if port is in use
    const portInUse = await isPortInUse(PORT);
    
    if (portInUse) {
      console.log(`Port ${PORT} is in use. Attempting to free it...`);
      await killProcessOnPort(PORT);
      
      // Check again after attempting to kill
      const stillInUse = await isPortInUse(PORT);
      if (stillInUse) {
        console.error(`Port ${PORT} is still in use. Please close the application using it and try again.`);
        process.exit(1);
      }
    }
    
    // Start Next.js development server
    const nextProcess = spawn('npx', ['next', 'dev', '-p', PORT.toString()], {
      stdio: 'inherit',
      shell: true
    });
    
    // Wait for server to start before opening browser
    console.log('Waiting for server to start...');
    setTimeout(() => {
      openBrowser(URL);
    }, 3000); // Wait 3 seconds
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Shutting down server...');
      nextProcess.kill('SIGINT');
      process.exit(0);
    });
    
    nextProcess.on('close', (code) => {
      console.log(`Next.js process exited with code ${code}`);
      process.exit(code);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server and open browser
startServerAndOpenBrowser(); 