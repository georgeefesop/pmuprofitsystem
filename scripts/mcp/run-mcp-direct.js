#!/usr/bin/env node
const { spawn } = require('child_process');

// Connection string for Supabase pooler
const connectionString = 'postgresql://postgres.pmuprofitsystem:Na1T9JIMg0ODMZKp@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';

console.log('Starting MCP server...');
console.log(`Connection string: ${connectionString.replace(/:[^:]*@/, ':****@')}`);

// Start the MCP server
const mcpProcess = spawn('npx', [
  '@modelcontextprotocol/server-postgres',
  connectionString,
  '--debug'
], {
  stdio: 'inherit',
  shell: true
});

mcpProcess.on('error', (err) => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});

console.log('MCP server started. Press Ctrl+C to stop.');
console.log('The server should be listening on port 8080.');
console.log('You can now use the MCP server with your AI assistant.');

process.on('SIGINT', () => {
  console.log('Stopping MCP server...');
  mcpProcess.kill();
  process.exit(0);
}); 