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
let nextConfigContent;

try {
  nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
} catch (error) {
  colorLog(colors.red, `Error reading next.config.js: ${error.message}`);
  // Create a basic next.config.js file if it doesn't exist
  nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    remotePatterns: [],
  },
};

module.exports = nextConfig;
`;
  fs.writeFileSync(nextConfigPath, nextConfigContent, 'utf8');
  colorLog(colors.green, 'Created a new next.config.js file with empty image domains configuration');
}

// Extract the current domains configuration
let currentDomains = [];
let hasDomainsArray = false;
let hasRemotePatterns = false;

// Check for domains array
const domainsMatch = nextConfigContent.match(/domains:\s*\[(.*?)\]/s);
if (domainsMatch) {
  hasDomainsArray = true;
  const currentDomainsString = domainsMatch[1];
  currentDomains = currentDomainsString
    .split(',')
    .map(domain => domain.trim().replace(/['"]/g, ''))
    .filter(Boolean);
}

// Check for remotePatterns array
const remotePatternsMatch = nextConfigContent.match(/remotePatterns:\s*\[(.*?)\]/s);
if (remotePatternsMatch) {
  hasRemotePatterns = true;
  // Extract hostnames from remotePatterns
  const remotePatterns = remotePatternsMatch[1];
  const hostnameMatches = remotePatterns.match(/hostname:\s*['"]([^'"]+)['"]/g);
  if (hostnameMatches) {
    hostnameMatches.forEach(match => {
      const hostname = match.match(/hostname:\s*['"]([^'"]+)['"]/)[1];
      if (!currentDomains.includes(hostname)) {
        currentDomains.push(hostname);
      }
    });
  }
}

if (!hasDomainsArray && !hasRemotePatterns) {
  colorLog(colors.yellow, 'Warning: Could not find domains or remotePatterns in next.config.js');
  colorLog(colors.yellow, 'Creating a new images configuration...');
  
  // Add images configuration to next.config.js
  if (nextConfigContent.includes('const nextConfig = {')) {
    nextConfigContent = nextConfigContent.replace(
      'const nextConfig = {',
      `const nextConfig = {
  images: {
    domains: [],
    remotePatterns: [],
  },`
    );
    fs.writeFileSync(nextConfigPath, nextConfigContent, 'utf8');
    colorLog(colors.green, 'Added images configuration to next.config.js');
  } else {
    colorLog(colors.red, 'Error: Could not find nextConfig object in next.config.js');
    process.exit(1);
  }
} else {
  colorLog(colors.blue, 'Current allowed image domains:');
  if (currentDomains.length === 0) {
    colorLog(colors.yellow, 'No domains configured yet');
  } else {
    currentDomains.forEach(domain => {
      colorLog(colors.green, `✓ ${domain}`);
    });
  }
}

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
  
  // Create new remotePatterns entries
  const newRemotePatterns = missingDomains.map(domain => {
    return `{
        protocol: 'https',
        hostname: '${domain}',
      }`;
  }).join(',\n      ');
  
  // Update domains array if it exists
  if (hasDomainsArray) {
    nextConfigContent = nextConfigContent.replace(
      /domains:\s*\[(.*?)\]/s,
      `domains: [${newDomainsString}]`
    );
  } else if (nextConfigContent.includes('images: {')) {
    // Add domains array if images config exists but no domains array
    nextConfigContent = nextConfigContent.replace(
      /images:\s*{/,
      `images: {\n    domains: [${newDomainsString}],`
    );
  }
  
  // Update remotePatterns if it exists
  if (hasRemotePatterns) {
    // Add new patterns to existing remotePatterns
    const existingPatterns = remotePatternsMatch[1];
    const lastBracketIndex = existingPatterns.lastIndexOf('}');
    
    if (lastBracketIndex !== -1) {
      const updatedPatterns = existingPatterns.substring(0, lastBracketIndex + 1) + 
        (existingPatterns.trim().endsWith('}') ? ',\n      ' : '') + 
        newRemotePatterns;
      
      nextConfigContent = nextConfigContent.replace(
        /remotePatterns:\s*\[(.*?)\]/s,
        `remotePatterns: [${updatedPatterns}]`
      );
    }
  } else if (nextConfigContent.includes('images: {')) {
    // Add remotePatterns if images config exists but no remotePatterns
    nextConfigContent = nextConfigContent.replace(
      /images:\s*{/,
      `images: {\n    remotePatterns: [\n      ${newRemotePatterns}\n    ],`
    );
  }
  
  fs.writeFileSync(nextConfigPath, nextConfigContent, 'utf8');
  
  colorLog(colors.green, 'Successfully updated next.config.js with new image domains:');
  newDomains.forEach(domain => {
    const isNew = missingDomains.includes(domain);
    colorLog(isNew ? colors.green : colors.blue, `${isNew ? '+ ' : '✓ '}${domain}`);
  });
}

colorLog(colors.cyan, '\n=== Image Domain Check Complete ===');
colorLog(colors.cyan, 'Run this script anytime you add new external image sources to your project.');
colorLog(colors.cyan, 'You can add it to your build process with: "prebuild": "node scripts/check-image-domains.js"'); 