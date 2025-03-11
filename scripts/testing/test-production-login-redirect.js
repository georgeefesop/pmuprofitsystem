const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://pmuprofitsystem.com';
const WAIT_TIMEOUT = 15000; // Increased timeout for production
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Helper functions
async function saveScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(SCREENSHOT_DIR, `${name}-${timestamp}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Screenshot saved: ${filePath}`);
  return filePath;
}

function setupConsoleLogger(page) {
  page.on('console', message => {
    const type = message.type().substr(0, 3).toUpperCase();
    const text = message.text();
    
    // Filter out noisy messages
    if (text.includes('Download the React DevTools')) return;
    if (text.includes('React DevTools is not supported')) return;
    
    console.log(`BROWSER ${type}: ${text}`);
  });

  page.on('pageerror', error => {
    console.error(`BROWSER ERROR: ${error.message}`);
  });
}

function setupNetworkLogger(page) {
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();
    
    // Only log auth-related or API requests
    if (url.includes('auth') || url.includes('api/') || url.includes('supabase')) {
      let responseBody = '';
      try {
        // Only try to read JSON responses
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          responseBody = await response.text();
          if (responseBody.length > 500) {
            responseBody = responseBody.substring(0, 500) + '... [truncated]';
          }
        }
      } catch (error) {
        responseBody = `[Error reading response: ${error.message}]`;
      }
      
      console.log(`NETWORK: ${status} ${response.request().method()} ${url}`);
      if (responseBody) {
        console.log(`RESPONSE: ${responseBody}`);
      }
    }
  });
}

async function logStorageAndCookies(page, prefix) {
  // Log localStorage
  const localStorage = await page.evaluate(() => {
    const items = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      items[key] = localStorage.getItem(key);
    }
    return items;
  });
  
  console.log(`${prefix} localStorage:`, localStorage);
  
  // Log cookies
  const cookies = await page.cookies();
  console.log(`${prefix} cookies:`, cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + (c.value.length > 20 ? '...' : '') })));
}

// Add a function to normalize URLs for comparison
function normalizeUrl(url) {
  try {
    // Create a URL object to parse the URL
    const parsedUrl = new URL(url);
    
    // Remove www. from hostname if present
    let hostname = parsedUrl.hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    // Reconstruct the URL without www
    return `${parsedUrl.protocol}//${hostname}${parsedUrl.pathname}${parsedUrl.search}`;
  } catch (error) {
    console.error('Error normalizing URL:', error);
    return url;
  }
}

async function testProductionLoginRedirect() {
  console.log('Starting production login redirect test...');
  console.log(`Base URL: ${BASE_URL}`);
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  let page;
  
  try {
    page = await browser.newPage();
    
    // Set up logging
    setupConsoleLogger(page);
    setupNetworkLogger(page);
    
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: WAIT_TIMEOUT });
    await saveScreenshot(page, 'login-page');
    
    // Wait for login form to be visible
    await page.waitForSelector('form', { timeout: WAIT_TIMEOUT });
    console.log('Login form loaded');
    
    // Log initial state
    await logStorageAndCookies(page, 'BEFORE LOGIN:');
    
    // Fill login form
    console.log('Filling login form...');
    await page.type('input[type="email"]', 'george.efesopb@gmail.com');
    await page.type('input[type="password"]', 'Wheels99!');
    
    // Submit form
    console.log('Submitting login form...');
    
    // Click the submit button
    await Promise.all([
      page.click('button[type="submit"]'),
      // Don't wait for navigation here as it might not complete
    ]);
    
    // Wait for auth state to change
    console.log('Waiting for auth state to change...');
    await page.waitForFunction(() => {
      return localStorage.getItem('auth_user_id') !== null;
    }, { timeout: WAIT_TIMEOUT }).catch(e => {
      console.log('Timeout waiting for auth_user_id in localStorage:', e.message);
    });
    
    // Take screenshot after login attempt
    await saveScreenshot(page, 'after-login-attempt');
    
    // Log post-login state
    await logStorageAndCookies(page, 'AFTER LOGIN:');
    
    // Check current URL to see if we were redirected to dashboard
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    // Wait a bit for any redirects to complete
    console.log('Waiting for redirects to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check URL again after waiting
    const finalUrl = page.url();
    console.log(`URL after waiting: ${finalUrl}`);
    await saveScreenshot(page, 'after-waiting');
    
    // Normalize URLs for comparison
    const normalizedFinalUrl = normalizeUrl(finalUrl);
    console.log(`Normalized URL: ${normalizedFinalUrl}`);
    
    if (normalizedFinalUrl.includes('/dashboard')) {
      console.log('SUCCESS: Redirected to dashboard');
    } else if (normalizedFinalUrl.includes('/environment-mismatch')) {
      console.log('ENVIRONMENT MISMATCH: User was created in a different environment');
    } else if (normalizedFinalUrl.includes('/login')) {
      console.log('FAILED: Still on login page');
      
      // Check for error messages
      const errorText = await page.evaluate(() => {
        const errorElement = document.querySelector('.text-red-500');
        return errorElement ? errorElement.textContent : null;
      });
      
      if (errorText) {
        console.log(`Login error message: ${errorText}`);
      }
    } else {
      console.log(`UNEXPECTED: Redirected to unexpected URL: ${normalizedFinalUrl}`);
    }
    
    // Try to manually navigate to dashboard
    console.log('Attempting to manually navigate to dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: WAIT_TIMEOUT });
    await saveScreenshot(page, 'manual-dashboard-navigation');
    
    const dashboardUrl = page.url();
    const normalizedDashboardUrl = normalizeUrl(dashboardUrl);
    console.log(`URL after manual navigation to dashboard: ${dashboardUrl}`);
    console.log(`Normalized dashboard URL: ${normalizedDashboardUrl}`);
    
    if (normalizedDashboardUrl.includes('/dashboard')) {
      console.log('SUCCESS: Manual navigation to dashboard succeeded');
    } else {
      console.log('FAILED: Manual navigation to dashboard failed');
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
    if (page) {
      await saveScreenshot(page, 'error-state');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log('Test completed');
  }
}

// Run the test
testProductionLoginRedirect().catch(console.error); 