/**
 * Install Test Dependencies
 * 
 * This script installs the dependencies needed for the authentication flow tests.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Log output
console.log('Installing test dependencies...');

// Create a log file for the installation
const logFile = path.join(__dirname, 'install-deps.log');
fs.writeFileSync(logFile, `Installing test dependencies - ${new Date().toISOString()}\n\n`);

try {
  // Install node-fetch for HTTP requests
  console.log('Installing node-fetch...');
  execSync('npm install --save-dev node-fetch@2', { stdio: 'inherit' });
  fs.appendFileSync(logFile, 'Installed node-fetch\n');

  // Install puppeteer for browser testing
  console.log('Installing puppeteer...');
  execSync('npm install --save-dev puppeteer', { stdio: 'inherit' });
  fs.appendFileSync(logFile, 'Installed puppeteer\n');

  console.log('All dependencies installed successfully!');
  fs.appendFileSync(logFile, 'All dependencies installed successfully!\n');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
  fs.appendFileSync(logFile, `Error installing dependencies: ${error.message}\n`);
  process.exit(1);
} 