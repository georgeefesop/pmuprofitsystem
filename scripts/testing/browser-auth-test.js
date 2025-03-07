/**
 * Browser-based Authentication Flow Test
 * 
 * This script uses Puppeteer to test the authentication flow in a real browser environment,
 * capturing screenshots and console logs at each step.
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
const outputDir = path.join(__dirname, '../../browser-test-output');

// Create output directory for logs and screenshots
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create log file
const logFile = path.join(outputDir, `auth-flow-browser-test-${Date.now()}.log`);
fs.writeFileSync(logFile, '');

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
async function runBrowserTest() {
  log('Starting browser-based authentication flow test');
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
    
    // Step 1: Go to pre-checkout page
    await testPreCheckout(page);
    
    // Step 2: Sign up
    const signupSuccess = await testSignup(page);
    
    if (signupSuccess) {
      // Step 3: Test redirect to checkout
      await testCheckoutRedirect(page);
      
      // Step 4: Test checkout page
      await testCheckoutPage(page);
    }
    
    log('Browser-based authentication flow test completed successfully');
  } catch (error) {
    log('Browser-based authentication flow test failed', {
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
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      log('Error listing users', { error });
      return;
    }
    
    const testUserAccount = data?.users?.find(user => user.email === testUser);
    
    if (testUserAccount) {
      log(`Found existing test user: ${testUserAccount.id}`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(testUserAccount.id);
      
      if (deleteError) {
        log('Error deleting test user', { error: deleteError });
      } else {
        log('Successfully deleted test user');
      }
    } else {
      log('No existing test user found');
    }
  } catch (error) {
    log('Error during test user cleanup', { error: error.message });
  }
}

// Test pre-checkout page
async function testPreCheckout(page) {
  log('Testing pre-checkout page');
  
  await page.goto(`${baseUrl}/pre-checkout`);
  
  // Wait for the page to load - look for any content instead of specifically a form
  await page.waitForSelector('body', { timeout: 10000 });
  
  // Take screenshot
  await page.screenshot({ path: path.join(outputDir, '1-pre-checkout.png') });
  
  // Get cookies
  const cookies = await page.cookies();
  log('Pre-checkout page cookies', cookies);
  
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
  
  log('Pre-checkout page localStorage', localStorage);
  log('Pre-checkout page sessionStorage', sessionStorage);
  
  // Log page title and URL
  const title = await page.title();
  log('Pre-checkout page loaded', {
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
  
  log('Buttons and links on pre-checkout page', buttonsAndLinks);
}

// Test signup process
async function testSignup(page) {
  log('Testing signup process');
  
  try {
    // Look for a signup or create account button/link
    log('Looking for signup button or link');
    
    // Take screenshot of the page before looking for signup elements
    await page.screenshot({ path: path.join(outputDir, '2-before-signup-click.png') });
    
    // Try different selectors to find the signup button
    const selectors = [
      'a[href*="signup"]',
      'a[href*="sign-up"]',
      'a[href*="register"]',
      'button:contains("Sign up")',
      'button:contains("Create account")',
      'a:contains("Sign up")',
      'a:contains("Create account")',
      'a:contains("Register")'
    ];
    
    // Look for the "Create Account & Continue" button which we found in the buttons list
    const createAccountButton = await page.$('button.bg-gradient-to-r');
    
    if (createAccountButton) {
      log('Found "Create Account & Continue" button');
      await createAccountButton.click();
      await delay(2000);
    } else {
      // Try to find any button with text containing "create account" or "sign up"
      log('Looking for buttons with text containing "create account" or "sign up"');
      
      const buttons = await page.$$eval('button', buttons => {
        return buttons
          .filter(button => {
            const text = button.innerText.toLowerCase();
            return text.includes('create account') || 
                   text.includes('sign up') || 
                   text.includes('signup') || 
                   text.includes('register');
          })
          .map(button => ({
            text: button.innerText,
            id: button.id,
            class: button.className
          }));
      });
      
      log('Buttons with signup-related text', buttons);
      
      if (buttons.length > 0) {
        // Click the first button that matches
        log(`Clicking button with text: ${buttons[0].text}`);
        
        // Find the button again and click it
        const buttonToClick = await page.$(`button[id="${buttons[0].id}"], button.${buttons[0].class.split(' ')[0]}`);
        
        if (buttonToClick) {
          await buttonToClick.click();
          await delay(2000);
        } else {
          log('Could not find the button to click');
        }
      } else {
        log('No signup button found, looking for email input directly');
      }
    }
    
    // Take screenshot after clicking signup
    await page.screenshot({ path: path.join(outputDir, '3-after-signup-click.png') });
    
    // Look for email input
    log('Looking for email input');
    const emailInput = await page.$('input[type="email"]');
    
    if (!emailInput) {
      log('Could not find email input');
      return false;
    }
    
    // Fill out the signup form
    log(`Filling out signup form with email: ${testUser}`);
    await emailInput.type(testUser);
    
    // Look for password input
    const passwordInput = await page.$('input[type="password"]');
    
    if (passwordInput) {
      log('Filling out password');
      await passwordInput.type(testPassword);
    } else {
      log('No password input found');
    }
    
    // Take screenshot of filled form
    await page.screenshot({ path: path.join(outputDir, '4-signup-form-filled.png') });
    
    // Find and click submit button
    const submitButton = await page.$('button[type="submit"], input[type="submit"]');
    
    if (!submitButton) {
      // Try to find a button with text containing "sign up", "create account", etc.
      const possibleSubmitButtons = await page.$$eval('button', buttons => {
        return buttons
          .filter(button => {
            const text = button.innerText.toLowerCase();
            return text.includes('sign up') || 
                   text.includes('create account') || 
                   text.includes('continue') ||
                   text.includes('submit') ||
                   text.includes('register');
          })
          .map(button => ({
            text: button.innerText,
            id: button.id,
            class: button.className
          }));
      });
      
      log('Possible submit buttons', possibleSubmitButtons);
      
      if (possibleSubmitButtons.length > 0) {
        // Click the first button that matches
        log(`Clicking button with text: ${possibleSubmitButtons[0].text}`);
        
        // Find the button again and click it
        const buttonToClick = await page.$(`button[id="${possibleSubmitButtons[0].id}"], button.${possibleSubmitButtons[0].class.split(' ')[0]}`);
        
        if (buttonToClick) {
          await buttonToClick.click();
        } else {
          log('Could not find the submit button to click');
          return false;
        }
      } else {
        log('Could not find submit button');
        return false;
      }
    } else {
      log('Clicking submit button');
      await submitButton.click();
    }
    
    // Wait for navigation or response
    await delay(5000);
    
    // Take screenshot after submission
    await page.screenshot({ path: path.join(outputDir, '5-after-signup-submission.png') });
    
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
    
    return true;
  } catch (error) {
    log('Error during signup process', { error: error.message, stack: error.stack });
    await page.screenshot({ path: path.join(outputDir, 'error-signup.png') });
    return false;
  }
}

// Test redirect to checkout
async function testCheckoutRedirect(page) {
  log('Testing redirect to checkout page');
  
  try {
    // Check current URL
    const currentUrl = page.url();
    log(`Current URL: ${currentUrl}`);
    
    // Take screenshot
    await page.screenshot({ path: path.join(outputDir, '6-checkout-redirect.png') });
    
    // Check if we're already on the checkout page
    if (currentUrl.includes('/checkout')) {
      log('Already on checkout page');
      return true;
    }
    
    // Wait for redirect (if not already redirected)
    log('Waiting for redirect to checkout page');
    try {
      await page.waitForNavigation({ timeout: 10000 });
    } catch (e) {
      log('Navigation timeout waiting for redirect', { error: e.message });
    }
    
    // Check URL again
    const newUrl = page.url();
    log(`New URL after waiting: ${newUrl}`);
    
    // Take screenshot after waiting
    await page.screenshot({ path: path.join(outputDir, '7-after-redirect-wait.png') });
    
    return newUrl.includes('/checkout');
  } catch (error) {
    log('Error during checkout redirect test', { error: error.message, stack: error.stack });
    await page.screenshot({ path: path.join(outputDir, 'error-redirect.png') });
    return false;
  }
}

// Test checkout page
async function testCheckoutPage(page) {
  log('Testing checkout page');
  
  try {
    // If not already on checkout page, navigate there
    const currentUrl = page.url();
    if (!currentUrl.includes('/checkout')) {
      log('Navigating to checkout page');
      await page.goto(`${baseUrl}/checkout`);
    }
    
    // Wait for page to load
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: path.join(outputDir, '8-checkout-page.png') });
    
    // Get cookies
    const cookies = await page.cookies();
    log('Checkout page cookies', cookies);
    
    // Check localStorage and sessionStorage
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
    
    log('localStorage on checkout page', localStorage);
    log('sessionStorage on checkout page', sessionStorage);
    
    // Log page title and URL
    const title = await page.title();
    log('Checkout page loaded', {
      title,
      url: page.url()
    });
    
    return true;
  } catch (error) {
    log('Error during checkout page test', { error: error.message, stack: error.stack });
    await page.screenshot({ path: path.join(outputDir, 'error-checkout.png') });
    return false;
  }
}

// Run the test
runBrowserTest().catch(error => {
  log('Unhandled error in browser test', { error: error.message, stack: error.stack });
  process.exit(1);
}); 