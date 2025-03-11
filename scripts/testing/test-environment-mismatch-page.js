/**
 * Environment Mismatch Page Test
 * 
 * This test verifies that the environment mismatch page correctly displays
 * when a user tries to access the system from a different environment than
 * where their account was created.
 * 
 * Test Coverage:
 * - Verifies the environment mismatch page loads correctly with proper parameters
 * - Checks that the page displays the correct user environment and current environment
 * - Tests the "Back to Login" button functionality
 * 
 * Usage:
 * node scripts/testing/test-environment-mismatch-page.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://pmuprofitsystem.com' 
  : 'http://localhost:3000';
const WAIT_TIMEOUT = 10000; // 10 seconds
const SCREENSHOT_DIR = path.join(__dirname, 'browser-test-output');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

/**
 * Main test function
 */
async function runTest() {
  console.log(`\n=== Environment Mismatch Page Test ===`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Base URL: ${BASE_URL}`);
  
  let browser;
  let testUsers = [];
  
  try {
    // Initialize Supabase client for test data setup
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Create test user with production environment
    console.log('Setting up test data...');
    const testUserEmail = `test-prod-user-${Date.now()}@example.com`;
    const password = 'Password123!';
    
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: password,
      email_confirm: true,
      app_metadata: {
        environment: 'production', // Always create as production user for testing mismatch
        environment_updated_at: new Date().toISOString()
      }
    });
    
    if (error) {
      console.error('Error creating test user:', error);
      return;
    }
    
    console.log(`Test user created: ${testUserEmail} (ID: ${user.user.id})`);
    testUsers.push(user.user.id);
    
    // Launch browser
    console.log('\nLaunching browser for testing...');
    browser = await puppeteer.launch({ 
      headless: process.env.HEADLESS !== 'false', // Set HEADLESS=false to see the browser
      args: ['--window-size=1280,800'],
      defaultViewport: null
    });
    
    // Run test scenarios
    await testDirectNavigation(browser);
    await testLoginRedirect(browser, testUserEmail, password);
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
    // Take error screenshot if browser is available
    if (browser) {
      const pages = await browser.pages();
      if (pages.length > 0) {
        await pages[0].screenshot({ 
          path: path.join(SCREENSHOT_DIR, 'error-screenshot.png'),
          fullPage: true 
        });
        console.log('Error screenshot saved to error-screenshot.png');
      }
    }
  } finally {
    // Cleanup
    console.log('\nCleaning up...');
    
    // Close browser
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
    
    // Clean up test users if needed
    if (testUsers.length > 0) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      for (const userId of testUsers) {
        try {
          await supabase.auth.admin.deleteUser(userId);
          console.log(`Deleted test user: ${userId}`);
        } catch (error) {
          console.error(`Failed to delete test user ${userId}:`, error);
        }
      }
    }
  }
}

/**
 * Test direct navigation to the environment mismatch page with URL parameters
 */
async function testDirectNavigation(browser) {
  console.log('\n--- Test Scenario 1: Direct Navigation to Environment Mismatch Page ---');
  const page = await browser.newPage();
  
  try {
    // Enable console logging from the browser
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Step 1: Navigate directly to the environment mismatch page with parameters
    console.log('1. Navigating to environment mismatch page with parameters...');
    const errorMessage = encodeURIComponent('This account was created in the Production environment and cannot be accessed from the Local Development environment.');
    await page.goto(`${BASE_URL}/auth/environment-mismatch?userEnv=production&currentEnv=local&error=${errorMessage}`, { 
      waitUntil: 'networkidle2' 
    });
    
    // Take a screenshot
    await takeScreenshot(page, 'direct-navigation');
    
    // Step 2: Verify page content
    console.log('2. Verifying page content...');
    
    // Check page title
    const pageTitle = await page.evaluate(() => {
      const titleElement = document.querySelector('h1');
      return titleElement ? titleElement.textContent.trim() : null;
    });
    
    console.log(`Page title: ${pageTitle}`);
    if (pageTitle && pageTitle.includes('Environment Mismatch')) {
      console.log('✅ Page title is correct');
    } else {
      console.log('❌ Page title is incorrect or missing');
      throw new Error('Page title verification failed');
    }
    
    // Check environment information
    const environments = await page.evaluate(() => {
      const userEnvElement = document.querySelector('[data-test="user-environment"]');
      const currentEnvElement = document.querySelector('[data-test="current-environment"]');
      
      return {
        userEnv: userEnvElement ? userEnvElement.textContent.trim() : null,
        currentEnv: currentEnvElement ? currentEnvElement.textContent.trim() : null
      };
    });
    
    console.log(`User environment: ${environments.userEnv}`);
    console.log(`Current environment: ${environments.currentEnv}`);
    
    if (environments.userEnv && environments.userEnv.includes('Production')) {
      console.log('✅ User environment is correctly displayed');
    } else {
      console.log('❌ User environment is incorrect or missing');
    }
    
    if (environments.currentEnv && environments.currentEnv.includes('Local')) {
      console.log('✅ Current environment is correctly displayed');
    } else {
      console.log('❌ Current environment is incorrect or missing');
    }
    
    // Step 3: Test "Back to Login" button
    console.log('3. Testing "Back to Login" button...');
    
    // Find and click the button
    await page.click('a[href="/login"]');
    
    // Wait for navigation
    try {
      await page.waitForNavigation({ timeout: WAIT_TIMEOUT });
      console.log('Navigation completed');
    } catch (error) {
      console.log('Navigation timeout - checking current URL');
    }
    
    // Take a screenshot
    await takeScreenshot(page, 'after-back-to-login');
    
    // Verify we're on the login page
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('✅ Successfully navigated to login page');
    } else {
      console.log(`❌ Failed to navigate to login page, current URL: ${currentUrl}`);
      throw new Error('Navigation to login page failed');
    }
    
  } catch (error) {
    console.error('Direct navigation test failed:', error);
    throw error; // Re-throw to be caught by the main function
  } finally {
    // Close the page
    await page.close();
  }
}

/**
 * Test login redirect to environment mismatch page
 */
async function testLoginRedirect(browser, email, password) {
  console.log('\n--- Test Scenario 2: Login Redirect to Environment Mismatch Page ---');
  const page = await browser.newPage();
  
  try {
    // Enable console logging from the browser
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Step 1: Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Take a screenshot
    await takeScreenshot(page, 'login-page');
    
    // Step 2: Fill login form
    console.log('2. Filling login form...');
    await page.waitForSelector('input[name="email"]');
    await page.waitForSelector('input[name="password"]');
    
    // Fill form using evaluate for better performance
    await page.evaluate((email, password) => {
      document.querySelector('input[name="email"]').value = email;
      document.querySelector('input[name="password"]').value = password;
    }, email, password);
    
    await takeScreenshot(page, 'login-form-filled');
    
    // Step 3: Submit form
    console.log('3. Submitting login form...');
    await page.evaluate(() => {
      document.querySelector('form').submit();
    });
    
    // Wait for navigation
    try {
      await page.waitForNavigation({ timeout: WAIT_TIMEOUT });
      console.log('Navigation completed');
    } catch (error) {
      console.log('Navigation timeout - checking current URL');
    }
    
    // Take a screenshot
    await takeScreenshot(page, 'after-login-submit');
    
    // Step 4: Verify redirect to environment mismatch page
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    if (currentUrl.includes('/auth/environment-mismatch')) {
      console.log('✅ Successfully redirected to environment mismatch page');
      
      // Verify URL parameters
      const urlParams = new URL(currentUrl).searchParams;
      const userEnv = urlParams.get('userEnv');
      const currentEnv = urlParams.get('currentEnv');
      
      console.log(`URL parameters: userEnv=${userEnv}, currentEnv=${currentEnv}`);
      
      if (userEnv === 'production') {
        console.log('✅ User environment parameter is correct');
      } else {
        console.log('❌ User environment parameter is incorrect or missing');
      }
      
      if (currentEnv === 'local') {
        console.log('✅ Current environment parameter is correct');
      } else {
        console.log('❌ Current environment parameter is incorrect or missing');
      }
    } else {
      console.log(`❌ Not redirected to environment mismatch page, current URL: ${currentUrl}`);
      throw new Error('Redirect to environment mismatch page failed');
    }
    
  } catch (error) {
    console.error('Login redirect test failed:', error);
    throw error; // Re-throw to be caught by the main function
  } finally {
    // Close the page
    await page.close();
  }
}

/**
 * Helper function to take and save screenshots
 */
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOT_DIR, `env-mismatch-${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

// Run the test
runTest().catch(error => {
  console.error('Unhandled error in test:', error);
  process.exit(1);
}); 