const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

console.log(`${colors.cyan}=== PMU Profit System Project Check ===${colors.reset}\n`);

// Check if required files exist
const requiredFiles = [
  'package.json',
  'next.config.js',
  'tailwind.config.js',
  'postcss.config.js',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/globals.css',
];

console.log(`${colors.blue}Checking required files...${colors.reset}`);
let missingFiles = [];
requiredFiles.forEach(file => {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    missingFiles.push(file);
    console.log(`${colors.red}✗ Missing: ${file}${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Found: ${file}${colors.reset}`);
  }
});

if (missingFiles.length > 0) {
  console.log(`\n${colors.red}Error: Missing ${missingFiles.length} required files.${colors.reset}`);
} else {
  console.log(`\n${colors.green}All required files are present.${colors.reset}`);
}

// Check Node.js version
console.log(`\n${colors.blue}Checking Node.js version...${colors.reset}`);
const nodeVersion = process.version;
console.log(`Node.js version: ${nodeVersion}`);
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
if (majorVersion < 16) {
  console.log(`${colors.red}Warning: Node.js version ${nodeVersion} may be too old. Next.js 14 requires Node.js 16.14.0 or later.${colors.reset}`);
} else {
  console.log(`${colors.green}Node.js version is compatible.${colors.reset}`);
}

// Check package.json dependencies
console.log(`\n${colors.blue}Checking package.json dependencies...${colors.reset}`);
const packageJson = require(path.join(process.cwd(), 'package.json'));
const dependencies = packageJson.dependencies || {};
const devDependencies = packageJson.devDependencies || {};

const requiredDependencies = ['next', 'react', 'react-dom'];
const requiredDevDependencies = ['typescript', 'tailwindcss', 'postcss', 'autoprefixer'];

let missingDependencies = [];
requiredDependencies.forEach(dep => {
  if (!dependencies[dep]) {
    missingDependencies.push(dep);
    console.log(`${colors.red}✗ Missing dependency: ${dep}${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Found dependency: ${dep} (${dependencies[dep]})${colors.reset}`);
  }
});

let missingDevDependencies = [];
requiredDevDependencies.forEach(dep => {
  if (!devDependencies[dep]) {
    missingDevDependencies.push(dep);
    console.log(`${colors.red}✗ Missing dev dependency: ${dep}${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Found dev dependency: ${dep} (${devDependencies[dep]})${colors.reset}`);
  }
});

if (missingDependencies.length > 0 || missingDevDependencies.length > 0) {
  console.log(`\n${colors.red}Error: Missing dependencies.${colors.reset}`);
} else {
  console.log(`\n${colors.green}All required dependencies are present.${colors.reset}`);
}

// Check for port conflicts
console.log(`\n${colors.blue}Checking for port conflicts...${colors.reset}`);
try {
  const netstat = execSync('netstat -ano | findstr :3000').toString();
  if (netstat.includes('LISTENING')) {
    console.log(`${colors.yellow}Warning: Port 3000 is already in use. This might cause conflicts when starting the development server.${colors.reset}`);
    console.log(`${colors.yellow}Process details: ${netstat}${colors.reset}`);
  }
} catch (error) {
  // If the command fails, it means no process is using port 3000
  console.log(`${colors.green}Port 3000 is available.${colors.reset}`);
}

// Final summary
console.log(`\n${colors.cyan}=== Summary ===${colors.reset}`);
if (missingFiles.length > 0 || missingDependencies.length > 0 || missingDevDependencies.length > 0) {
  console.log(`${colors.red}There are issues that need to be addressed before running the project.${colors.reset}`);
} else {
  console.log(`${colors.green}The project structure looks good. You should be able to run the development server.${colors.reset}`);
  console.log(`${colors.green}Try running: npm run dev${colors.reset}`);
}

console.log(`\n${colors.cyan}=== End of Check ===${colors.reset}`); 