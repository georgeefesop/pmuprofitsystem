#!/usr/bin/env node

/**
 * Custom build script for Vercel deployments
 * This script ensures that diagnostic pages are excluded from production builds
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Determine if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

console.log(`Running Vercel build script in ${isProduction ? 'production' : 'development'} mode`);

// In production, we'll temporarily rename the diagnostics directory to prevent it from being built
if (isProduction) {
  const diagnosticsDir = path.join(__dirname, '../src/app/diagnostics');
  const tempDir = path.join(__dirname, '../src/app/_diagnostics');
  
  // Check if the diagnostics directory exists
  if (fs.existsSync(diagnosticsDir)) {
    console.log('Temporarily disabling diagnostics page for production build...');
    
    try {
      // Rename the directory to prevent it from being included in the build
      fs.renameSync(diagnosticsDir, tempDir);
      console.log('Diagnostics page disabled for production build');
    } catch (error) {
      console.error('Error disabling diagnostics page:', error);
    }
  }
}

// Run the Next.js build command
try {
  console.log('Building Next.js application...');
  execSync('next build', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

// If we renamed the diagnostics directory, rename it back
if (isProduction) {
  const diagnosticsDir = path.join(__dirname, '../src/app/diagnostics');
  const tempDir = path.join(__dirname, '../src/app/_diagnostics');
  
  if (fs.existsSync(tempDir)) {
    console.log('Restoring diagnostics page...');
    
    try {
      fs.renameSync(tempDir, diagnosticsDir);
      console.log('Diagnostics page restored');
    } catch (error) {
      console.error('Error restoring diagnostics page:', error);
    }
  }
}

console.log('Build completed successfully'); 