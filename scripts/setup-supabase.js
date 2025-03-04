const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if Supabase CLI is installed
function checkSupabaseCLI() {
  return new Promise((resolve) => {
    exec('supabase --version', (error, stdout) => {
      if (error) {
        console.log('Supabase CLI is not installed or not in PATH.');
        console.log('Installing Supabase CLI...');
        resolve(false);
      } else {
        console.log(`Supabase CLI is installed: ${stdout.trim()}`);
        resolve(true);
      }
    });
  });
}

// Install Supabase CLI if not installed
async function installSupabaseCLI() {
  return new Promise((resolve, reject) => {
    let installCommand;
    
    if (process.platform === 'darwin') {
      // macOS - use Homebrew
      installCommand = 'brew install supabase/tap/supabase';
    } else if (process.platform === 'win32') {
      // Windows - use npm
      installCommand = 'npm install -g supabase';
    } else {
      // Linux - use npm
      installCommand = 'npm install -g supabase';
    }
    
    console.log(`Running: ${installCommand}`);
    
    const installProcess = spawn(installCommand, { shell: true, stdio: 'inherit' });
    
    installProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Supabase CLI installed successfully.');
        resolve(true);
      } else {
        console.error(`Failed to install Supabase CLI. Exit code: ${code}`);
        console.log('Please install Supabase CLI manually:');
        console.log('- macOS: brew install supabase/tap/supabase');
        console.log('- Windows/Linux: npm install -g supabase');
        reject(new Error('Failed to install Supabase CLI'));
      }
    });
  });
}

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

// Initialize Supabase project
function initializeSupabase() {
  return new Promise((resolve, reject) => {
    // Check if supabase folder already exists
    if (fs.existsSync(path.join(process.cwd(), 'supabase'))) {
      console.log('Supabase project already initialized.');
      resolve(true);
      return;
    }
    
    console.log('Initializing Supabase project...');
    
    const initProcess = spawn('supabase', ['init'], { shell: true, stdio: 'inherit' });
    
    initProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Supabase project initialized successfully.');
        resolve(true);
      } else {
        console.error(`Failed to initialize Supabase project. Exit code: ${code}`);
        reject(new Error('Failed to initialize Supabase project'));
      }
    });
  });
}

// Start Supabase local development
function startSupabase() {
  return new Promise((resolve, reject) => {
    console.log('Starting Supabase local development...');
    
    const startProcess = spawn('supabase', ['start'], { shell: true, stdio: 'inherit' });
    
    startProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Supabase local development started successfully.');
        resolve(true);
      } else {
        console.error(`Failed to start Supabase local development. Exit code: ${code}`);
        reject(new Error('Failed to start Supabase local development'));
      }
    });
  });
}

// Create .env.local file with Supabase credentials
function createEnvFile(supabaseUrl, supabaseAnonKey, supabaseServiceKey) {
  return new Promise((resolve, reject) => {
    const envPath = path.join(process.cwd(), '.env.local');
    
    // Check if .env.local already exists
    if (fs.existsSync(envPath)) {
      console.log('.env.local file already exists. Updating Supabase credentials...');
      
      // Read existing .env.local file
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update or add Supabase credentials
      let updatedContent = envContent;
      
      if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
        updatedContent = updatedContent.replace(/NEXT_PUBLIC_SUPABASE_URL=.*/, `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`);
      } else {
        updatedContent += `\nNEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`;
      }
      
      if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        updatedContent = updatedContent.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`);
      } else {
        updatedContent += `\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`;
      }
      
      if (envContent.includes('SUPABASE_SERVICE_ROLE_KEY=')) {
        updatedContent = updatedContent.replace(/SUPABASE_SERVICE_ROLE_KEY=.*/, `SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}`);
      } else {
        updatedContent += `\nSUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}`;
      }
      
      // Write updated content back to .env.local
      fs.writeFileSync(envPath, updatedContent);
    } else {
      // Create new .env.local file
      const envContent = `# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# Add other environment variables below
`;
      
      fs.writeFileSync(envPath, envContent);
    }
    
    console.log('.env.local file created/updated with Supabase credentials.');
    resolve(true);
  });
}

// Main function
async function setupSupabase() {
  try {
    console.log('Setting up Supabase for local development...');
    
    // Check if Docker is installed and running
    const dockerRunning = await checkDocker();
    if (!dockerRunning) {
      console.log('Please install and start Docker, then run this script again.');
      process.exit(1);
    }
    
    // Check if Supabase CLI is installed
    const cliInstalled = await checkSupabaseCLI();
    if (!cliInstalled) {
      await installSupabaseCLI();
    }
    
    // Initialize Supabase project
    await initializeSupabase();
    
    // Start Supabase local development
    await startSupabase();
    
    // Ask user to input Supabase credentials
    console.log('\nPlease enter your Supabase credentials from the output above:');
    
    rl.question('Supabase URL (e.g., http://localhost:54321): ', (supabaseUrl) => {
      rl.question('Supabase Anon Key: ', (supabaseAnonKey) => {
        rl.question('Supabase Service Role Key: ', async (supabaseServiceKey) => {
          // Create .env.local file with Supabase credentials
          await createEnvFile(supabaseUrl, supabaseAnonKey, supabaseServiceKey);
          
          console.log('\nSupabase setup completed successfully!');
          console.log('You can now run the application with:');
          console.log('npm run dev:preview');
          
          rl.close();
        });
      });
    });
  } catch (error) {
    console.error('Error setting up Supabase:', error);
    process.exit(1);
  }
}

// Run the setup
setupSupabase(); 