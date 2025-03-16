const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '../../test-output');
const LOG_FILE = path.join(OUTPUT_DIR, 'addon-checkout-test.log');
const TEST_EMAIL = `test-${uuidv4().substring(0, 8)}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create log stream
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

// Helper function to log messages
function log(message, data) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data) : ''}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Helper function to take screenshots
async function takeScreenshot(page, name) {
  try {
    const screenshotPath = path.join(OUTPUT_DIR, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log(`Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    log(`Error taking screenshot: ${error.message}`);
  }
}

// Helper function to set up console logging
function setupConsoleLogging(page) {
  page.on('console', message => {
    const type = message.type().substr(0, 3).toUpperCase();
    const text = message.text();
    log(`BROWSER ${type}: ${text}`);
  });
}

// Helper function to set up network logging
function setupNetworkLogging(page) {
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();
    
    // Only log API calls and errors
    if (url.includes('/api/') || status >= 400) {
      log(`NETWORK: ${status} ${response.request().method()} ${url}`);
      
      // Try to log response body for API calls
      if (url.includes('/api/')) {
        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('application/json')) {
            const responseBody = await response.json().catch(() => 'Could not parse JSON');
            log(`RESPONSE: ${url}`, responseBody);
          }
        } catch (error) {
          log(`Error parsing response: ${error.message}`);
        }
      }
    }
  });
}

// Helper function to delay execution
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test function
async function testAddonCheckoutFlow() {
  log('Starting add-on checkout flow test');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    setupConsoleLogging(page);
    setupNetworkLogging(page);
    
    // Step 1: Log in with a test account
    log('Step 1: Logging in with a test account');
    await page.goto(`${BASE_URL}/login`);
    await takeScreenshot(page, '1-login-page');
    
    // Use a predefined test account
    const TEST_EMAIL = 'test@example.com';
    const TEST_PASSWORD = 'password123';
    
    // Fill out the login form
    await page.type('input[name="email"]', TEST_EMAIL);
    await page.type('input[name="password"]', TEST_PASSWORD);
    
    // Click the login button and wait for navigation
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(e => {
        log(`Navigation after login failed: ${e.message}`);
      }),
    ]);
    
    await takeScreenshot(page, '2-after-login');
    log(`Attempted login with email: ${TEST_EMAIL}`);
    
    // Check if we're redirected to the dashboard, which indicates successful login
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      log('Login successful, redirected to dashboard');
    } else {
      log(`Warning: Not redirected to dashboard after login. Current URL: ${currentUrl}`);
      log('Proceeding with test anyway...');
    }
    
    // Step 2: Navigate to the blueprint purchase page
    log('Step 2: Navigating to the blueprint purchase page');
    await page.goto(`${BASE_URL}/dashboard/blueprint/purchase`);
    await takeScreenshot(page, '3-blueprint-purchase-page');
    
    // Check if we're on the purchase page or redirected to login
    const purchasePageUrl = page.url();
    if (purchasePageUrl.includes('/login')) {
      log('Redirected to login page. Test account may not exist or session not established.');
      throw new Error('Authentication failed. Please ensure test account exists.');
    }
    
    // Step 3: Click the Buy Now button which now redirects directly to Stripe
    log('Step 3: Clicking the Buy Now button');
    
    // Make sure the Buy Now button exists
    const buyNowButton = await page.$('button[type="button"]:not([disabled])');
    if (!buyNowButton) {
      throw new Error('Buy Now button not found on the page');
    }
    
    // Check if the button contains the text "Buy Now"
    const buttonText = await page.evaluate(button => button.textContent, buyNowButton);
    log(`Found button with text: ${buttonText}`);
    
    if (!buttonText.includes('Buy Now')) {
      throw new Error(`Button found but does not contain "Buy Now" text. Found: "${buttonText}"`);
    }
    
    // Wait for network requests to complete after clicking the button
    try {
      const [checkoutResponse] = await Promise.all([
        page.waitForResponse(response => 
          response.url().includes('/api/create-checkout-session') && 
          response.status() === 200,
          { timeout: 10000 }
        ),
        buyNowButton.click(),
      ]);
      
      // Check if the button text changed to "Redirecting..."
      try {
        await page.waitForFunction(
          () => document.querySelector('button:disabled span')?.textContent.includes('Redirecting'),
          { timeout: 2000 }
        );
        log('Button text changed to "Redirecting..." as expected');
      } catch (error) {
        log('Warning: Could not verify button text change to "Redirecting..."');
      }
      
      // Log the checkout session response
      const checkoutData = await checkoutResponse.json();
      log(`Checkout session created:`, checkoutData);
      
      // Wait for redirect to Stripe
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
      await takeScreenshot(page, '4-stripe-checkout-page');
      
      // Verify we're on the Stripe checkout page
      const stripeUrl = page.url();
      if (stripeUrl.includes('checkout.stripe.com')) {
        log('Successfully redirected to Stripe checkout page');
      } else {
        throw new Error(`Expected Stripe checkout URL, got: ${stripeUrl}`);
      }
      
      // Step 4: Complete the Stripe checkout with test card
      log('Step 4: Completing Stripe checkout with test card');
      
      // Fill in the test card details
      // Note: Stripe's test mode allows using 4242 4242 4242 4242 as a test card
      // Wait for the card element iframe to be available
      await page.waitForSelector('iframe[name^="__privateStripeFrame"]');
      
      // Get all iframes on the page
      const iframes = await page.frames();
      
      // Find the Stripe card iframe
      const cardFrame = iframes.find(frame => 
        frame.url().includes('js.stripe.com') && 
        frame.name().includes('__privateStripeFrame')
      );
      
      if (!cardFrame) {
        throw new Error('Could not find Stripe card iframe');
      }
      
      // Fill in card details in the iframe
      await cardFrame.waitForSelector('[placeholder="Card number"]');
      await cardFrame.type('[placeholder="Card number"]', '4242424242424242');
      await cardFrame.type('[placeholder="MM / YY"]', '1230');
      await cardFrame.type('[placeholder="CVC"]', '123');
      
      // Fill in other required fields if they exist
      try {
        await page.waitForSelector('#email', { timeout: 2000 });
        await page.type('#email', TEST_EMAIL);
      } catch (error) {
        log('Email field not found, may be pre-filled or not required');
      }
      
      try {
        await page.waitForSelector('#billingName', { timeout: 2000 });
        await page.type('#billingName', 'Test User');
      } catch (error) {
        log('Billing name field not found, may be pre-filled or not required');
      }
      
      // Take screenshot before submitting
      await takeScreenshot(page, '5-filled-stripe-form');
      
      // Click the submit button
      const submitButton = await page.waitForSelector('button[type="submit"]');
      await submitButton.click();
      
      // Wait for redirect to success page
      log('Waiting for redirect to success page...');
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
      await takeScreenshot(page, '6-after-payment-submission');
      
      // Check if we're on the success page
      const successUrl = page.url();
      log(`Current URL after payment: ${successUrl}`);
      
      if (successUrl.includes('/checkout/success')) {
        log('Successfully redirected to checkout success page');
        
        // Wait for the success page to fully load
        await page.waitForSelector('h1', { timeout: 10000 });
        await takeScreenshot(page, '7-success-page');
        
        // Check for error messages
        const errorElements = await page.$$('div.bg-red-100');
        let hasError = false;
        
        if (errorElements.length > 0) {
          for (const element of errorElements) {
            const errorText = await page.evaluate(el => el.textContent, element);
            log(`Error found on success page: ${errorText}`);
            hasError = true;
          }
          
          if (hasError) {
            throw new Error('Error found on success page');
          }
        }
        
        // Check for success message
        const successElements = await page.$$('h1');
        let hasSuccess = false;
        
        for (const element of successElements) {
          const text = await page.evaluate(el => el.textContent, element);
          if (text.includes('Thank You') || text.includes('Order Confirmation')) {
            log(`Success message found on page: ${text}`);
            hasSuccess = true;
            break;
          }
        }
        
        if (!hasSuccess) {
          log('Warning: Success message not found on page');
        }
        
        // Click the "Go to Dashboard" button
        const dashboardButtons = await page.$$('button');
        let dashboardButton = null;
        
        for (const button of dashboardButtons) {
          const text = await page.evaluate(el => el.textContent, button);
          if (text.includes('Go to Dashboard')) {
            dashboardButton = button;
            break;
          }
        }
        
        if (dashboardButton) {
          await Promise.all([
            dashboardButton.click(),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
          ]);
          
          await takeScreenshot(page, '8-dashboard-after-purchase');
          
          // Verify we're on the dashboard or product page
          const finalUrl = page.url();
          if (finalUrl.includes('/dashboard')) {
            log(`Successfully navigated to dashboard: ${finalUrl}`);
          } else {
            log(`Warning: Not on dashboard after clicking button. Current URL: ${finalUrl}`);
          }
        } else {
          log('Warning: Dashboard button not found on success page');
        }
      } else {
        throw new Error(`Not redirected to success page. Current URL: ${successUrl}`);
      }
      
      log('Add-on checkout flow test completed successfully');
    } catch (error) {
      log(`Error during checkout process: ${error.message}`);
      await takeScreenshot(page, 'error-during-checkout');
      throw error;
    }
  } catch (error) {
    log(`Test failed: ${error.message}`);
    console.error(error);
  } finally {
    await browser.close();
    logStream.end();
  }
}

// Run the test
testAddonCheckoutFlow().catch(console.error); 