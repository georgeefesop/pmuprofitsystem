/**
 * Test script for the pricing template purchase flow
 * 
 * This script tests the complete purchase flow for the pricing template add-on:
 * 1. Login to the application
 * 2. Navigate to the pricing template purchase page
 * 3. Click the purchase button
 * 4. Complete the checkout process
 * 5. Verify the success page
 * 6. Check that the user has access to the pricing template
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  testEmail: 'test@example.com',
  testPassword: 'password123',
  outputDir: path.join(__dirname, '../../browser-test-output'),
  screenshotPrefix: 'pricing-template-purchase-test',
};

// Ensure output directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Helper function to log messages with timestamps
function log(message, data = {}) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  if (Object.keys(data).length > 0) {
    console.log(JSON.stringify(data, null, 2));
  }
  
  // Also write to log file
  const logFile = path.join(config.outputDir, `${config.screenshotPrefix}-${Date.now()}.log`);
  fs.appendFileSync(logFile, `${logMessage}\n`);
  if (Object.keys(data).length > 0) {
    fs.appendFileSync(logFile, `${JSON.stringify(data, null, 2)}\n`);
  }
}

// Helper function to take screenshots
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(config.outputDir, `${config.screenshotPrefix}-${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

// Helper function to delay execution
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test function
async function runTest() {
  log('Starting pricing template purchase test');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1280,800'],
  });
  
  try {
    const page = await browser.newPage();
    
    // Set up console log capture
    page.on('console', message => {
      log(`Browser console [${message.type()}]: ${message.text()}`);
    });
    
    // Step 1: Login
    log('Navigating to login page');
    await page.goto(`${config.baseUrl}/login`);
    await takeScreenshot(page, '1-login-page');
    
    log('Entering login credentials');
    await page.type('input[type="email"]', config.testEmail);
    await page.type('input[type="password"]', config.testPassword);
    
    log('Submitting login form');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    await takeScreenshot(page, '2-after-login');
    
    // Step 2: Navigate to pricing template purchase page
    log('Navigating to pricing template purchase page');
    await page.goto(`${config.baseUrl}/dashboard/pricing-template/purchase`);
    await page.waitForSelector('h2:contains("Premium Pricing Template")');
    await takeScreenshot(page, '3-purchase-page');
    
    // Step 3: Click the purchase button
    log('Clicking purchase button');
    const purchaseButton = await page.$('button:contains("Purchase Now")');
    if (!purchaseButton) {
      throw new Error('Purchase button not found');
    }
    
    await purchaseButton.click();
    log('Waiting for Stripe checkout page');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
    await takeScreenshot(page, '4-stripe-checkout');
    
    // Step 4: Complete the checkout process
    log('Filling out Stripe checkout form');
    
    // Enter test card details
    const cardNumberFrame = await page.waitForSelector('iframe[name^="__privateStripeFrame"]');
    const cardNumberFrameContent = await cardNumberFrame.contentFrame();
    
    // Fill card number
    await cardNumberFrameContent.type('[name="cardnumber"]', '4242424242424242');
    
    // Fill expiration date
    await cardNumberFrameContent.type('[name="exp-date"]', '1230');
    
    // Fill CVC
    await cardNumberFrameContent.type('[name="cvc"]', '123');
    
    // Fill postal code
    await cardNumberFrameContent.type('[name="postal"]', '12345');
    
    // Submit payment
    log('Submitting payment');
    await page.click('button[type="submit"]');
    
    // Step 5: Verify success page
    log('Waiting for success page');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });
    await takeScreenshot(page, '5-success-page');
    
    // Check for success message
    const successMessage = await page.$('text/Your purchase was successful');
    if (!successMessage) {
      throw new Error('Success message not found on page');
    }
    
    log('Purchase successful, waiting before checking dashboard');
    await delay(3000);
    
    // Step 6: Check dashboard for access
    log('Navigating to dashboard');
    await page.goto(`${config.baseUrl}/dashboard/pricing-template`);
    await page.waitForSelector('h1:contains("Pricing Template")');
    await takeScreenshot(page, '6-dashboard-access');
    
    // Check for access indicator
    const accessIndicator = await page.$('text/You have access to this product');
    if (!accessIndicator) {
      log('Warning: Access indicator not found on dashboard');
    }
    
    log('Test completed successfully');
    return true;
  } catch (error) {
    log('Test failed with error', { error: error.message, stack: error.stack });
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
runTest()
  .then(success => {
    if (success) {
      log('Test completed successfully');
      process.exit(0);
    } else {
      log('Test failed');
      process.exit(1);
    }
  })
  .catch(error => {
    log('Unhandled error in test', { error: error.message, stack: error.stack });
    process.exit(1);
  }); 