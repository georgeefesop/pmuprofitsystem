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

async function runTest() {
  console.log(`[${new Date().toISOString()}] Starting unauthenticated add-on checkout test for pricing-template`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    setupConsoleLogging(page);
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate directly to the pricing template purchase page without logging in
    console.log(`[${new Date().toISOString()}] Navigating directly to purchase page as unauthenticated user`);
    await page.goto('http://localhost:3000/pricing-template/purchase', { waitUntil: 'networkidle0' });
    
    // Take a screenshot of the purchase page
    await saveScreenshot(page, 'unauthenticated-addon-checkout-test-1-purchase-page');
    
    // Find and click the purchase button
    console.log(`[${new Date().toISOString()}] Clicking purchase button`);
    
    // Look for a button with blue background (common for primary actions)
    const blueButtonSelector = 'button.bg-blue-600';
    const buyNowSelector = 'button:has-text("Buy Now")';
    
    // Try different selectors to find the button
    let buttonFound = false;
    
    if (await page.$(blueButtonSelector) !== null) {
      console.log(`[${new Date().toISOString()}] Found Buy Now button with blue background class`);
      await page.click(blueButtonSelector);
      buttonFound = true;
    } else if (await page.$(buyNowSelector) !== null) {
      console.log(`[${new Date().toISOString()}] Found Buy Now button by text`);
      await page.click(buyNowSelector);
      buttonFound = true;
    } else {
      // Try to find any button that might be the purchase button
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const buttonText = await page.evaluate(el => el.textContent, button);
        if (buttonText.includes('Buy') || buttonText.includes('Purchase') || buttonText.includes('Get')) {
          console.log(`[${new Date().toISOString()}] Found button with text: ${buttonText}`);
          await button.click();
          buttonFound = true;
          break;
        }
      }
    }
    
    if (!buttonFound) {
      throw new Error('Could not find purchase button');
    }
    
    // Wait for redirect to Stripe or success page
    console.log(`[${new Date().toISOString()}] Waiting for redirect after purchase button click`);
    await page.waitForNavigation({ timeout: 10000 });
    
    // Take a screenshot of where we ended up
    await saveScreenshot(page, 'unauthenticated-addon-checkout-test-2-after-click');
    
    // Check the current URL to see if we were redirected to Stripe
    const currentUrl = await page.url();
    console.log(`[${new Date().toISOString()}] Current URL:`, { url: currentUrl });
    
    if (currentUrl.includes('checkout.stripe.com')) {
      console.log(`[${new Date().toISOString()}] Successfully redirected to Stripe checkout page`);
      await saveScreenshot(page, 'unauthenticated-addon-checkout-test-3-stripe-checkout');
      console.log(`[${new Date().toISOString()}] Test completed successfully - reached Stripe checkout page`);
    } else if (currentUrl.includes('/success')) {
      console.log(`[${new Date().toISOString()}] Redirected to success page, checking for success message`);
      
      // Wait for content to load
      await page.waitForSelector('body', { timeout: 5000 });
      
      // Look for success indicators
      const successElements = await page.$$eval('*', elements => {
        return elements.filter(el => {
          const text = el.textContent.toLowerCase();
          return (
            (text.includes('success') || text.includes('thank you') || text.includes('purchased')) &&
            (text.includes('purchase') || text.includes('payment') || text.includes('order'))
          );
        }).map(el => el.textContent.trim());
      });
      
      if (successElements.length > 0) {
        console.log(`[${new Date().toISOString()}] Found success message:`, successElements[0]);
        console.log(`[${new Date().toISOString()}] Test completed successfully - purchase verified`);
      } else {
        console.log(`[${new Date().toISOString()}] No success message found on page`);
        throw new Error('No success message found on success page');
      }
    } else {
      console.log(`[${new Date().toISOString()}] Unexpected redirect to: ${currentUrl}`);
      throw new Error(`Unexpected redirect to: ${currentUrl}`);
    }
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Test failed:`, error);
    await saveScreenshot(page, 'unauthenticated-addon-checkout-test-error');
    throw error;
  } finally {
    await browser.close();
    console.log(`[${new Date().toISOString()}] Test completed`);
  }
}

// Run the test
runTest().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});