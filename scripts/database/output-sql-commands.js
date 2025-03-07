/**
 * Output SQL Commands Script
 * 
 * This script reads the SQL commands from setup-database-schema.sql
 * and outputs them to a file that we can copy and paste into the Supabase SQL editor.
 * 
 * Usage: node scripts/database/output-sql-commands.js
 */

const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlFilePath = path.join(__dirname, '..', 'sql', 'setup-database-schema.sql');
const sqlCommands = fs.readFileSync(sqlFilePath, 'utf8');

// Write the SQL commands to a file
const outputFilePath = path.join(__dirname, '..', 'sql', 'sql-commands.sql');
fs.writeFileSync(outputFilePath, sqlCommands);

console.log(`SQL commands written to ${outputFilePath}`);
console.log('Copy and paste these commands into the Supabase SQL editor to execute them.'); 