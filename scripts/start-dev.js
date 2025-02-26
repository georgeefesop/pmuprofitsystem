const { spawn, exec } = require('child_process');
const net = require('net');

// Port to use
const PORT = 3000;

// Function to check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', () => {
      // Port is in use
      resolve(false);
    });
    
    server.once('listening', () => {
      // Port is available, close the server
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

// Function to kill process using a specific port (Windows)
async function killProcessOnPort(port) {
  return new Promise((resolve, reject) => {
    // Find the process ID using the port
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error) {
        console.log(`No process found using port ${port}`);
        resolve();
        return;
      }

      // Parse the output to get the PID
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length > 4 && line.includes('LISTENING')) {
          const pid = parts[parts.length - 1];
          console.log(`Found process ${pid} using port ${port}, killing it...`);
          
          // Kill the process
          exec(`taskkill /F /PID ${pid}`, (killError) => {
            if (killError) {
              console.error(`Failed to kill process ${pid}:`, killError);
              reject(killError);
            } else {
              console.log(`Successfully killed process ${pid}`);
              resolve();
            }
          });
          return;
        }
      }
      
      // If we get here, we didn't find a process to kill
      console.log(`No process found listening on port ${port}`);
      resolve();
    });
  });
}

// Start the server with port 3000
async function startServer() {
  try {
    console.log(`Checking if port ${PORT} is available...`);
    
    // Check if port is available
    const isAvailable = await isPortAvailable(PORT);
    
    if (!isAvailable) {
      console.log(`Port ${PORT} is in use, attempting to kill the process...`);
      await killProcessOnPort(PORT);
      
      // Double-check if port is now available
      const isNowAvailable = await isPortAvailable(PORT);
      if (!isNowAvailable) {
        console.error(`Port ${PORT} is still in use after attempting to kill the process.`);
        console.error(`Please manually close any application using port ${PORT} and try again.`);
        process.exit(1);
      }
    }
    
    console.log(`Starting Next.js development server on port ${PORT}...`);
    
    // Start the Next.js development server
    const nextProcess = spawn('npx', ['next', 'dev', '-p', PORT.toString()], {
      stdio: 'inherit',
      shell: true
    });
    
    // Wait a bit for the server to start before opening the browser
    setTimeout(() => {
      console.log(`Opening browser at http://localhost:${PORT}`);
      
      // Determine the command to open a URL based on the platform
      let command;
      switch (process.platform) {
        case 'darwin': // macOS
          command = `open http://localhost:${PORT}`;
          break;
        case 'win32': // Windows
          command = `start http://localhost:${PORT}`;
          break;
        default: // Linux and others
          command = `xdg-open http://localhost:${PORT}`;
          break;
      }
      
      // Execute the command to open the browser
      exec(command, (error) => {
        if (error) {
          console.error('Failed to open browser:', error);
          console.log(`Please manually open your browser and navigate to http://localhost:${PORT}`);
        }
      });
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

// Start the server
startServer(); 