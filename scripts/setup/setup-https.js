const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Check if mkcert is installed
function checkMkcert() {
  try {
    execSync('mkcert -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Install mkcert based on the operating system
function installMkcert() {
  const platform = os.platform();
  
  console.log('Installing mkcert...');
  
  try {
    if (platform === 'darwin') {
      // macOS
      console.log('Detected macOS. Installing mkcert with Homebrew...');
      console.log('If this fails, please install Homebrew first: https://brew.sh/');
      execSync('brew install mkcert', { stdio: 'inherit' });
      execSync('brew install nss', { stdio: 'inherit' }); // For Firefox support
    } else if (platform === 'win32') {
      // Windows
      console.log('Detected Windows. Installing mkcert with Chocolatey...');
      console.log('If this fails, please install Chocolatey first: https://chocolatey.org/install');
      execSync('choco install mkcert', { stdio: 'inherit' });
    } else if (platform === 'linux') {
      // Linux
      console.log('Detected Linux. Please install mkcert manually:');
      console.log('For Ubuntu/Debian: sudo apt install libnss3-tools');
      console.log('Then download and install mkcert from: https://github.com/FiloSottile/mkcert');
      process.exit(1);
    } else {
      console.log(`Unsupported platform: ${platform}`);
      console.log('Please install mkcert manually: https://github.com/FiloSottile/mkcert');
      process.exit(1);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to install mkcert:', error.message);
    console.log('Please install mkcert manually: https://github.com/FiloSottile/mkcert');
    return false;
  }
}

// Setup mkcert and generate certificates
function setupMkcert() {
  try {
    console.log('Setting up mkcert...');
    execSync('mkcert -install', { stdio: 'inherit' });
    
    console.log('Generating certificates for localhost...');
    execSync('mkcert localhost', { stdio: 'inherit' });
    
    // Check if certificates were created
    const rootDir = process.cwd();
    const keyPath = path.join(rootDir, 'localhost-key.pem');
    const certPath = path.join(rootDir, 'localhost.pem');
    
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      console.log('Certificates generated successfully!');
      console.log(`Key: ${keyPath}`);
      console.log(`Certificate: ${certPath}`);
      return true;
    } else {
      console.error('Certificates were not generated properly.');
      return false;
    }
  } catch (error) {
    console.error('Failed to setup mkcert:', error.message);
    return false;
  }
}

// Update .env.local to use HTTPS
function updateEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update NEXT_PUBLIC_SITE_URL to use HTTPS
      envContent = envContent.replace(
        /NEXT_PUBLIC_SITE_URL=http:\/\/localhost:3000/g,
        'NEXT_PUBLIC_SITE_URL=https://localhost:3000'
      );
      
      fs.writeFileSync(envPath, envContent);
      console.log('Updated .env.local to use HTTPS.');
    } else {
      console.log('.env.local file not found. Please make sure it exists and contains NEXT_PUBLIC_SITE_URL.');
    }
  } catch (error) {
    console.error('Failed to update .env.local:', error.message);
  }
}

// Main function
async function main() {
  console.log('Setting up HTTPS for local development...');
  
  // Check if mkcert is installed
  let mkcertInstalled = checkMkcert();
  
  if (!mkcertInstalled) {
    console.log('mkcert is not installed. Attempting to install...');
    mkcertInstalled = installMkcert();
    
    if (!mkcertInstalled) {
      console.error('Failed to install mkcert. Please install it manually.');
      process.exit(1);
    }
  }
  
  // Setup mkcert and generate certificates
  const setupSuccess = setupMkcert();
  
  if (!setupSuccess) {
    console.error('Failed to setup mkcert. Please try again or generate certificates manually.');
    process.exit(1);
  }
  
  // Update .env.local
  updateEnvFile();
  
  console.log('\nSetup complete! You can now run the application with HTTPS:');
  console.log('npm run dev:https');
  console.log('\nOr use the start-https.js script directly:');
  console.log('node start-https.js');
}

main().catch(error => {
  console.error('An error occurred:', error);
  process.exit(1);
}); 