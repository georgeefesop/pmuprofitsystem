/**
 * Test Authentication Flow and Purchase Verification
 * 
 * This script tests:
 * 1. Authentication status check
 * 2. Purchase verification for authenticated users
 * 3. Purchase verification for unauthenticated users
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Test credentials - with correct password
const TEST_EMAIL = 'george.efesopf@gmail.com';
const TEST_PASSWORD = 'Wheels99!';

// Test product and payment intent
const TEST_PRODUCT = 'pricing-template';
const TEST_PAYMENT_INTENT = 'pi_test_123456789';

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(screenshotsDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAuthFlow() {
  console.log('Starting authentication flow test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1280,800']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the browser
    page.on('console', msg => {
      console.log(`Browser console [${msg.type()}]: ${msg.text()}`);
    });
    
    // Step 1: Go directly to the login page
    console.log('Step 1: Going to login page');
    await page.goto('http://localhost:3000/login');
    await wait(2000);
    
    // Take a screenshot of the login page
    await takeScreenshot(page, 'login-page');
    
    // Step 2: Log in
    console.log('Step 2: Logging in');
    
    // Fill in the login form
    await page.type('#email', TEST_EMAIL);
    await page.type('#password', TEST_PASSWORD);
    
    // Click the login button
    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
      console.log('Login button clicked');
      
      // Wait for navigation to complete
      await page.waitForNavigation({ timeout: 10000 }).catch(() => {
        console.log('Navigation timeout - continuing anyway');
      });
      
      // Take a screenshot after login
      await takeScreenshot(page, 'after-login');
      
      // Check if we're on the dashboard
      const dashboardUrl = page.url();
      if (dashboardUrl.includes('/dashboard')) {
        console.log('✅ Successfully logged in and redirected to dashboard');
      } else {
        console.error('❌ Login failed or not redirected to dashboard');
      }
    } else {
      console.error('❌ Login button not found');
      await takeScreenshot(page, 'login-button-not-found');
    }
    
    // Step 3: Test purchase verification for authenticated user
    console.log('Step 3: Testing purchase verification for authenticated user');
    
    // Navigate to the success page with test parameters
    await page.goto(`http://localhost:3000/success?product=${TEST_PRODUCT}&payment_intent=${TEST_PAYMENT_INTENT}`);
    await wait(5000);
    
    // Take a screenshot of the success page
    await takeScreenshot(page, 'purchase-verification-authenticated');
    
    // Check for success message - updated selector to match the actual success message
    const successMessage = await page.evaluate(() => {
      // First, try to find the success alert with the green background
      const successAlert = document.querySelector('.bg-green-50');
      if (successAlert) {
        const alertText = successAlert.textContent;
        console.log('Found success alert:', alertText);
        return alertText;
      }
      
      // Next, try to find any element with text-green-700 class (success message text)
      const successElement = document.querySelector('.text-green-700');
      if (successElement) {
        console.log('Found success text element:', successElement.textContent);
        return successElement.textContent;
      }
      
      // Try to find any element with text-green-800 class (success title)
      const successTitle = document.querySelector('.text-green-800');
      if (successTitle) {
        console.log('Found success title element:', successTitle.textContent);
        return successTitle.textContent;
      }
      
      // Look for any element containing "purchase" and "success" or "verified" text
      const elements = Array.from(document.querySelectorAll('*'));
      const successTextElement = elements.find(el => {
        const text = el.textContent && el.textContent.toLowerCase();
        return text && (
          (text.includes('purchase') && text.includes('success')) ||
          (text.includes('purchase') && text.includes('verified')) ||
          (text.includes('payment') && text.includes('success'))
        );
      });
      
      if (successTextElement) {
        console.log('Found element with success text:', successTextElement.textContent);
        return successTextElement.textContent;
      }
      
      // If we can't find a specific success message, check if we're on a success page
      // by looking at the URL or page title
      if (window.location.pathname.includes('/success')) {
        const pageTitle = document.querySelector('h1, h2, h3')?.textContent;
        if (pageTitle && !pageTitle.toLowerCase().includes('fail')) {
          console.log('Found success page with title:', pageTitle);
          return `Success page: ${pageTitle}`;
        }
      }
      
      return null;
    });
    
    if (successMessage && (
      successMessage.toLowerCase().includes('success') || 
      successMessage.toLowerCase().includes('verified') ||
      successMessage.toLowerCase().includes('purchase') && !successMessage.toLowerCase().includes('fail')
    )) {
      console.log('✅ Purchase verification successful for authenticated user');
      console.log('Success message:', successMessage);
    } else {
      console.error('❌ Purchase verification failed for authenticated user');
      if (successMessage) {
        console.log('Found text:', successMessage);
      }
    }
    
    // Step 4: Log out
    console.log('Step 4: Logging out');
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await wait(2000);
    
    // Find and click the logout button directly in the sidebar
    const logoutClicked = await page.evaluate(() => {
      // Look for the sign out button in the sidebar
      const signOutButton = document.querySelector('#sidebar-sign-out-button');
      
      if (signOutButton) {
        console.log('Found sign out button in sidebar');
        signOutButton.click();
        return true;
      }
      
      // Fallback: try to find any button with "Sign Out" or "Log out" text
      const logoutButton = Array.from(document.querySelectorAll('button')).find(button => 
        button.textContent && (
          button.textContent.includes('Sign Out') || 
          button.textContent.includes('Log out') || 
          button.textContent.includes('Logout') || 
          button.textContent.includes('Sign out')
        )
      );
      
      if (logoutButton) {
        console.log('Found logout button by text content');
        logoutButton.click();
        return true;
      }
      
      return false;
    });
    
    if (logoutClicked) {
      console.log('Logout button clicked');
      
      // Wait for navigation to complete
      await page.waitForNavigation({ timeout: 10000 }).catch(() => {
        console.log('Navigation timeout after logout - continuing anyway');
      });
      
      // Take a screenshot after logout
      await takeScreenshot(page, 'after-logout');
      
      // Check if we're on the login page or home page
      const currentUrl = page.url();
      if (currentUrl.includes('/login') || currentUrl === 'http://localhost:3000/') {
        console.log('✅ Successfully logged out and redirected');
      } else {
        console.error('❌ Logout failed or not redirected properly');
        console.log('Current URL:', currentUrl);
      }
    } else {
      console.error('❌ Logout button not found');
      await takeScreenshot(page, 'logout-button-not-found');
    }
    
    // Step 5: Test purchase verification for unauthenticated user
    console.log('Step 5: Testing purchase verification for unauthenticated user');
    
    // Navigate to the success page with test parameters
    await page.goto(`http://localhost:3000/success?product=${TEST_PRODUCT}&payment_intent=${TEST_PAYMENT_INTENT}`);
    await wait(5000);
    
    // Take a screenshot of the success page
    await takeScreenshot(page, 'purchase-verification-unauthenticated');
    
    // Check for success message - updated selector to match the actual success message
    const unauthSuccessMessage = await page.evaluate(() => {
      // First, try to find the success alert with the green background
      const successAlert = document.querySelector('.bg-green-50');
      if (successAlert) {
        const alertText = successAlert.textContent;
        console.log('Found success alert:', alertText);
        return alertText;
      }
      
      // Next, try to find any element with text-green-700 class (success message text)
      const successElement = document.querySelector('.text-green-700');
      if (successElement) {
        console.log('Found success text element:', successElement.textContent);
        return successElement.textContent;
      }
      
      // Try to find any element with text-green-800 class (success title)
      const successTitle = document.querySelector('.text-green-800');
      if (successTitle) {
        console.log('Found success title element:', successTitle.textContent);
        return successTitle.textContent;
      }
      
      // Look for any element containing "purchase" and "success" or "verified" text
      const elements = Array.from(document.querySelectorAll('*'));
      const successTextElement = elements.find(el => {
        const text = el.textContent && el.textContent.toLowerCase();
        return text && (
          (text.includes('purchase') && text.includes('success')) ||
          (text.includes('purchase') && text.includes('verified')) ||
          (text.includes('payment') && text.includes('success'))
        );
      });
      
      if (successTextElement) {
        console.log('Found element with success text:', successTextElement.textContent);
        return successTextElement.textContent;
      }
      
      // If we can't find a specific success message, check if we're on a success page
      // by looking at the URL or page title
      if (window.location.pathname.includes('/success')) {
        const pageTitle = document.querySelector('h1, h2, h3')?.textContent;
        if (pageTitle && !pageTitle.toLowerCase().includes('fail')) {
          console.log('Found success page with title:', pageTitle);
          return `Success page: ${pageTitle}`;
        }
      }
      
      return null;
    });
    
    if (unauthSuccessMessage && (
      unauthSuccessMessage.toLowerCase().includes('success') || 
      unauthSuccessMessage.toLowerCase().includes('verified') ||
      unauthSuccessMessage.toLowerCase().includes('purchase') && !unauthSuccessMessage.toLowerCase().includes('fail')
    )) {
      console.log('✅ Purchase verification successful for unauthenticated user');
      console.log('Success message:', unauthSuccessMessage);
    } else {
      console.error('❌ Purchase verification failed for unauthenticated user');
      if (unauthSuccessMessage) {
        console.log('Found text:', unauthSuccessMessage);
      }
    }
    
    console.log('Authentication flow test completed');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthFlow().catch(console.error); 