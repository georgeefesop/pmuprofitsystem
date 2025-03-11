require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://pmuprofitsystem.com'; // Use production URL for testing
const WAIT_TIMEOUT = 15000; // Increase timeout for production
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Helper function to save screenshots
async function saveScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

// Helper function to log browser console messages
function setupConsoleLogger(page) {
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    // Filter out noisy messages
    if (text.includes('Download the React DevTools') || 
        text.includes('React DevTools') ||
        text.includes('Warning: ReactDOM.render is no longer supported')) {
      return;
    }
    
    if (type === 'error') {
      console.error(`Browser console error: ${text}`);
    } else if (type === 'warning') {
      console.warn(`Browser console warning: ${text}`);
    } else if (text.includes('AuthContext') || 
               text.includes('Middleware') || 
               text.includes('login') || 
               text.includes('redirect')) {
      console.log(`Browser console: ${text}`);
    }
  });
}

// Helper function to log network requests
function setupNetworkLogger(page) {
  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();
    
    // Only log auth-related requests or redirects
    if (url.includes('supabase') || 
        url.includes('auth') || 
        url.includes('login') || 
        url.includes('dashboard') ||
        status >= 300 && status < 400) {
      console.log(`Network: ${response.request().method()} ${url} - ${status}`);
      
      try {
        if (url.includes('supabase') && url.includes('auth')) {
          const responseBody = await response.text();
          console.log(`Auth response: ${responseBody.substring(0, 150)}...`);
        }
      } catch (error) {
        console.error(`Error reading response body: ${error.message}`);
      }
    }
  });
}

// Helper function to log localStorage and cookies
async function logStorageAndCookies(page, prefix) {
  // Log localStorage
  const localStorage = await page.evaluate(() => {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        items[key] = localStorage.getItem(key);
      }
    }
    return items;
  });
  
  console.log(`${prefix} localStorage:`, Object.keys(localStorage).map(key => {
    // Truncate long values
    const value = localStorage[key];
    const truncatedValue = typeof value === 'string' && value.length > 50 
      ? value.substring(0, 50) + '...' 
      : value;
    return `${key}: ${truncatedValue}`;
  }));
  
  // Log cookies
  const cookies = await page.cookies();
  console.log(`${prefix} cookies:`, cookies.map(c => `${c.name}: ${c.value.substring(0, 20)}...`));
}

// Main test function
async function testLoginRedirect() {
  console.log('Starting login redirect test...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    setupConsoleLogger(page);
    setupNetworkLogger(page);
    
    // Test scenario 1: Direct login with redirect to dashboard
    console.log('\n--- Test Scenario 1: Direct login with redirect to dashboard ---');
    
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: WAIT_TIMEOUT });
    
    // Wait for the page to be fully loaded
    console.log('Waiting for page to fully load...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Wait for the form to be visible
    console.log('Waiting for login form to be visible...');
    await page.waitForSelector('form', { timeout: WAIT_TIMEOUT });
    
    await saveScreenshot(page, 'login-page');
    
    // Fill login form
    console.log('Filling login form...');
    
    // Get all input elements and find the email and password fields
    const inputElements = await page.$$('input');
    console.log(`Found ${inputElements.length} input elements`);
    
    // Find email input by checking type attribute
    const emailInput = await page.$('input[type="email"]');
    if (!emailInput) {
      console.error('Email input not found');
      await saveScreenshot(page, 'email-input-not-found');
      throw new Error('Email input not found');
    }
    
    // Find password input by checking type attribute
    const passwordInput = await page.$('input[type="password"]');
    if (!passwordInput) {
      console.error('Password input not found');
      await saveScreenshot(page, 'password-input-not-found');
      throw new Error('Password input not found');
    }
    
    // Type in the email and password
    await emailInput.type('george.efesopb@gmail.com');
    await passwordInput.type('Wheels99!');
    
    // Log storage before login
    await logStorageAndCookies(page, 'Before login:');
    
    // Submit form and wait for navigation
    console.log('Submitting login form...');
    
    // Click the login button and wait for navigation or network idle
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ timeout: WAIT_TIMEOUT }).catch(e => {
        console.log('Navigation timeout or no navigation occurred:', e.message);
      })
    ]);
    
    // Wait a bit for any redirects to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Log storage after login
    await logStorageAndCookies(page, 'After login:');
    
    // Save screenshot after login attempt
    await saveScreenshot(page, 'after-login');
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: Redirected to dashboard successfully');
    } else {
      console.log('❌ FAILURE: Not redirected to dashboard');
      
      // Try to navigate to dashboard manually
      console.log('Attempting to navigate to dashboard manually...');
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: WAIT_TIMEOUT });
      
      // Wait a bit for any redirects to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if we're on the dashboard now
      const manualUrl = page.url();
      console.log('URL after manual navigation:', manualUrl);
      
      if (manualUrl.includes('/dashboard')) {
        console.log('✅ Manual navigation to dashboard succeeded');
      } else {
        console.log('❌ Manual navigation to dashboard failed');
      }
      
      await saveScreenshot(page, 'after-manual-navigation');
    }
    
    // Test scenario 2: Login with specific redirect parameter
    console.log('\n--- Test Scenario 2: Login with specific redirect parameter ---');
    
    // First logout
    console.log('Logging out...');
    await page.goto(`${BASE_URL}/logout`, { waitUntil: 'networkidle2', timeout: WAIT_TIMEOUT });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Navigate to login page with redirect parameter
    const redirectTarget = '/dashboard/modules';
    console.log(`Navigating to login page with redirect to ${redirectTarget}...`);
    await page.goto(`${BASE_URL}/login?redirect=${encodeURIComponent(redirectTarget)}`, { 
      waitUntil: 'networkidle2', 
      timeout: WAIT_TIMEOUT 
    });
    
    // Wait for the page to be fully loaded
    console.log('Waiting for page to fully load...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Wait for the form to be visible
    console.log('Waiting for login form to be visible...');
    await page.waitForSelector('form', { timeout: WAIT_TIMEOUT });
    
    // Fill login form
    console.log('Filling login form...');
    
    // Find email input by checking type attribute
    const emailInput2 = await page.$('input[type="email"]');
    if (!emailInput2) {
      console.error('Email input not found');
      await saveScreenshot(page, 'email-input-not-found-2');
      throw new Error('Email input not found');
    }
    
    // Find password input by checking type attribute
    const passwordInput2 = await page.$('input[type="password"]');
    if (!passwordInput2) {
      console.error('Password input not found');
      await saveScreenshot(page, 'password-input-not-found-2');
      throw new Error('Password input not found');
    }
    
    // Type in the email and password
    await emailInput2.type('george.efesopb@gmail.com');
    await passwordInput2.type('Wheels99!');
    
    // Submit form and wait for navigation
    console.log('Submitting login form...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ timeout: WAIT_TIMEOUT }).catch(e => {
        console.log('Navigation timeout or no navigation occurred:', e.message);
      })
    ]);
    
    // Wait a bit for any redirects to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check current URL
    const redirectUrl = page.url();
    console.log('Current URL after login with redirect param:', redirectUrl);
    
    if (redirectUrl.includes(redirectTarget)) {
      console.log(`✅ SUCCESS: Redirected to ${redirectTarget} successfully`);
    } else {
      console.log(`❌ FAILURE: Not redirected to ${redirectTarget}`);
    }
    
    await saveScreenshot(page, 'after-redirect-param-login');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up
    console.log('Cleaning up...');
    await browser.close();
  }
  
  console.log('Login redirect test completed');
}

// Run the test
testLoginRedirect().catch(console.error); 