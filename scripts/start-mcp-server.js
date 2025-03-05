const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the Supabase MCP Server directory
const mcpServerPath = path.join(__dirname, '..', 'supabase-mcp-server');

// Check if the MCP server directory exists
if (!fs.existsSync(mcpServerPath)) {
  console.error('Supabase MCP Server directory not found. Please run "git clone https://github.com/alexander-zuev/supabase-mcp-server.git" first.');
  process.exit(1);
}

// Check if the config file exists
const configPath = path.join(mcpServerPath, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('Config file not found. Please create a config.json file in the supabase-mcp-server directory.');
  process.exit(1);
}

console.log('Starting Supabase MCP Server...');

// Start the MCP server
const mcpServer = spawn('node', ['index.js'], {
  cwd: mcpServerPath,
  stdio: 'inherit',
  shell: true
});

// Handle server exit
mcpServer.on('close', (code) => {
  console.log(`Supabase MCP Server exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping Supabase MCP Server...');
  mcpServer.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stopping Supabase MCP Server...');
  mcpServer.kill('SIGTERM');
  process.exit(0);
}); 