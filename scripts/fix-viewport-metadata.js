const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { execSync } = require('child_process');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Default viewport configuration
const defaultViewport = `export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};
`;

// Get a list of all pages with viewport warnings from the Next.js output
function getPagesWithViewportWarnings() {
  try {
    // Run next dev with --no-open to get the warnings
    const output = execSync('npx next dev --no-open', { 
      timeout: 10000, 
      stdio: 'pipe',
      killSignal: 'SIGTERM'
    }).toString();
    
    // Extract page paths from warnings
    const warnings = output.match(/configured in metadata export in \/([^.]+)/g);
    if (!warnings) return [];
    
    return warnings.map(warning => {
      const match = warning.match(/configured in metadata export in \/([^.]+)/);
      return match ? match[1] : null;
    }).filter(Boolean);
  } catch (error) {
    // Extract warnings from the error output
    if (error.stdout) {
      const warnings = error.stdout.toString().match(/configured in metadata export in \/([^.]+)/g);
      if (!warnings) return [];
      
      return warnings.map(warning => {
        const match = warning.match(/configured in metadata export in \/([^.]+)/);
        return match ? match[1] : null;
      }).filter(Boolean);
    }
    console.error('Error getting viewport warnings:', error.message);
    return [];
  }
}

async function findTsxFiles(dir, fileList = []) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);
    
    if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      await findTsxFiles(filePath, fileList);
    } else if (file === 'page.tsx' || file === 'layout.tsx') {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function fixViewportMetadata(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Check if file has metadata with viewport
    if (content.includes('export const metadata') && 
        (content.includes('viewport:') || content.includes('viewport-fit') || content.includes('initial-scale'))) {
      console.log(`Fixing viewport in ${filePath}`);
      
      // Check if viewport export already exists
      const hasViewportExport = content.includes('export const viewport');
      
      // Remove viewport from metadata
      let newContent = content;
      
      // Fix viewport in metadata object
      newContent = newContent.replace(/(\s*viewport:.*?,)|(,\s*viewport:.*?(?=\n\s*[},]))|(viewport:.*?(?=\n\s*[},]))/g, '');
      
      // Fix viewport in description that might have been incorrectly added
      newContent = newContent.replace(/(description:.*?['"]),\s*initial-scale=[^,}]+/g, '$1');
      newContent = newContent.replace(/(description:.*?['"]),\s*viewport-fit=[^,}]+/g, '$1');
      
      // Add viewport export if it doesn't exist
      if (!hasViewportExport) {
        // Find the end of the metadata export
        const metadataEndIndex = newContent.indexOf('export const metadata') + 
          newContent.substring(newContent.indexOf('export const metadata')).indexOf('};') + 2;
        
        // Insert viewport export after metadata
        newContent = newContent.substring(0, metadataEndIndex) + '\n\n' + defaultViewport + newContent.substring(metadataEndIndex);
      }
      
      // Write the updated content back to the file
      await writeFile(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

async function main() {
  try {
    console.log('Finding page files...');
    const appDir = path.join(process.cwd(), 'src', 'app');
    const files = await findTsxFiles(appDir);
    
    console.log(`Found ${files.length} page files to check.`);
    
    let fixedCount = 0;
    for (const file of files) {
      const fixed = await fixViewportMetadata(file);
      if (fixed) fixedCount++;
    }
    
    console.log(`Fixed viewport metadata in ${fixedCount} files.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 