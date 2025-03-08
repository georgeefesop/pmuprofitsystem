const { chromium } = require('playwright');

async function testValidUserCheck() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  
  try {
    // Set the auth cookies for a test user
    await context.addCookies([
      {
        name: 'auth-status',
        value: 'authenticated',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'sb-auth-token',
        value: 'mock-token-test-user-id-12345',
        domain: 'localhost',
        path: '/',
      }
    ]);
    
    console.log('Test user cookies set, attempting to access dashboard...');
    
    // Create a page and navigate to the dashboard
    const page = await context.newPage();
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'valid-user-check.png' });
    
    // Log the current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check if we're on the dashboard (expected behavior for test users)
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: Test user was correctly allowed to access dashboard');
    } 
    // Check if we're redirected to checkout or login (incorrect behavior for test users)
    else if (currentUrl.includes('/checkout') || currentUrl.includes('/login')) {
      console.log('❌ FAIL: Test user was incorrectly redirected to', currentUrl);
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

testValidUserCheck().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 