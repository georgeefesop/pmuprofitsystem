const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Paths
const rootDir = path.join(__dirname, '..');
const certDir = path.join(rootDir, 'certificates');

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
  console.log('Setting up mkcert and generating certificates...');
  
  // Create certificates directory if it doesn't exist
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }
  
  try {
    // Install the local CA
    execSync('mkcert -install', { stdio: 'inherit' });
    
    // Generate certificates for localhost
    execSync(`mkcert -key-file "${path.join(certDir, 'localhost-key.pem')}" -cert-file "${path.join(certDir, 'localhost.pem')}" localhost 127.0.0.1 ::1`, { stdio: 'inherit' });
    
    console.log('\nCertificates generated successfully!');
    console.log(`Certificates saved to: ${certDir}`);
    return true;
  } catch (error) {
    console.error('Failed to setup mkcert:', error.message);
    return false;
  }
}

// Update .env.local file to use HTTPS
function updateEnvFile() {
  const envPath = path.join(rootDir, '.env.local');
  
  console.log('Updating .env.local file to use HTTPS...');
  
  try {
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update NEXT_PUBLIC_SITE_URL to use HTTPS
      if (envContent.includes('NEXT_PUBLIC_SITE_URL=http://localhost:3000')) {
        envContent = envContent.replace(
          'NEXT_PUBLIC_SITE_URL=http://localhost:3000',
          'NEXT_PUBLIC_SITE_URL=https://localhost:3000'
        );
        fs.writeFileSync(envPath, envContent);
        console.log('Updated NEXT_PUBLIC_SITE_URL to use HTTPS in .env.local');
      } else if (!envContent.includes('NEXT_PUBLIC_SITE_URL=https://localhost:3000')) {
        // Add the variable if it doesn't exist
        envContent += '\nNEXT_PUBLIC_SITE_URL=https://localhost:3000\n';
        fs.writeFileSync(envPath, envContent);
        console.log('Added NEXT_PUBLIC_SITE_URL with HTTPS to .env.local');
      } else {
        console.log('NEXT_PUBLIC_SITE_URL already using HTTPS in .env.local');
      }
    } else {
      // Create .env.local if it doesn't exist
      fs.writeFileSync(envPath, 'NEXT_PUBLIC_SITE_URL=https://localhost:3000\n');
      console.log('Created .env.local with HTTPS configuration');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to update .env.local:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('Setting up HTTPS for local development...\n');
  
  // Check if mkcert is installed
  let mkcertInstalled = checkMkcert();
  
  // Install mkcert if not installed
  if (!mkcertInstalled) {
    console.log('mkcert is not installed. Attempting to install...');
    mkcertInstalled = installMkcert();
    
    if (!mkcertInstalled) {
      console.error('\nFailed to install mkcert. Please install it manually and run this script again.');
      process.exit(1);
    }
  } else {
    console.log('mkcert is already installed.');
  }
  
  // Setup mkcert and generate certificates
  const certificatesGenerated = setupMkcert();
  
  if (!certificatesGenerated) {
    console.error('\nFailed to generate certificates. Please check the error and try again.');
    process.exit(1);
  }
  
  // Update .env.local file
  const envUpdated = updateEnvFile();
  
  if (!envUpdated) {
    console.error('\nFailed to update .env.local file. Please update it manually to use HTTPS.');
  }
  
  console.log('\nHTTPS setup completed successfully!');
  console.log('You can now run your Next.js app with HTTPS using: npm run dev:https');
}

// Run the main function
main().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
}); 