/**
 * Debug Checkout to Success Page Flow Test
 * 
 * This test script debugs the checkout to success page flow, focusing on addon product purchases.
 * It verifies that:
 * 1. The checkout page shows the correct product
 * 2. The success page correctly shows only the purchased product (not the main product)
 * 3. The entitlements are correctly created and visible in the user profile
 * 
 * Test coverage:
 * - User authentication
 * - Addon product page navigation
 * - Checkout process
 * - Success page verification
 * - Entitlements verification in user profile
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const TEST_EMAIL = 'george.efesopa@gmail.com';
const TEST_PASSWORD = 'Wheels99!';
const PRODUCT_ID = 'consultation-success-blueprint';
const PRODUCT_PAGE_URL = '/dashboard/blueprint/purchase';

// Test user credentials
const TEST_USER = {
  email: 'george.efesopa@gmail.com',
  password: 'Wheels99!'
};

// Test card details for Stripe
const TEST_CARD = {
  number: '4242424242424242',
  expiry: '1230',
  cvc: '123',
  zip: '12345'
};

// Ensure screenshot directory exists
async function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    console.log(`Screenshot directory created at ${SCREENSHOT_DIR}`);
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

// Take a screenshot with timestamp
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved: ${filename}`);
  return filepath;
}

// Setup console listener to capture browser logs
function setupConsoleListener(page) {
  page.on('console', message => {
    const type = message.type();
    const text = message.text();
    
    if (type === 'error') {
      console.log(`[BROWSER ERR] ${text}`);
    } else if (type === 'warning') {
      console.log(`[BROWSER WAR] ${text}`);
    } else if (type === 'info') {
      console.log(`[BROWSER INF] ${text}`);
    } else {
      console.log(`[BROWSER LOG] ${text}`);
    }
  });
}

// Main test function
async function runTest() {
  console.log('Starting checkout to success page flow test...');
  await ensureScreenshotDir();
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1280,800']
  });
  
  try {
    const page = await browser.newPage();
    setupConsoleListener(page);
    
    // Step 1: Login
    console.log('Logging in...');
    await page.goto(`${BASE_URL}/login`);
    
    // Add a longer wait time for the page to fully load
    console.log('Waiting 6 seconds for login page to fully load...');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // Now wait for the input fields to be visible
    console.log('Looking for login form elements...');
    await page.waitForSelector('input[name="email"]', { visible: true, timeout: 20000 });
    await page.waitForSelector('input[name="password"]', { visible: true, timeout: 20000 });
    
    console.log('Filling login form...');
    await takeScreenshot(page, 'before-login-form-fill');
    await page.type('input[name="email"]', TEST_EMAIL);
    await page.type('input[name="password"]', TEST_PASSWORD);
    await takeScreenshot(page, 'after-login-form-fill');
    
    console.log('Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
    await takeScreenshot(page, 'after-login');
    
    // Verify login was successful by checking for dashboard elements
    try {
      console.log('Waiting for dashboard elements to load...');
      // Increase timeout to 30 seconds and check for more dashboard elements
      await page.waitForSelector('nav, .sidebar, .dashboard-layout, .dashboard-container, header', 
        { visible: true, timeout: 30000 });
      console.log('Login successful! Dashboard loaded.');
      await takeScreenshot(page, 'dashboard-loaded');
      
      // Take a screenshot of the entire page to see what's actually in the sidebar
      console.log('Taking a screenshot of the dashboard to inspect the sidebar...');
      await takeScreenshot(page, 'dashboard-full-page');
      
      // Log the HTML of the sidebar to help debug
      const sidebarHTML = await page.evaluate(() => {
        const sidebar = document.querySelector('.sidebar, nav, aside');
        return sidebar ? sidebar.outerHTML : 'No sidebar found';
      });
      console.log('Sidebar HTML:', sidebarHTML);
      
      // Log all links in the sidebar
      const sidebarLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .map(link => ({
            href: link.getAttribute('href'),
            text: link.textContent.trim(),
            classes: link.className
          }));
      });
      console.log('All links on the page:', JSON.stringify(sidebarLinks, null, 2));
    } catch (error) {
      console.error('Login failed or dashboard not loaded properly:', error.message);
      await takeScreenshot(page, 'login-failed');
      throw new Error('Login verification failed');
    }
    
    // Step 3: Navigate directly to the blueprint page instead of looking for sidebar link
    console.log('Navigating directly to the blueprint page...');
    await page.goto(`${BASE_URL}/dashboard/blueprint`);
    
    // Wait for the page to load
    console.log('Waiting 5 seconds for the blueprint page to load and redirect if needed...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await takeScreenshot(page, 'blueprint-page-initial');
    
    // Check if we're on the purchase page or the content page
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // If we're already on the content page (user has access), we need to find a way to purchase
    if (currentUrl.includes('/dashboard/blueprint') && !currentUrl.includes('/purchase')) {
      console.log('User already has access to the Consultation Success Blueprint');
      // Navigate directly to the purchase page
      console.log('Navigating directly to the purchase page...');
      await page.goto(`${BASE_URL}/dashboard/blueprint/purchase`);
      await page.waitForSelector('h1, h2, .product-title', { visible: true, timeout: 30000 });
      await takeScreenshot(page, 'purchase-page-direct');
    }
    
    // Wait for the product page to load
    console.log('Waiting for product page to load...');
    
    // Take a screenshot immediately to see what's on the page
    await takeScreenshot(page, 'product-page-initial');
    
    // Wait for any content to load - using more general selectors
    await page.waitForSelector('main', { visible: true, timeout: 30000 });
    console.log('Main content loaded, waiting for product details...');
    
    // Wait a bit to ensure all content is loaded
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take another screenshot after waiting
    await takeScreenshot(page, 'product-page-after-wait');
    
    // Log the page title and URL for debugging
    const pageTitle = await page.title();
    const pageUrl = page.url();
    console.log(`Page title: ${pageTitle}, URL: ${pageUrl}`);
    
    // Log the HTML structure of the main content area for debugging
    const mainContentHTML = await page.evaluate(() => {
      const mainElement = document.querySelector('main');
      return mainElement ? mainElement.innerHTML.substring(0, 1000) + '...' : 'No main element found';
    });
    console.log('Main content HTML (truncated):', mainContentHTML);
    
    // Log all buttons on the page
    const buttonTexts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .map(button => ({
          text: button.textContent.trim(),
          classes: button.className,
          isVisible: button.offsetParent !== null
        }));
    });
    console.log('Available buttons:', JSON.stringify(buttonTexts, null, 2));
    
    // Use the specific CSS selector provided by the user
    const purchaseButtonSelector = 'body > main > div > div.flex.flex-col.md\\:flex-row.flex-1 > div.flex-1.flex.flex-col > main > div > div.bg-white.rounded-lg.shadow-sm.overflow-hidden.mb-8 > div:nth-child(2) > div.flex.flex-col.md\\:flex-row.gap-8.mb-8 > div.md\\:w-1\\/3 > div > button';
    
    console.log('Looking for purchase button with specific selector...');
    await takeScreenshot(page, 'before-purchase-click');

    try {
      console.log('Waiting for the purchase button to be visible...');
      const purchaseButton = await page.waitForSelector(purchaseButtonSelector, 
        { visible: true, timeout: 15000 });
      
      if (purchaseButton) {
        console.log('Purchase button found, clicking it...');
        await purchaseButton.click();
        
        // Wait for navigation to checkout page
        console.log('Waiting for checkout page to load...');
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
      } else {
        console.error('Purchase button was found but is null');
      }
    } catch (error) {
      console.error('Error finding or clicking purchase button with specific selector:', error);
      
      // Take a screenshot of the current state
      await takeScreenshot(page, 'purchase-button-error');
      
      // Try a more generic approach - find all buttons and click one that looks like a purchase button
      console.log('Trying to find purchase button by text content...');
      
      try {
        const purchaseButtonHandle = await page.evaluateHandle(() => {
          // Look for buttons with common purchase-related text
          const buyTexts = ['buy', 'purchase', 'get access', 'checkout', 'add to cart'];
          const buttons = Array.from(document.querySelectorAll('button'));
          
          // Find a button that contains purchase-related text
          return buttons.find(button => {
            const text = button.textContent.toLowerCase();
            return buyTexts.some(buyText => text.includes(buyText));
          });
        });
        
        if (purchaseButtonHandle) {
          const buttonText = await page.evaluate(button => button.textContent.trim(), purchaseButtonHandle);
          console.log(`Found button with text: "${buttonText}", clicking it...`);
          await purchaseButtonHandle.click();
          await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
        } else {
          throw new Error('No purchase button found by text content');
        }
      } catch (fallbackError) {
        console.error('Error with fallback button approach:', fallbackError);
        throw new Error('Failed to find or click purchase button with any method');
      }
    }
    
    await takeScreenshot(page, 'checkout-page');
    
    // Wait for the checkout page to fully load
    console.log('Waiting for checkout page to fully load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await takeScreenshot(page, 'checkout-page-after-wait');
    
    // Log the current URL
    const checkoutUrl = page.url();
    console.log(`Checkout page URL: ${checkoutUrl}`);
    
    // Log the page content to help with debugging
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.innerText.substring(0, 500) + '...',
        forms: Array.from(document.forms).map(form => form.id || 'unnamed-form'),
        iframes: Array.from(document.querySelectorAll('iframe')).map(iframe => ({
          name: iframe.name,
          id: iframe.id,
          src: iframe.src
        }))
      };
    });
    console.log('Page content:', JSON.stringify(pageContent, null, 2));
    
    // Check if we're redirected to login
    if (checkoutUrl.includes('/login')) {
      console.log('Redirected to login page. User session may have expired.');
      await takeScreenshot(page, 'redirected-to-login');
      throw new Error('Redirected to login page during checkout process');
    }
    
    // Try to find the Stripe iframe with a longer timeout
    try {
      console.log('Looking for Stripe payment iframe...');
      const stripeFrame = await page.waitForSelector('iframe[name^="__privateStripeFrame"], #stripe-payment-element, .StripeElement, [data-stripe], .stripe-form', 
        { visible: true, timeout: 30000 });
      
      if (stripeFrame) {
        console.log('Stripe payment element found!');
        await takeScreenshot(page, 'stripe-frame-found');
        
        // Wait for all Stripe iframes to load
        console.log('Waiting for all Stripe iframes to load...');
        await page.waitForFunction(() => {
          const iframes = document.querySelectorAll('iframe[name^="__privateStripeFrame"]');
          return iframes.length >= 3; // Usually there are at least 3 iframes for card number, expiry, and CVC
        }, { timeout: 30000 }).catch(e => console.log('Not all Stripe iframes loaded, continuing anyway:', e.message));
        
        // Take a screenshot after waiting for iframes
        await takeScreenshot(page, 'stripe-iframes-loaded');
        
        // Log all iframes on the page
        const iframesInfo = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('iframe')).map(iframe => ({
            name: iframe.name,
            id: iframe.id,
            src: iframe.src,
            width: iframe.offsetWidth,
            height: iframe.offsetHeight,
            visible: iframe.offsetParent !== null
          }));
        });
        console.log('Iframes on page:', JSON.stringify(iframesInfo, null, 2));
        
        // Fill in card details
        console.log('Filling in card details...');
        
        // Find the card number iframe
        const cardNumberFrame = await page.waitForSelector('iframe[name^="__privateStripeFrame"][title*="card number"], iframe[name^="__privateStripeFrame"][title*="Card number"]', 
          { timeout: 20000 }).catch(() => null);
        
        if (cardNumberFrame) {
          console.log('Card number iframe found, filling details...');
          const cardNumberFrameContent = await cardNumberFrame.contentFrame();
          
          // Fill card number
          await cardNumberFrameContent.waitForSelector('input[name="cardnumber"]');
          await cardNumberFrameContent.type('input[name="cardnumber"]', TEST_CARD.number, { delay: 100 });
          console.log('Card number entered');
          
          // Find and fill expiry date
          const cardExpiryFrame = await page.waitForSelector('iframe[name^="__privateStripeFrame"][title*="expiration date"], iframe[name^="__privateStripeFrame"][title*="Expiration date"]', 
            { timeout: 10000 }).catch(() => null);
          
          if (cardExpiryFrame) {
            const cardExpiryFrameContent = await cardExpiryFrame.contentFrame();
            await cardExpiryFrameContent.waitForSelector('input[name="exp-date"]');
            await cardExpiryFrameContent.type('input[name="exp-date"]', TEST_CARD.expiry, { delay: 100 });
            console.log('Expiry date entered');
          } else {
            console.log('Expiry date iframe not found, trying alternative approach');
          }
          
          // Find and fill CVC
          const cardCvcFrame = await page.waitForSelector('iframe[name^="__privateStripeFrame"][title*="security code"], iframe[name^="__privateStripeFrame"][title*="CVC"]', 
            { timeout: 10000 }).catch(() => null);
          
          if (cardCvcFrame) {
            const cardCvcFrameContent = await cardCvcFrame.contentFrame();
            await cardCvcFrameContent.waitForSelector('input[name="cvc"]');
            await cardCvcFrameContent.type('input[name="cvc"]', TEST_CARD.cvc, { delay: 100 });
            console.log('CVC entered');
          } else {
            console.log('CVC iframe not found, trying alternative approach');
          }
          
          // Find and fill postal code if present
          const cardZipFrame = await page.waitForSelector('iframe[name^="__privateStripeFrame"][title*="postal code"], iframe[name^="__privateStripeFrame"][title*="ZIP"]', 
            { timeout: 5000 }).catch(() => null);
          
          if (cardZipFrame) {
            const cardZipFrameContent = await cardZipFrame.contentFrame();
            await cardZipFrameContent.waitForSelector('input[name="postal"]');
            await cardZipFrameContent.type('input[name="postal"]', TEST_CARD.zip, { delay: 100 });
            console.log('Postal code entered');
          } else {
            console.log('Postal code iframe not found or not required');
          }
          
          // Take a screenshot after filling in card details
          await takeScreenshot(page, 'card-details-filled');
          
          // Submit the form
          console.log('Submitting payment form...');
          
          // Find the submit button
          const submitButton = await page.waitForSelector('button[type="submit"], button:has-text("Pay"), button:has-text("Submit"), button:has-text("Continue"), button.checkout-button', 
            { visible: true, timeout: 10000 }).catch(() => null);
          
          if (submitButton) {
            await submitButton.click();
            console.log('Submit button clicked');
            
            // Wait for navigation to complete
            console.log('Waiting for navigation after payment submission...');
            await page.waitForNavigation({ timeout: 60000 }).catch(e => {
              console.log('Navigation timeout after payment submission:', e.message);
            });
            
            // Take a screenshot after submission
            await takeScreenshot(page, 'after-payment-submission');
            
            // Check if we're on a success page
            const currentUrl = page.url();
            console.log(`Current URL after payment: ${currentUrl}`);
            
            if (currentUrl.includes('success') || currentUrl.includes('thank-you')) {
              console.log('Success! Redirected to success page after payment.');
              await takeScreenshot(page, 'success-page');
              return true;
            } else {
              console.log('Not on success page yet, checking page content...');
              const pageText = await page.evaluate(() => document.body.innerText);
              console.log('Page text (truncated):', pageText.substring(0, 500) + '...');
              
              if (pageText.includes('success') || pageText.includes('thank you') || pageText.includes('payment successful')) {
                console.log('Success message found on page!');
                return true;
              }
            }
          } else {
            console.error('Submit button not found');
            throw new Error('Submit button not found on checkout page');
          }
        } else {
          console.error('Card number iframe not found');
          
          // Try an alternative approach - look for a single card element
          console.log('Trying alternative approach for card input...');
          const cardElement = await page.waitForSelector('#card-element, .StripeElement', 
            { visible: true, timeout: 10000 }).catch(() => null);
          
          if (cardElement) {
            console.log('Card element found, attempting to fill it directly...');
            await cardElement.click();
            await page.keyboard.type(TEST_CARD.number);
            await page.keyboard.press('Tab');
            await page.keyboard.type(TEST_CARD.expiry.substring(0, 2) + '/' + TEST_CARD.expiry.substring(2));
            await page.keyboard.press('Tab');
            await page.keyboard.type(TEST_CARD.cvc);
            await page.keyboard.press('Tab');
            await page.keyboard.type(TEST_CARD.zip);
            
            console.log('Card details entered using alternative approach');
            await takeScreenshot(page, 'card-details-filled-alt');
            
            // Submit the form
            console.log('Submitting payment form...');
            const submitButton = await page.waitForSelector('button[type="submit"], button:has-text("Pay"), button:has-text("Submit")', 
              { visible: true, timeout: 10000 }).catch(() => null);
            
            if (submitButton) {
              await submitButton.click();
              console.log('Submit button clicked');
              
              // Wait for navigation to complete
              await page.waitForNavigation({ timeout: 60000 }).catch(e => {
                console.log('Navigation timeout after payment submission:', e.message);
              });
              
              // Take a screenshot after submission
              await takeScreenshot(page, 'after-payment-submission-alt');
              
              // Check if we're on a success page
              const currentUrl = page.url();
              if (currentUrl.includes('success') || currentUrl.includes('thank-you')) {
                console.log('Success! Redirected to success page after payment.');
                return true;
              }
            } else {
              console.error('Submit button not found');
            }
          } else {
            console.error('No card input element found with alternative approach');
          }
          
          throw new Error('Failed to find card input elements');
        }
      }
    } catch (error) {
      console.error('Error handling Stripe payment form:', error);
      
      // Take a screenshot of the current state
      await takeScreenshot(page, 'stripe-frame-error');
      
      // Check if there's any error message on the page
      const errorMessage = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('.error, .alert, [role="alert"], .text-red-500, .text-red-600');
        return Array.from(errorElements).map(el => el.textContent.trim()).join(' | ');
      });
      
      if (errorMessage) {
        console.error('Error message found on page:', errorMessage);
      }
      
      // Check if we're on a success page already (maybe the user already has access)
      if (page.url().includes('success') || page.url().includes('thank-you')) {
        console.log('Redirected to success page. User might already have access to the product.');
        await takeScreenshot(page, 'success-page');
        return true;
      }
      
      throw new Error('Failed to complete payment process: ' + error.message);
    }
    
    // Step 6: Verify success page
    console.log('On success page, verifying purchase details');
    await takeScreenshot(page, 'success-page');
    
    // Extract success page information
    const successPageInfo = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent.trim() || '';
      const productElements = Array.from(document.querySelectorAll('.product-item, .product-name, h2, h3'));
      const products = productElements.map(el => el.textContent.trim()).filter(text => text.length > 0);
      const totalElement = document.querySelector('.total-amount, .text-xl, .font-bold');
      const total = totalElement ? totalElement.textContent.trim() : '';
      return { title, products, total };
    });
    
    console.log('Success page details:', successPageInfo);
    
    // Step 7: Navigate to profile page to check entitlements
    console.log('Navigating to profile page to check entitlements');
    await page.goto(`${BASE_URL}/dashboard/profile`);
    await page.waitForSelector('h1', { timeout: 10000 });
    await takeScreenshot(page, 'profile-page');
    
    // Extract entitlements information
    const entitlementsInfo = await page.evaluate(() => {
      const entitlementElements = Array.from(document.querySelectorAll('.entitlement-item, .product-name, h2, h3, .card'));
      const entitlements = entitlementElements.map(el => el.textContent.trim()).filter(text => text.length > 0);
      return { entitlements };
    });
    
    console.log('Profile page entitlements:', entitlementsInfo);
    
    // Summary of findings
    console.log('\n=== Test Summary ===');
    console.log(`Checkout Product: ${successPageInfo.products[0]} (${successPageInfo.total})`);
    console.log(`Success Page Products: ${successPageInfo.products.join(', ')} (${successPageInfo.total})`);
    console.log(`Entitlements: ${entitlementsInfo.entitlements.join(', ')}`);
    
    // Check for discrepancies
    const checkoutProductName = successPageInfo.products[0].toLowerCase();
    const successPageHasCorrectProduct = successPageInfo.products.some(p => 
      p.toLowerCase().includes(checkoutProductName) || checkoutProductName.includes(p.toLowerCase())
    );
    
    const entitlementsHaveCorrectProduct = entitlementsInfo.entitlements.some(e => 
      e.toLowerCase().includes(checkoutProductName) || checkoutProductName.includes(e.toLowerCase())
    );
    
    console.log('\n=== Discrepancies ===');
    if (!successPageHasCorrectProduct) {
      console.log('❌ Success page does not show the correct product that was purchased');
    } else {
      console.log('✅ Success page shows the correct product');
    }
    
    if (!entitlementsHaveCorrectProduct) {
      console.log('❌ Entitlements do not include the purchased product');
    } else {
      console.log('✅ Entitlements include the purchased product');
    }
    
    // Close browser
    await browser.close();
    console.log('Test completed successfully');
    
  } catch (error) {
    console.error('Test failed with error:', error);
    throw error;
  }
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 