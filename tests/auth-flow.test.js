const { chromium } = require('playwright');

async function testAuthFlow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Generate a unique email for testing
    const testEmail = `user-${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    
    console.log('Starting auth flow test...');
    console.log(`Test email: ${testEmail}`);
    
    // Step 1: Go to the homepage
    console.log('Step 1: Navigating to homepage');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Go to login page
    console.log('Step 2: Navigating to login page');
    await page.click('text=Login');
    await page.waitForURL('**/login');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Fill out login form with new user credentials
    console.log('Step 3: Filling login form with new user credentials');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    // Step 4: Submit the form
    console.log('Step 4: Submitting login form');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error message
    await page.waitForTimeout(3000);
    
    // Step 5: Check where we landed after login attempt
    const currentUrl = page.url();
    console.log(`Current URL after login attempt: ${currentUrl}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'login-attempt.png' });
    
    // Step 6: Go to signup page (if we're still on login page)
    if (currentUrl.includes('/login')) {
      console.log('Step 6: Going to signup page');
      
      // Look for signup link
      const signupLink = await page.getByText('Need access?');
      if (await signupLink.isVisible()) {
        await signupLink.click();
        console.log('Clicked on signup link');
      } else {
        console.log('No signup link found, going to pre-checkout');
        await page.goto('http://localhost:3000/pre-checkout');
      }
      
      await page.waitForLoadState('networkidle');
      
      // Step 7: Fill out signup form
      console.log('Step 7: Filling signup form');
      
      // Check if we're on pre-checkout page
      if (page.url().includes('/pre-checkout')) {
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="fullName"]', 'Test User');
        await page.fill('input[name="password"]', testPassword);
        
        // Submit the form
        await page.click('button[type="submit"]');
        console.log('Submitted pre-checkout form');
        
        // Wait for navigation
        await page.waitForTimeout(3000);
      }
    }
    
    // Step 8: Check final destination
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

testAuthFlow().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 