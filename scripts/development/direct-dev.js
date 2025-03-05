const { spawn } = require('child_process');

console.log('Starting Next.js development server directly...');

// Start the Next.js development server
const nextProcess = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true
});

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