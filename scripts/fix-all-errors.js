const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper function to run a command and log the output
function runCommand(command, description) {
  console.log(`\n=== ${description} ===`);
  try {
    const output = execSync(command, { stdio: 'inherit' });
    console.log(`✓ ${description} completed successfully!`);
    return true;
  } catch (error) {
    console.error(`✗ ${description} failed: ${error.message}`);
    return false;
  }
}

// Check if a package is installed
function isPackageInstalled(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch (e) {
    return false;
  }
}

// Install required packages
function installRequiredPackages() {
  const requiredPackages = ['dotenv', '@supabase/supabase-js'];
  const packagesToInstall = requiredPackages.filter(pkg => !isPackageInstalled(pkg));
  
  if (packagesToInstall.length > 0) {
    console.log(`\n=== Installing required packages: ${packagesToInstall.join(', ')} ===`);
    try {
      execSync(`npm install --save-dev ${packagesToInstall.join(' ')}`, { stdio: 'inherit' });
      console.log('✓ Packages installed successfully!');
    } catch (error) {
      console.error(`✗ Failed to install packages: ${error.message}`);
      console.log('Continuing with the script, but some fixes may not work.');
    }
  }
}

// Main function to run all fixes
async function main() {
  console.log('\n=== PMU Profit System Error Fix Script ===');
  console.log('This script will fix common errors in the project.');
  
  // Install required packages
  installRequiredPackages();
  
  // Fix viewport metadata issues
  runCommand('node scripts/fix-viewport-metadata.js', 'Fixing viewport metadata issues');
  
  // Fix Supabase configuration
  runCommand('node scripts/fix-supabase-config.js', 'Fixing Supabase configuration');
  
  // Run the development server to check for remaining issues
  console.log('\n=== Running development server to check for remaining issues ===');
  console.log('This will start the development server briefly to check for errors.');
  console.log('The server will be stopped automatically after a few seconds.');
  
  try {
    execSync('npx next dev --no-open', { 
      timeout: 10000, 
      stdio: 'pipe',
      killSignal: 'SIGTERM'
    });
  } catch (error) {
    // This is expected to fail due to the timeout
    const output = error.stdout ? error.stdout.toString() : '';
    
    // Check for remaining errors
    const viewportWarnings = (output.match(/configured in metadata export in/g) || []).length;
    const searchParamsWarnings = (output.match(/useSearchParams\(\) should be wrapped in a suspense boundary/g) || []).length;
    const configWarnings = (output.match(/Invalid next\.config\.js options detected/g) || []).length;
    const supabaseErrors = (output.match(/relation "public\._supabase_config" does not exist/g) || []).length;
    
    console.log('\n=== Remaining Issues ===');
    console.log(`Viewport warnings: ${viewportWarnings}`);
    console.log(`useSearchParams warnings: ${searchParamsWarnings}`);
    console.log(`Next.js config warnings: ${configWarnings}`);
    console.log(`Supabase config errors: ${supabaseErrors}`);
    
    if (viewportWarnings === 0 && searchParamsWarnings === 0 && configWarnings === 0 && supabaseErrors === 0) {
      console.log('\n✓ All issues have been fixed!');
    } else {
      console.log('\n⚠ Some issues remain. You may need to fix them manually.');
    }
  }
  
  console.log('\n=== Fix Script Complete ===');
  console.log('You can now run the development server with:');
  console.log('npm run dev');
}

main(); 