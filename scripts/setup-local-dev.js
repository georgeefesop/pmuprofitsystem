const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if Docker is installed and running
function checkDocker() {
  return new Promise((resolve) => {
    exec('docker info', (error, stdout) => {
      if (error) {
        console.error('Docker is not installed or not running.');
        console.log('Please install Docker Desktop and start it before continuing.');
        resolve(false);
      } else {
        console.log('Docker is installed and running.');
        resolve(true);
      }
    });
  });
}

// Check if .env.local exists
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  return fs.existsSync(envPath);
}

// Run npm script
function runNpmScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`Running npm script: ${scriptName}`);
    
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const scriptProcess = spawn(npmCmd, ['run', scriptName], { 
      shell: true, 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    scriptProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`Script ${scriptName} completed successfully.`);
        resolve(true);
      } else {
        console.error(`Script ${scriptName} failed with exit code: ${code}`);
        reject(new Error(`Script ${scriptName} failed`));
      }
    });
  });
}

// Ask user for confirmation
function askConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main function
async function setupLocalDev() {
  try {
    console.log('=== PMU Profit System Local Development Setup ===');
    console.log('This script will set up your local development environment.');
    
    // Check if Docker is installed and running (required for Supabase)
    const dockerRunning = await checkDocker();
    if (!dockerRunning) {
      console.log('Please install and start Docker, then run this script again.');
      process.exit(1);
    }
    
    // Check if .env.local exists
    const envExists = checkEnvFile();
    
    if (!envExists) {
      console.log('No .env.local file found. You need to set up environment variables.');
      const setupEnv = await askConfirmation('Would you like to set up Supabase locally?');
      
      if (setupEnv) {
        // Run Supabase setup script
        await runNpmScript('setup:supabase');
      } else {
        console.log('You need to set up environment variables manually before continuing.');
        console.log('Please create a .env.local file with the required variables.');
        process.exit(1);
      }
    } else {
      console.log('.env.local file found. Checking if Supabase is set up...');
      
      // Check if Supabase is already set up
      const setupSupabase = await askConfirmation('Would you like to set up or update Supabase locally?');
      
      if (setupSupabase) {
        await runNpmScript('setup:supabase');
      }
    }
    
    // Check if database needs to be set up
    const setupDb = await askConfirmation('Would you like to set up or verify the database?');
    
    if (setupDb) {
      // Run database setup script
      await runNpmScript('setup-db');
      
      // Verify database setup
      await runNpmScript('verify-db');
    }
    
    // Ask if user wants to start the development server
    const startDev = await askConfirmation('Would you like to start the development server?');
    
    if (startDev) {
      console.log('Starting development server with browser preview...');
      
      // Run development server with browser preview
      await runNpmScript('dev:preview');
    } else {
      console.log('Setup completed. You can start the development server later with:');
      console.log('npm run dev:preview');
    }
    
    rl.close();
  } catch (error) {
    console.error('Error setting up local development environment:', error);
    rl.close();
    process.exit(1);
  }
}

// Run the setup
setupLocalDev(); 