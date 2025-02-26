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

// Function to log with colors that works in all environments
function colorLog(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

colorLog(colors.cyan, '=== PMU Profit System Build Error Checker ===\n');

// Common build errors and their solutions
const commonErrors = [
  {
    pattern: /Invalid src prop.*hostname "([^"]+)" is not configured/i,
    check: (content) => {
      const match = content.match(/Invalid src prop.*hostname "([^"]+)" is not configured/i);
      if (match) {
        return {
          found: true,
          domain: match[1],
          message: `Image domain "${match[1]}" is not configured in next.config.js`
        };
      }
      return { found: false };
    },
    fix: (domain) => {
      // Read next.config.js
      const nextConfigPath = path.join(process.cwd(), 'next.config.js');
      let nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
      
      // Extract the current domains array
      const domainsMatch = nextConfigContent.match(/domains:\s*\[(.*?)\]/s);
      if (!domainsMatch) {
        colorLog(colors.red, 'Error: Could not find domains array in next.config.js');
        return false;
      }
      
      const currentDomainsString = domainsMatch[1];
      const currentDomains = currentDomainsString
        .split(',')
        .map(d => d.trim().replace(/['"]/g, ''))
        .filter(Boolean);
      
      // Check if the domain is already in the list
      if (currentDomains.includes(domain)) {
        colorLog(colors.yellow, `Domain "${domain}" is already configured in next.config.js`);
        return true;
      }
      
      // Add the domain to the list
      const newDomains = [...currentDomains, domain];
      const newDomainsString = newDomains.map(d => `'${d}'`).join(', ');
      
      // Update the next.config.js file
      const updatedContent = nextConfigContent.replace(
        /domains:\s*\[(.*?)\]/s,
        `domains: [${newDomainsString}]`
      );
      
      fs.writeFileSync(nextConfigPath, updatedContent, 'utf8');
      colorLog(colors.green, `Added domain "${domain}" to next.config.js`);
      return true;
    }
  },
  {
    pattern: /Error: No ESLint configuration found/i,
    check: (content) => {
      return {
        found: content.includes('Error: No ESLint configuration found'),
        message: 'ESLint configuration is missing'
      };
    },
    fix: () => {
      // Create a basic ESLint config
      const eslintConfigPath = path.join(process.cwd(), '.eslintrc.json');
      const eslintConfig = {
        "extends": "next/core-web-vitals"
      };
      
      fs.writeFileSync(eslintConfigPath, JSON.stringify(eslintConfig, null, 2), 'utf8');
      colorLog(colors.green, 'Created basic ESLint configuration');
      return true;
    }
  },
  {
    pattern: /You're importing a component that needs useState/i,
    check: (content) => {
      const match = content.match(/You're importing a component that needs (useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef|useImperativeHandle|useLayoutEffect|useDebugValue).*in "([^"]+)"/i);
      if (match) {
        return {
          found: true,
          hook: match[1],
          file: match[2],
          message: `Component in "${match[2]}" is using ${match[1]} but is not marked as a client component`
        };
      }
      return { found: false };
    },
    fix: (_, data) => {
      if (!data || !data.file) {
        colorLog(colors.red, 'Error: Could not determine file path');
        return false;
      }
      
      // Get the file path
      const filePath = path.join(process.cwd(), data.file);
      
      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        colorLog(colors.red, `Error: File "${filePath}" does not exist`);
        return false;
      }
      
      // Read the file content
      let fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Check if 'use client' is already at the top
      if (fileContent.trim().startsWith("'use client'") || fileContent.trim().startsWith('"use client"')) {
        colorLog(colors.yellow, `File "${data.file}" already has 'use client' directive`);
        return true;
      }
      
      // Add 'use client' at the top
      fileContent = `'use client';\n\n${fileContent}`;
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, fileContent, 'utf8');
      colorLog(colors.green, `Added 'use client' directive to "${data.file}"`);
      return true;
    }
  },
  {
    pattern: /Module not found: Can't resolve/i,
    check: (content) => {
      const match = content.match(/Module not found: Can't resolve '([^']+)'/i);
      if (match) {
        return {
          found: true,
          module: match[1],
          message: `Module "${match[1]}" is missing`
        };
      }
      return { found: false };
    },
    fix: (module) => {
      // Check if it's a common package
      const commonPackages = {
        'react': 'react',
        'react-dom': 'react-dom',
        'next': 'next',
        '@/components': false, // Path issue, not a package
        '@/lib': false, // Path issue, not a package
        '@/utils': false, // Path issue, not a package
        '@/styles': false, // Path issue, not a package
        '@/context': false, // Path issue, not a package
      };
      
      if (module in commonPackages) {
        if (commonPackages[module]) {
          // It's a package, install it
          colorLog(colors.blue, `Installing package "${module}"...`);
          try {
            execSync(`npm install ${commonPackages[module]}`, { stdio: 'inherit' });
            colorLog(colors.green, `Installed package "${module}"`);
            return true;
          } catch (error) {
            colorLog(colors.red, `Error installing package "${module}": ${error.message}`);
            return false;
          }
        } else {
          // It's a path issue
          colorLog(colors.yellow, `"${module}" is a path issue, not a package. Check your import paths.`);
          return false;
        }
      } else {
        // Unknown package
        colorLog(colors.yellow, `Unknown module "${module}". You may need to install it manually.`);
        return false;
      }
    }
  },
  {
    pattern: /TypeScript error/i,
    check: (content) => {
      const match = content.match(/TypeScript error in ([^:]+):([\d]+):([\d]+)/i);
      if (match) {
        return {
          found: true,
          file: match[1],
          line: match[2],
          column: match[3],
          message: `TypeScript error in ${match[1]} at line ${match[2]}, column ${match[3]}`
        };
      }
      return { found: false };
    },
    fix: () => {
      // TypeScript errors are too varied to fix automatically
      colorLog(colors.yellow, 'TypeScript errors need to be fixed manually. Check the error message for details.');
      return false;
    }
  }
];

// Function to check for errors in the build output
function checkBuildOutput() {
  try {
    // Run a dry build and capture the output
    colorLog(colors.blue, 'Running a dry build to check for errors...');
    
    try {
      execSync('npm run build', { stdio: 'pipe' });
      colorLog(colors.green, 'Build completed successfully! No errors found.');
      return;
    } catch (error) {
      const buildOutput = error.stdout.toString() + error.stderr.toString();
      
      // Check for known errors
      let foundErrors = false;
      
      for (const errorType of commonErrors) {
        if (errorType.pattern.test(buildOutput)) {
          foundErrors = true;
          
          const checkResult = errorType.check(buildOutput);
          if (checkResult.found) {
            colorLog(colors.red, `Found error: ${checkResult.message}`);
            
            // Try to fix the error
            const fixParam = checkResult.domain || checkResult.module || checkResult.file;
            const fixResult = errorType.fix(fixParam, checkResult);
            
            if (fixResult) {
              colorLog(colors.green, 'Error fixed! You should be able to build now.');
            } else {
              colorLog(colors.yellow, 'Could not automatically fix the error. Manual intervention required.');
            }
          }
        }
      }
      
      if (!foundErrors) {
        colorLog(colors.yellow, 'Unknown build error. Please check the build output for details:');
        console.log(buildOutput);
      }
    }
  } catch (error) {
    colorLog(colors.red, `Error running build check: ${error.message}`);
  }
}

// Run the check
checkBuildOutput();

colorLog(colors.cyan, '\n=== Build Error Check Complete ===');
colorLog(colors.cyan, 'Run this script anytime you encounter build errors.');
colorLog(colors.cyan, 'You can add it to your package.json scripts: "check-errors": "node scripts/check-build-errors.js"'); 