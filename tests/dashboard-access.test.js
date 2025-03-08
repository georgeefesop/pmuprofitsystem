const { chromium } = require('playwright');

async function testDashboardAccess() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Set the auth cookies
  await context.addCookies([
    {
      name: 'auth-status',
      value: 'authenticated',
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'sb-auth-token',
      value: `mock-token-test-user-id-${Date.now()}`,
      domain: 'localhost',
      path: '/',
    }
  ]);
  
  console.log('Cookies set, navigating to dashboard...');
  
  // Navigate to the dashboard
  await page.goto('http://localhost:3000/dashboard');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Log the current URL
  console.log('Current URL:', page.url());
  
  // Check if we're on the dashboard or redirected to login
  if (page.url().includes('/login')) {
    console.log('❌ FAILED: Redirected to login page');
  } else if (page.url().includes('/dashboard')) {
    console.log('✅ SUCCESS: Accessed dashboard successfully');
  } else {
    console.log('⚠️ UNKNOWN: Unexpected URL');
  }
  
  // Wait for user to see the result
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Close the browser
  await browser.close();
}

testDashboardAccess().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 