const { chromium } = require('playwright');

async function testMiddlewareCheck() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  
  try {
    // Set the auth cookies
    await context.addCookies([
      {
        name: 'auth-status',
        value: 'authenticated',
        domain: 'localhost',
        path: '/',
      }
    ]);
    
    console.log('Auth-status cookie set, attempting to access dashboard...');
    
    // Create a page and navigate to the dashboard
    const page = await context.newPage();
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'middleware-check.png' });
    
    // Log the current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check if we're redirected to checkout (expected behavior)
    if (currentUrl.includes('/checkout')) {
      console.log('✅ SUCCESS: Regular user with auth-status cookie was correctly redirected to checkout');
    } 
    // Check if we're on the dashboard (incorrect behavior)
    else if (currentUrl.includes('/dashboard')) {
      console.log('❌ FAIL: Regular user with auth-status cookie was incorrectly allowed to access dashboard');
    } 
    // Other destination
    else {
      console.log(`⚠️ UNKNOWN: User was redirected to unexpected URL: ${currentUrl}`);
    }
    
    // Wait for user to see the result
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

testMiddlewareCheck().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 