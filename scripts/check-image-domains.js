const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Function to log with colors that works in all environments
function colorLog(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

colorLog(colors.cyan, '=== PMU Profit System Image Domain Checker ===\n');

// Read the next.config.js file
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
let nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');

// Extract the current domains array
const domainsMatch = nextConfigContent.match(/domains:\s*\[(.*?)\]/s);
if (!domainsMatch) {
  colorLog(colors.red, 'Error: Could not find domains array in next.config.js');
  process.exit(1);
}

const currentDomainsString = domainsMatch[1];
const currentDomains = currentDomainsString
  .split(',')
  .map(domain => domain.trim().replace(/['"]/g, ''))
  .filter(Boolean);

colorLog(colors.blue, 'Current allowed image domains:');
currentDomains.forEach(domain => {
  colorLog(colors.green, `✓ ${domain}`);
});

// Find all image URLs in the codebase using a cross-platform approach
colorLog(colors.blue, '\nSearching for image URLs in the codebase...');

// Function to recursively search for files
function findFiles(dir, extensions) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively search subdirectories, but skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next') {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else {
      // Check if the file has one of the specified extensions
      const ext = path.extname(file).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Find all TypeScript and JavaScript files
const srcDir = path.join(process.cwd(), 'src');
const fileExtensions = ['.tsx', '.ts', '.jsx', '.js'];
const files = findFiles(srcDir, fileExtensions);

colorLog(colors.blue, `Found ${files.length} files to scan`);

// Extract image URLs from files
let imageUrls = [];
const urlRegex = /src=["'](https?:\/\/[^/'"]+)[^"']*/g;

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    
    while ((match = urlRegex.exec(content)) !== null) {
      try {
        const url = new URL(match[1]);
        imageUrls.push(url.hostname);
      } catch (error) {
        // Invalid URL, skip
      }
    }
  } catch (error) {
    colorLog(colors.yellow, `Error reading file ${file}: ${error.message}`);
  }
});

// Remove duplicates
imageUrls = [...new Set(imageUrls)];

// Check which domains are not in the config
const missingDomains = imageUrls.filter(domain => !currentDomains.includes(domain));

if (missingDomains.length === 0) {
  colorLog(colors.green, 'All image domains are already configured in next.config.js');
} else {
  colorLog(colors.yellow, `\nFound ${missingDomains.length} missing image domains:`);
  missingDomains.forEach(domain => {
    colorLog(colors.yellow, `! ${domain}`);
  });
  
  // Update the next.config.js file
  colorLog(colors.blue, '\nUpdating next.config.js...');
  
  const newDomains = [...currentDomains, ...missingDomains];
  const newDomainsString = newDomains.map(domain => `'${domain}'`).join(', ');
  
  const updatedContent = nextConfigContent.replace(
    /domains:\s*\[(.*?)\]/s,
    `domains: [${newDomainsString}]`
  );
  
  fs.writeFileSync(nextConfigPath, updatedContent, 'utf8');
  
  colorLog(colors.green, 'Successfully updated next.config.js with new image domains:');
  newDomains.forEach(domain => {
    const isNew = missingDomains.includes(domain);
    colorLog(isNew ? colors.green : colors.blue, `${isNew ? '+ ' : '✓ '}${domain}`);
  });
}

colorLog(colors.cyan, '\n=== Image Domain Check Complete ===');
colorLog(colors.cyan, 'Run this script anytime you add new external image sources to your project.');
colorLog(colors.cyan, 'You can add it to your build process with: "prebuild": "node scripts/check-image-domains.js"'); 