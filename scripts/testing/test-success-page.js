const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Create output directory if it doesn't exist
const outputDir = path.join(process.cwd(), 'browser-test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Helper function to save screenshots
async function saveScreenshot(page, name) {
  const timestamp = Date.now();
  const screenshotPath = path.join(outputDir, `${name}-${timestamp}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

// Helper function to log browser console messages
function setupConsoleLogging(page) {
  page.on('console', message => {
    const type = message.type().substr(0, 3).toUpperCase();
    const text = message.text();
    console.log(`[${new Date().toISOString()}] Browser console [${type}]: ${text}`);
  });
}

async function testSuccessPage() {
  console.log(`[${new Date().toISOString()}] Starting success page test`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  let page;
  
  try {
    page = await browser.newPage();
    setupConsoleLogging(page);
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Test 1: Unauthenticated user with valid parameters
    console.log(`[${new Date().toISOString()}] Test 1: Unauthenticated user with valid parameters`);
    
    // Navigate to success page with valid parameters
    const testUrl = 'http://localhost:3000/success?product=pricing-template&payment_intent=pi_test_123456';
    console.log(`[${new Date().toISOString()}] Navigating to: ${testUrl}`);
    await page.goto(testUrl, { waitUntil: 'networkidle0' });
    
    // Take a screenshot
    await saveScreenshot(page, 'success-page-test-1-unauthenticated');
    
    // Check if the page shows a success or verification message
    const pageContent = await page.content();
    const hasSuccessMessage = pageContent.includes('Success') || 
                             pageContent.includes('Verifying') || 
                             pageContent.includes('Purchase');
    
    if (hasSuccessMessage) {
      console.log(`[${new Date().toISOString()}] Test 1 passed: Success page shows appropriate message`);
    } else {
      console.error(`[${new Date().toISOString()}] Test 1 failed: Success page does not show appropriate message`);
    }
    
    // Test 2: Invalid parameters
    console.log(`[${new Date().toISOString()}] Test 2: Invalid parameters`);
    
    // Navigate to success page with invalid parameters
    const invalidUrl = 'http://localhost:3000/success';
    console.log(`[${new Date().toISOString()}] Navigating to: ${invalidUrl}`);
    await page.goto(invalidUrl, { waitUntil: 'networkidle0' });
    
    // Take a screenshot
    await saveScreenshot(page, 'success-page-test-2-invalid-params');
    
    // Check if the page shows an error message
    const invalidPageContent = await page.content();
    const hasErrorMessage = invalidPageContent.includes('Error') || 
                           invalidPageContent.includes('Failed') || 
                           invalidPageContent.includes('Invalid');
    
    if (hasErrorMessage) {
      console.log(`[${new Date().toISOString()}] Test 2 passed: Success page shows error message for invalid parameters`);
    } else {
      console.error(`[${new Date().toISOString()}] Test 2 failed: Success page does not show error message for invalid parameters`);
    }
    
    // Test 3: Authenticated user (requires login first)
    console.log(`[${new Date().toISOString()}] Test 3: Authenticated user (requires login first)`);
    
    // Navigate to login page
    console.log(`[${new Date().toISOString()}] Navigating to login page`);
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    // Take a screenshot
    await saveScreenshot(page, 'success-page-test-3-login-page');
    
    // Fill in login form
    console.log(`[${new Date().toISOString()}] Filling in login form`);
    await page.type('#email', 'george.efesopf@gmail.com');
    await page.type('#password', 'Wheels99!');
    
    // Submit login form
    console.log(`[${new Date().toISOString()}] Submitting login form`);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
    
    // Take a screenshot after login
    await saveScreenshot(page, 'success-page-test-3-after-login');
    
    // Navigate to success page with valid parameters
    const authenticatedUrl = 'http://localhost:3000/success?product=pricing-template&payment_intent=pi_test_123456';
    console.log(`[${new Date().toISOString()}] Navigating to: ${authenticatedUrl}`);
    await page.goto(authenticatedUrl, { waitUntil: 'networkidle0' });
    
    // Take a screenshot
    await saveScreenshot(page, 'success-page-test-3-authenticated');
    
    // Check if the page shows a success message
    const authenticatedPageContent = await page.content();
    const hasAuthSuccessMessage = authenticatedPageContent.includes('Success') || 
                                 authenticatedPageContent.includes('Verifying') || 
                                 authenticatedPageContent.includes('Purchase');
    
    if (hasAuthSuccessMessage) {
      console.log(`[${new Date().toISOString()}] Test 3 passed: Success page shows appropriate message for authenticated user`);
    } else {
      console.error(`[${new Date().toISOString()}] Test 3 failed: Success page does not show appropriate message for authenticated user`);
    }
    
    console.log(`[${new Date().toISOString()}] All tests completed`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Test failed:`, error);
    if (page) {
      await saveScreenshot(page, 'success-page-test-error');
    }
  } finally {
    await browser.close();
    console.log(`[${new Date().toISOString()}] Test completed`);
  }
}

// Run the test
testSuccessPage().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
}); 