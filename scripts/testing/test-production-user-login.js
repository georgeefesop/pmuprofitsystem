/**
 * Production User Login Test
 * 
 * This test verifies the login flow for a production user and checks if the dashboard redirect works correctly.
 * 
 * Test Coverage:
 * - Tests login with a production user
 * - Verifies the redirect to dashboard happens correctly
 * - Logs all relevant authentication events and state changes
 * 
 * Usage:
 * node scripts/testing/test-production-user-login.js
 */

require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://pmuprofitsystem.com'; // Force production URL
const WAIT_TIMEOUT = 15000; // 15 seconds
const SCREENSHOT_DIR = path.join(__dirname, 'browser-test-output');

// Test user credentials
const TEST_EMAIL = 'george.efesopb@gmail.com';
const TEST_PASSWORD = 'Wheels99!';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

/**
 * Main test function
 */
async function runTest() {
  console.log(`\n=== Production User Login Test ===`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Base URL: ${BASE_URL}`);
  
  let browser;
  
  try {
    // Launch browser
    console.log('\nLaunching browser for testing...');
    browser = await puppeteer.launch({ 
      headless: process.env.HEADLESS !== 'false', // Set HEADLESS=false to see the browser
      args: ['--window-size=1280,800'],
      defaultViewport: null
    });
    
    // Run test scenarios
    await testLoginFlow(browser);
    
    console.log('\nTest completed!');
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
  }
}

/**
 * Test login flow
 */
async function testLoginFlow(browser) {
  console.log('\n--- Testing Production User Login Flow ---');
  const page = await browser.newPage();
  
  // Enable request interception to log network activity
  await page.setRequestInterception(true);
  
  page.on('request', request => {
    if (request.url().includes('supabase') || request.url().includes('/api/')) {
      console.log(`Network request: ${request.method()} ${request.url()}`);
    }
    request.continue();
  });
  
  page.on('response', async response => {
    if (response.url().includes('supabase') || response.url().includes('/api/')) {
      const status = response.status();
      let responseText = '';
      try {
        responseText = await response.text();
        if (responseText.length > 100) {
          responseText = responseText.substring(0, 100) + '...';
        }
      } catch (e) {
        responseText = '[Error reading response]';
      }
      console.log(`Network response: ${status} ${response.url()}\n${responseText}`);
    }
  });
  
  try {
    // Enable console logging from the browser
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Step 1: Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Take a screenshot
    await takeScreenshot(page, 'login-page');
    
    // Log localStorage and cookies before login
    await logStorageAndCookies(page, 'Before login');
    
    // Step 2: Fill login form
    console.log('2. Filling login form...');
    await page.waitForSelector('input[name="email"]');
    await page.waitForSelector('input[name="password"]');
    
    // Fill form using type for better reliability
    await page.type('input[name="email"]', TEST_EMAIL);
    await page.type('input[name="password"]', TEST_PASSWORD);
    
    await takeScreenshot(page, 'login-form-filled');
    
    // Step 3: Submit form
    console.log('3. Submitting login form...');
    
    // Use a more direct approach by clicking the submit button
    const submitButton = await page.waitForSelector('button[type="submit"]');
    await submitButton.click();
    
    // Wait for navigation or timeout
    console.log('4. Waiting for response...');
    
    // Wait for either navigation to dashboard or error
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: WAIT_TIMEOUT }),
        page.waitForSelector('.text-amber-700', { timeout: WAIT_TIMEOUT }),
        page.waitForSelector('.text-red-700', { timeout: WAIT_TIMEOUT })
      ]);
      console.log('Response received');
    } catch (error) {
      console.log('Wait timeout - checking current state');
    }
    
    // Take a screenshot
    await takeScreenshot(page, 'after-login-submit');
    
    // Log localStorage and cookies after login
    await logStorageAndCookies(page, 'After login');
    
    // Step 4: Check the result
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    // Check if we're on the dashboard
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard');
    } else if (currentUrl.includes('/auth/environment-mismatch')) {
      console.log('❌ Redirected to environment mismatch page');
      
      // Get the error message
      const errorText = await page.evaluate(() => {
        const errorElement = document.querySelector('.text-amber-700');
        return errorElement ? errorElement.textContent.trim() : null;
      });
      
      if (errorText) {
        console.log(`Error message: ${errorText}`);
      }
    } else if (currentUrl.includes('/login')) {
      console.log('❌ Still on login page - login failed or redirect did not happen');
      
      // Check for error messages
      const errorText = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('.text-red-700, .text-amber-700');
        return Array.from(errorElements).map(el => el.textContent.trim()).join('\n');
      });
      
      if (errorText) {
        console.log(`Error message: ${errorText}`);
      }
      
      // Check if we're logged in but not redirected
      const isLoggedIn = await page.evaluate(() => {
        return localStorage.getItem('auth_user_id') !== null;
      });
      
      if (isLoggedIn) {
        console.log('⚠️ User appears to be logged in (auth_user_id in localStorage) but not redirected');
      }
    } else {
      console.log(`❓ Unexpected URL after login: ${currentUrl}`);
    }
    
    // Step 5: Try manual navigation to dashboard
    if (!currentUrl.includes('/dashboard')) {
      console.log('5. Attempting manual navigation to dashboard...');
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
      
      // Take a screenshot
      await takeScreenshot(page, 'manual-dashboard-navigation');
      
      // Check if we're on the dashboard now
      const dashboardUrl = page.url();
      console.log(`URL after manual navigation: ${dashboardUrl}`);
      
      if (dashboardUrl.includes('/dashboard')) {
        console.log('✅ Manual navigation to dashboard successful');
      } else {
        console.log('❌ Manual navigation to dashboard failed');
      }
    }
    
  } catch (error) {
    console.error('Login flow test failed:', error);
    throw error; // Re-throw to be caught by the main function
  } finally {
    // Close the page
    await page.close();
  }
}

/**
 * Helper function to log localStorage and cookies
 */
async function logStorageAndCookies(page, label) {
  console.log(`\n--- ${label} ---`);
  
  // Log localStorage
  const localStorage = await page.evaluate(() => {
    const items = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      items[key] = window.localStorage.getItem(key);
    }
    return items;
  });
  
  console.log('localStorage:', JSON.stringify(localStorage, null, 2));
  
  // Log cookies
  const cookies = await page.cookies();
  console.log('Cookies:', JSON.stringify(cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })), null, 2));
}

/**
 * Helper function to take and save screenshots
 */
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOT_DIR, `prod-login-${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

// Run the test
runTest().catch(error => {
  console.error('Unhandled error in test:', error);
  process.exit(1);
}); 