const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create certificates directory if it doesn't exist
const certDir = path.join(__dirname, 'certificates');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

console.log('Generating self-signed certificates for local HTTPS development...');

try {
  // Check if mkcert is installed
  try {
    execSync('mkcert -version', { stdio: 'ignore' });
    console.log('mkcert is already installed.');
  } catch (error) {
    console.log('mkcert is not installed. Please install it first:');
    console.log('- Windows (with Chocolatey): choco install mkcert');
    console.log('- macOS (with Homebrew): brew install mkcert');
    console.log('- Linux: Follow instructions at https://github.com/FiloSottile/mkcert');
    process.exit(1);
  }

  // Generate certificates
  execSync('mkcert -install', { stdio: 'inherit' });
  execSync(`mkcert -key-file ${path.join(certDir, 'localhost-key.pem')} -cert-file ${path.join(certDir, 'localhost.pem')} localhost 127.0.0.1 ::1`, { stdio: 'inherit' });

  console.log('Certificates generated successfully!');
  console.log(`Certificates saved to: ${certDir}`);
  console.log('You can now run your Next.js app with HTTPS using: node server.js');
} catch (error) {
  console.error('Error generating certificates:', error.message);
  process.exit(1);
} 