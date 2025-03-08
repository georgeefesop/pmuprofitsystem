const { chromium } = require('playwright');

async function testNewUserFlow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Generate a unique email for testing
    const testEmail = `test-user-${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    
    console.log('Starting new user flow test...');
    console.log(`Test email: ${testEmail}`);
    
    // Step 1: Go to the homepage
    console.log('Step 1: Navigating to homepage');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Go directly to pre-checkout to create an account
    console.log('Step 2: Navigating to pre-checkout');
    await page.goto('http://localhost:3000/pre-checkout');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Check if we're on the pre-checkout page
    console.log('Step 3: Checking pre-checkout page');
    
    // Debug: Log the current URL
    console.log(`Current URL: ${page.url()}`);
    
    // Debug: Take a screenshot
    await page.screenshot({ path: 'pre-checkout-page.png' });
    
    // Debug: Log all input fields on the page
    const inputFields = await page.$$('input');
    console.log(`Found ${inputFields.length} input fields`);
    
    for (const input of inputFields) {
      const name = await input.getAttribute('name');
      const type = await input.getAttribute('type');
      const id = await input.getAttribute('id');
      console.log(`Input field: name=${name}, type=${type}, id=${id}`);
    }
    
    // Step 4: Fill out pre-checkout form
    console.log('Step 4: Filling pre-checkout form');
    
    // Try different selectors for the email field
    try {
      if (await page.isVisible('input[name="email"]')) {
        await page.fill('input[name="email"]', testEmail);
      } else if (await page.isVisible('#email')) {
        await page.fill('#email', testEmail);
      } else if (await page.isVisible('input[type="email"]')) {
        await page.fill('input[type="email"]', testEmail);
      } else {
        console.log('Could not find email field');
      }
      
      // Try different selectors for the name field
      if (await page.isVisible('input[name="name"]')) {
        await page.fill('input[name="name"]', 'Test User');
      } else if (await page.isVisible('#name')) {
        await page.fill('#name', 'Test User');
      } else if (await page.isVisible('input[placeholder*="name" i]')) {
        await page.fill('input[placeholder*="name" i]', 'Test User');
      } else {
        console.log('Could not find name field');
      }
    } catch (error) {
      console.error('Error filling form:', error);
    }
    
    // Step 5: Submit the form
    console.log('Step 5: Submitting pre-checkout form');
    try {
      // Try different selectors for the submit button
      if (await page.isVisible('button[type="submit"]')) {
        await page.click('button[type="submit"]');
      } else if (await page.isVisible('button:has-text("Continue")')) {
        await page.click('button:has-text("Continue")');
      } else if (await page.isVisible('button:has-text("Next")')) {
        await page.click('button:has-text("Next")');
      } else {
        console.log('Could not find submit button');
        
        // Debug: Log all buttons on the page
        const buttons = await page.$$('button');
        console.log(`Found ${buttons.length} buttons`);
        
        for (const button of buttons) {
          const text = await button.textContent();
          console.log(`Button text: "${text}"`);
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    
    // Step 6: Check if we're on the signup page
    console.log('Step 6: Checking if we reached signup page');
    const signupUrl = page.url();
    console.log(`URL after pre-checkout: ${signupUrl}`);
    
    if (signupUrl.includes('/signup')) {
      console.log('On signup page, filling signup form');
      
      // Fill out signup form
      try {
        await page.fill('input[name="password"]', testPassword);
        await page.click('button[type="submit"]');
      } catch (error) {
        console.error('Error on signup page:', error);
      }
      
      // Wait for navigation
      await page.waitForTimeout(3000);
    }
    
    // Step 7: Check final destination
    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);
    
    // Take a screenshot of the final page
    await page.screenshot({ path: 'final-page.png' });
    
    // Check if redirected to checkout (expected behavior)
    if (finalUrl.includes('/checkout')) {
      console.log('✅ SUCCESS: User was correctly redirected to checkout after signup');
    } 
    // Check if redirected to dashboard (incorrect behavior)
    else if (finalUrl.includes('/dashboard')) {
      console.log('❌ FAIL: User was incorrectly redirected to dashboard after signup');
    } 
    // Other destination
    else {
      console.log(`⚠️ UNKNOWN: User was redirected to unexpected URL: ${finalUrl}`);
    }
    
    // Wait for user to see the result
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('Test error:', error);
    
    // Take a screenshot on error
    try {
      await page.screenshot({ path: 'error-screenshot.png' });
      console.log('Error screenshot saved to error-screenshot.png');
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError);
    }
  } finally {
    // Close the browser
    await browser.close();
  }
}

testNewUserFlow().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 