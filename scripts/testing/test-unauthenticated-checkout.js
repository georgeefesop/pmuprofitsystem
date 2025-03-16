const puppeteer = require('puppeteer');

/**
 * Test script to verify the unauthenticated checkout flow
 * 
 * This script:
 * 1. Opens the pricing template purchase page
 * 2. Clicks the "Buy Now" button
 * 3. Verifies redirection to Stripe checkout
 * 4. Simulates a successful payment (by directly accessing the success page with params)
 * 5. Verifies the success page shows the correct information
 */
async function testUnauthenticatedCheckout() {
  console.log('Starting unauthenticated checkout test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1280,800']
  });
  
  try {
    const page = await browser.newPage();
    
    // Step 1: Navigate to the pricing template purchase page
    console.log('Navigating to pricing template purchase page...');
    await page.goto('http://localhost:3000/pricing-template', { waitUntil: 'networkidle2' });
    
    // Take a screenshot of the purchase page
    await page.screenshot({ path: 'purchase-page.png' });
    console.log('Screenshot saved: purchase-page.png');
    
    // Step 2: Find and click the "Buy Now" button
    console.log('Looking for the Buy Now button...');
    
    // Wait for the button to be visible
    await page.waitForSelector('button.bg-blue-600', { timeout: 5000 });
    
    // Find the button with the blue background (primary button)
    const buyButton = await page.$('button.bg-blue-600');
    
    if (!buyButton) {
      // Fallback: try to find a button with "Buy Now" text
      console.log('Primary button not found, looking for button with "Buy Now" text...');
      
      const buttons = await page.$$('button');
      let found = false;
      
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Buy Now') || text.includes('Purchase') || text.includes('Get')) {
          console.log(`Found button with text: ${text}`);
          buyButton = button;
          found = true;
          break;
        }
      }
      
      if (!found) {
        throw new Error('Buy Now button not found');
      }
    }
    
    // Click the button
    console.log('Clicking the Buy Now button...');
    await buyButton.click();
    
    // Step 3: Wait for redirection to Stripe checkout
    console.log('Waiting for redirection to Stripe checkout...');
    
    // Wait for navigation to complete
    await page.waitForNavigation({ timeout: 10000 });
    
    // Get the current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Verify we're on the Stripe checkout page
    if (!currentUrl.includes('checkout.stripe.com')) {
      throw new Error(`Not redirected to Stripe checkout. Current URL: ${currentUrl}`);
    }
    
    console.log('Successfully redirected to Stripe checkout!');
    
    // Take a screenshot of the Stripe checkout page
    await page.screenshot({ path: 'stripe-checkout.png' });
    console.log('Screenshot saved: stripe-checkout.png');
    
    // Step 4: Simulate a successful payment by directly accessing the success page
    console.log('Simulating successful payment...');
    
    // Generate a fake payment intent ID
    const fakePaymentIntentId = `pi_${Math.random().toString(36).substring(2, 15)}`;
    
    // Navigate to the success page with the necessary parameters
    await page.goto(`http://localhost:3000/success?product=pricing-template&payment_intent=${fakePaymentIntentId}`, 
      { waitUntil: 'networkidle2' });
    
    // Step 5: Verify the success page shows the correct information
    console.log('Verifying success page...');
    
    // Wait for the success page to load
    await page.waitForSelector('h2', { timeout: 5000 });
    
    // Check if the success page shows a success message
    const pageTitle = await page.$eval('h2', el => el.textContent);
    console.log('Page title:', pageTitle);
    
    if (!pageTitle.includes('Success') && !pageTitle.includes('Purchase Successful')) {
      throw new Error(`Success message not found. Page title: ${pageTitle}`);
    }
    
    // Take a screenshot of the success page
    await page.screenshot({ path: 'success-page.png' });
    console.log('Screenshot saved: success-page.png');
    
    // Check if there's a login button for unauthenticated users
    const hasLoginButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(button => 
        button.textContent.includes('Log In') || 
        button.textContent.includes('Login') || 
        button.textContent.includes('Sign In')
      );
    });
    
    if (!hasLoginButton) {
      console.warn('Warning: Login button not found on success page for unauthenticated user');
    } else {
      console.log('Login button found on success page for unauthenticated user');
    }
    
    console.log('Unauthenticated checkout test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    
    // Take a screenshot of the error state
    try {
      const page = (await browser.pages())[0];
      await page.screenshot({ path: 'error-state.png' });
      console.log('Error screenshot saved: error-state.png');
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError);
    }
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testUnauthenticatedCheckout().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
}); 