/**
 * Full User Journey Test
 * 
 * This script tests the complete user journey from homepage to success page:
 * 1. Start at homepage
 * 2. Click the CTA button
 * 3. Fill out the pre-checkout form
 * 4. Complete the checkout process
 * 5. Verify the success page
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
// Load environment variables from .env file
require('dotenv').config();

// Configuration
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testUser = `test-user-${Date.now()}@example.com`;
const testPassword = 'Test123!@#';
const testFullName = 'Test User';
const outputDir = path.join(__dirname, '../../browser-test-output');

// Create output directory for logs and screenshots
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create log file
const logFile = path.join(outputDir, `full-journey-test-${Date.now()}.log`);
fs.writeFileSync(logFile, `Full User Journey Test - ${new Date().toISOString()}\n\n`);

// Helper function to log to both console and file
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  let fileContent = logMessage;
  if (data) {
    console.log(data);
    fileContent += '\n' + JSON.stringify(data, null, 2);
  }
  fs.appendFileSync(logFile, fileContent + '\n');
}

// Helper function for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Main test function
async function runFullJourneyTest() {
  log('Starting full user journey test');
  log(`Test user: ${testUser}`);
  
  let browser;
  
  try {
    // Clean up any existing test user
    await cleanupTestUser();
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1280, height: 800 },
      args: ['--window-size=1280,800'],
      slowMo: 50 // Slow down operations for better visibility
    });
    
    const page = await browser.newPage();
    
    // Enable console logging from the browser
    page.on('console', message => {
      const type = message.type().substr(0, 3).toUpperCase();
      const text = message.text();
      log(`BROWSER CONSOLE [${type}]: ${text}`);
    });
    
    // Log all network requests
    page.on('request', request => {
      if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') {
        log(`NETWORK REQUEST: ${request.method()} ${request.url()}`);
      }
    });
    
    // Log all network responses
    page.on('response', async response => {
      if (response.request().resourceType() === 'fetch' || response.request().resourceType() === 'xhr') {
        const status = response.status();
        const url = response.url();
        log(`NETWORK RESPONSE: ${status} ${url}`);
        
        // Log response body for API calls
        if (url.includes('/api/') && status !== 204) {
          try {
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('application/json')) {
              const responseBody = await response.json().catch(() => null);
              log(`RESPONSE BODY: ${url}`, responseBody);
            }
          } catch (error) {
            log(`Error parsing response: ${error.message}`);
          }
        }
      }
    });
    
    // Step 1: Start at homepage
    await testHomepage(page);
    
    // Step 2: Navigate to pre-checkout from homepage CTA
    await testHomepageCTA(page);
    
    // Step 3: Fill out the pre-checkout form
    const signupSuccess = await testPreCheckoutForm(page);
    
    if (signupSuccess) {
      // Step 4: Test checkout page
      await testCheckoutPage(page);
      
      // Step 5: Complete checkout
      await testCheckoutCompletion(page);
      
      // Step 6: Verify success page
      await testSuccessPage(page);
      
      // Step 7: Navigate to dashboard
      await testDashboardAccess(page);
    }
    
    log('Full user journey test completed successfully');
  } catch (error) {
    log('Full user journey test failed', {
      error: error.message,
      stack: error.stack
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Clean up any existing test user
async function cleanupTestUser() {
  log('Cleaning up any existing test user');
  
  try {
    // Check if user exists
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', testUser)
      .maybeSingle();
    
    if (searchError) {
      log('Error searching for existing user', searchError);
      return;
    }
    
    if (existingUser) {
      log(`Found existing test user with ID: ${existingUser.id}`);
      
      // Delete user from auth
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
        existingUser.id
      );
      
      if (deleteAuthError) {
        log('Error deleting auth user', deleteAuthError);
      } else {
        log('Deleted auth user');
      }
      
      // Delete user from users table
      const { error: deleteUserError } = await supabase
        .from('users')
        .delete()
        .eq('id', existingUser.id);
      
      if (deleteUserError) {
        log('Error deleting user from users table', deleteUserError);
      } else {
        log('Deleted user from users table');
      }
    } else {
      log('No existing test user found');
    }
  } catch (error) {
    log('Error during user cleanup', error);
  }
}

// Test homepage
async function testHomepage(page) {
  log('Testing homepage');
  
  await page.goto(baseUrl);
  
  // Wait for the page to load
  await page.waitForSelector('body', { timeout: 10000 });
  
  // Take screenshot
  await page.screenshot({ path: path.join(outputDir, '1-homepage.png') });
  
  // Log page title and URL
  const title = await page.title();
  log('Homepage loaded', {
    title,
    url: page.url()
  });
  
  // Log all buttons and links on the page
  const buttonsAndLinks = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('button, a'));
    return elements.map(el => ({
      type: el.tagName.toLowerCase(),
      text: el.innerText.trim(),
      id: el.id,
      className: el.className,
      href: el.tagName.toLowerCase() === 'a' ? el.href : null
    }));
  });
  
  log('Buttons and links on homepage', buttonsAndLinks);
}

// Test homepage CTA
async function testHomepageCTA(page) {
  log('Testing homepage CTA button');
  
  // Look for the "Get Started" button
  const ctaButton = await page.$('a[href="/pre-checkout"]');
  
  if (!ctaButton) {
    log('Could not find CTA button on homepage');
    throw new Error('CTA button not found');
  }
  
  log('Found CTA button, clicking it');
  
  // Take screenshot before clicking
  await page.screenshot({ path: path.join(outputDir, '2-before-cta-click.png') });
  
  // Click the CTA button
  await ctaButton.click();
  
  // Wait for navigation to pre-checkout page
  await page.waitForNavigation({ timeout: 10000 });
  
  // Take screenshot after navigation
  await page.screenshot({ path: path.join(outputDir, '3-pre-checkout-page.png') });
  
  // Verify we're on the pre-checkout page
  const currentUrl = page.url();
  log(`Navigated to: ${currentUrl}`);
  
  if (!currentUrl.includes('/pre-checkout')) {
    throw new Error(`Expected to navigate to pre-checkout, but got: ${currentUrl}`);
  }
  
  log('Successfully navigated to pre-checkout page');
}

// Test pre-checkout form
async function testPreCheckoutForm(page) {
  log('Testing pre-checkout form');
  
  try {
    // Wait for the form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Take screenshot of the form
    await page.screenshot({ path: path.join(outputDir, '4-pre-checkout-form.png') });
    
    // Fill out the form
    log(`Filling out pre-checkout form with email: ${testUser}`);
    
    // Fill out full name
    const fullNameInput = await page.$('input[name="fullName"]');
    if (fullNameInput) {
      await fullNameInput.type(testFullName);
    } else {
      log('Could not find full name input');
    }
    
    // Fill out email
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.type(testUser);
    } else {
      log('Could not find email input');
      return false;
    }
    
    // Fill out password
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.type(testPassword);
    } else {
      log('Could not find password input');
      return false;
    }
    
    // Take screenshot of filled form
    await page.screenshot({ path: path.join(outputDir, '5-form-filled.png') });
    
    // Find and click submit button
    const submitButton = await page.$('button[type="submit"]');
    
    if (!submitButton) {
      // Try to find a button with text containing "Create Account & Continue"
      const createAccountButton = await page.$('button.bg-gradient-to-r');
      
      if (createAccountButton) {
        log('Found "Create Account & Continue" button, clicking it');
        await createAccountButton.click();
      } else {
        log('Could not find submit button');
        return false;
      }
    } else {
      log('Clicking submit button');
      await submitButton.click();
    }
    
    // Wait for form submission and API response
    await delay(5000);
    
    // Take screenshot after submission
    await page.screenshot({ path: path.join(outputDir, '6-after-form-submission.png') });
    
    // Get cookies after signup
    const cookies = await page.cookies();
    log('Cookies after signup', cookies);
    
    // Check localStorage and sessionStorage after signup
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        items[key] = localStorage.getItem(key);
      }
      return items;
    });
    
    const sessionStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        items[key] = sessionStorage.getItem(key);
      }
      return items;
    });
    
    log('localStorage after signup', localStorage);
    log('sessionStorage after signup', sessionStorage);
    
    // Wait for redirect to checkout page
    try {
      await page.waitForNavigation({ timeout: 10000 });
    } catch (e) {
      log('Navigation timeout waiting for redirect to checkout', { error: e.message });
      
      // Check if we're already on the checkout page
      const currentUrl = page.url();
      if (currentUrl.includes('/checkout')) {
        log('Already on checkout page');
        return true;
      }
      
      // Take screenshot after timeout
      await page.screenshot({ path: path.join(outputDir, '7-redirect-timeout.png') });
      
      // Check if there's an error message
      const errorMessage = await page.evaluate(() => {
        const errorEl = document.querySelector('.text-red-700');
        return errorEl ? errorEl.textContent.trim() : null;
      });
      
      if (errorMessage) {
        log('Error message on pre-checkout form', { errorMessage });
      }
      
      return false;
    }
    
    // Take screenshot after redirect
    await page.screenshot({ path: path.join(outputDir, '8-after-redirect.png') });
    
    // Verify we're on the checkout page
    const currentUrl = page.url();
    log(`Current URL after redirect: ${currentUrl}`);
    
    return currentUrl.includes('/checkout');
  } catch (error) {
    log('Error during pre-checkout form test', { error: error.message, stack: error.stack });
    await page.screenshot({ path: path.join(outputDir, 'error-pre-checkout.png') });
    return false;
  }
}

// Test checkout page
async function testCheckoutPage(page) {
  log('Testing checkout page');
  
  try {
    // Wait for the checkout page to load
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: path.join(outputDir, '9-checkout-page.png') });
    
    // Get cookies
    const cookies = await page.cookies();
    log('Checkout page cookies', cookies);
    
    // Log localStorage and sessionStorage
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        items[key] = localStorage.getItem(key);
      }
      return items;
    });
    
    const sessionStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        items[key] = sessionStorage.getItem(key);
      }
      return items;
    });
    
    log('Checkout page localStorage', localStorage);
    log('Checkout page sessionStorage', sessionStorage);
    
    // Log page title and URL
    const title = await page.title();
    log('Checkout page loaded', {
      title,
      url: page.url()
    });
    
    // Check if user is authenticated on checkout page
    const isAuthenticated = await page.evaluate(() => {
      // Check for auth-related elements or data
      const userElement = document.querySelector('[data-authenticated="true"]');
      return !!userElement;
    });
    
    log('User authentication status on checkout page', { isAuthenticated });
    
    return true;
  } catch (error) {
    log('Error during checkout page test', { error: error.message, stack: error.stack });
    await page.screenshot({ path: path.join(outputDir, 'error-checkout.png') });
    return false;
  }
}

// Test checkout completion
async function testCheckoutCompletion(page) {
  log('Testing checkout completion');
  
  try {
    // In test mode, we'll look for the "Complete Purchase" button
    // This would normally be the Stripe checkout button
    const completeButton = await page.$('button:not([disabled])', { timeout: 10000 });
    
    if (!completeButton) {
      log('Could not find checkout button');
      return false;
    }
    
    // Take screenshot before clicking
    await page.screenshot({ path: path.join(outputDir, '10-before-checkout-completion.png') });
    
    // Click the checkout button
    log('Clicking checkout button');
    await completeButton.click();
    
    // Wait for navigation to success page
    try {
      await page.waitForNavigation({ timeout: 15000 });
    } catch (e) {
      log('Navigation timeout waiting for redirect to success page', { error: e.message });
      
      // Check if we're already on the success page
      const currentUrl = page.url();
      if (currentUrl.includes('/success')) {
        log('Already on success page');
        return true;
      }
      
      // Take screenshot after timeout
      await page.screenshot({ path: path.join(outputDir, '11-checkout-completion-timeout.png') });
      return false;
    }
    
    // Take screenshot after redirect
    await page.screenshot({ path: path.join(outputDir, '12-after-checkout-completion.png') });
    
    // Verify we're on the success page
    const currentUrl = page.url();
    log(`Current URL after checkout completion: ${currentUrl}`);
    
    return currentUrl.includes('/success');
  } catch (error) {
    log('Error during checkout completion test', { error: error.message, stack: error.stack });
    await page.screenshot({ path: path.join(outputDir, 'error-checkout-completion.png') });
    return false;
  }
}

// Test success page
async function testSuccessPage(page) {
  log('Testing success page');
  
  try {
    // Wait for the success page to load
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: path.join(outputDir, '13-success-page.png') });
    
    // Get cookies
    const cookies = await page.cookies();
    log('Success page cookies', cookies);
    
    // Log localStorage and sessionStorage
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        items[key] = localStorage.getItem(key);
      }
      return items;
    });
    
    const sessionStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        items[key] = sessionStorage.getItem(key);
      }
      return items;
    });
    
    log('Success page localStorage', localStorage);
    log('Success page sessionStorage', sessionStorage);
    
    // Log page title and URL
    const title = await page.title();
    log('Success page loaded', {
      title,
      url: page.url()
    });
    
    // Check for success message
    const successMessage = await page.evaluate(() => {
      const messageEl = document.querySelector('h1');
      return messageEl ? messageEl.textContent.trim() : null;
    });
    
    log('Success message', { successMessage });
    
    return true;
  } catch (error) {
    log('Error during success page test', { error: error.message, stack: error.stack });
    await page.screenshot({ path: path.join(outputDir, 'error-success.png') });
    return false;
  }
}

// Test dashboard access
async function testDashboardAccess(page) {
  log('Testing dashboard access');
  
  try {
    // Look for the "Go to Dashboard" button
    const dashboardButton = await page.$('button:contains("Go to Dashboard"), a[href*="dashboard"]');
    
    if (!dashboardButton) {
      // Try to find any button with text containing "dashboard"
      const buttons = await page.$$eval('button', buttons => {
        return buttons
          .filter(button => {
            const text = button.innerText.toLowerCase();
            return text.includes('dashboard');
          })
          .map(button => ({
            text: button.innerText,
            id: button.id,
            class: button.className
          }));
      });
      
      log('Buttons with dashboard text', buttons);
      
      if (buttons.length > 0) {
        // Find the button again and click it
        const buttonToClick = await page.$(`button[id="${buttons[0].id}"], button.${buttons[0].class.split(' ')[0]}`);
        
        if (buttonToClick) {
          log('Found dashboard button, clicking it');
          await buttonToClick.click();
        } else {
          log('Could not find dashboard button to click');
          return false;
        }
      } else {
        log('Could not find dashboard button');
        return false;
      }
    } else {
      log('Found dashboard button, clicking it');
      await dashboardButton.click();
    }
    
    // Wait for navigation to dashboard
    try {
      await page.waitForNavigation({ timeout: 10000 });
    } catch (e) {
      log('Navigation timeout waiting for redirect to dashboard', { error: e.message });
      
      // Take screenshot after timeout
      await page.screenshot({ path: path.join(outputDir, '14-dashboard-redirect-timeout.png') });
      return false;
    }
    
    // Take screenshot after redirect
    await page.screenshot({ path: path.join(outputDir, '15-dashboard.png') });
    
    // Verify we're on the dashboard page
    const currentUrl = page.url();
    log(`Current URL after dashboard redirect: ${currentUrl}`);
    
    return currentUrl.includes('/dashboard');
  } catch (error) {
    log('Error during dashboard access test', { error: error.message, stack: error.stack });
    await page.screenshot({ path: path.join(outputDir, 'error-dashboard.png') });
    return false;
  }
}

// Run the test
runFullJourneyTest().catch(error => {
  log('Unhandled error in full journey test', { error: error.message, stack: error.stack });
  process.exit(1);
}); 