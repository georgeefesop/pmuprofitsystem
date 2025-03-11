/**
 * Puppeteer Test Template
 * 
 * This template provides a structure for creating Puppeteer-based tests
 * following the best practices outlined in the .cursorrules file.
 * 
 * Test Coverage:
 * - [Describe what this test would cover]
 * - [List specific scenarios being tested]
 * 
 * Usage:
 * node scripts/testing/your-test-file.js
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
  console.log(`\n=== Test Name: [Your Test Name] ===`);
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
    
    // Create test user(s)
    console.log('Setting up test data...');
    const testUserEmail = `test-user-${Date.now()}@example.com`;
    const password = 'Password123!';
    
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: password,
      email_confirm: true,
      app_metadata: {
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'local',
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
    await testScenario1(browser, testUserEmail, password);
    // Add more test scenarios as needed
    
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
 * Example test scenario
 */
async function testScenario1(browser, email, password) {
  console.log('\n--- Test Scenario 1: [Scenario Description] ---');
  const page = await browser.newPage();
  
  try {
    // Enable console logging from the browser
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Step 1: Navigate to page
    console.log('1. Navigating to test page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Take a screenshot
    await takeScreenshot(page, 'scenario1-step1');
    
    // Step 2: Interact with the page
    console.log('2. Filling login form...');
    await page.waitForSelector('input[name="email"]');
    await page.waitForSelector('input[name="password"]');
    
    // Fill form using evaluate for better performance
    await page.evaluate((email, password) => {
      document.querySelector('input[name="email"]').value = email;
      document.querySelector('input[name="password"]').value = password;
    }, email, password);
    
    await takeScreenshot(page, 'scenario1-step2');
    
    // Step 3: Submit form
    console.log('3. Submitting form...');
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
    
    await takeScreenshot(page, 'scenario1-step3');
    
    // Step 4: Verify results
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Test passed: Successfully logged in and redirected to dashboard');
    } else {
      console.log(`❌ Test failed: Unexpected URL after login: ${currentUrl}`);
      
      // Check for error messages
      const errorText = await page.evaluate(() => {
        const errorSelectors = ['.error-message', '.text-red-500', '.text-destructive'];
        for (const selector of errorSelectors) {
          const element = document.querySelector(selector);
          if (element) return element.textContent;
        }
        return null;
      });
      
      if (errorText) {
        console.log(`Error message: "${errorText}"`);
      }
      
      throw new Error('Login test failed');
    }
  } catch (error) {
    console.error('Scenario 1 failed:', error);
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
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

// Run the test
runTest().catch(error => {
  console.error('Unhandled error in test:', error);
  process.exit(1);
}); 