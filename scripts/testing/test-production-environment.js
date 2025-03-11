require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');

// Configuration
const PRODUCTION_URL = 'https://pmuprofitsystem.com'; // Production URL
const WAIT_TIMEOUT = 10000; // 10 seconds

async function testProductionEnvironment() {
  console.log('\n=== Production Environment Test ===');
  
  try {
    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Create test users
    const prodUserEmail = `test-prod-user-${Date.now()}@example.com`;
    const localUserEmail = `test-local-user-${Date.now()}@example.com`;
    const password = 'Password123!';
    
    console.log('Creating test users...');
    
    // Create production environment user
    const { data: prodUser, error: prodUserError } = await supabase.auth.admin.createUser({
      email: prodUserEmail,
      password: password,
      email_confirm: true,
      app_metadata: {
        environment: 'production',
        environment_updated_at: new Date().toISOString()
      }
    });
    
    if (prodUserError) {
      console.error('Error creating production user:', prodUserError);
      return;
    }
    
    console.log(`Production user created: ${prodUserEmail} (ID: ${prodUser.user.id})`);
    
    // Create local environment user
    const { data: localUser, error: localUserError } = await supabase.auth.admin.createUser({
      email: localUserEmail,
      password: password,
      email_confirm: true,
      app_metadata: {
        environment: 'local',
        environment_updated_at: new Date().toISOString()
      }
    });
    
    if (localUserError) {
      console.error('Error creating local user:', localUserError);
      return;
    }
    
    console.log(`Local user created: ${localUserEmail} (ID: ${localUser.user.id})`);
    
    // Launch browser
    console.log('\nLaunching browser for testing...');
    const browser = await puppeteer.launch({ 
      headless: false,
      args: ['--window-size=1280,800'],
      defaultViewport: null
    });
    
    // Test production user in production environment
    console.log('\n--- Testing Production User in Production Environment ---');
    await testUserAccess(browser, prodUserEmail, password, 'production');
    
    // Test local user in production environment
    console.log('\n--- Testing Local User in Production Environment ---');
    await testUserAccess(browser, localUserEmail, password, 'local');
    
    // Close browser
    await browser.close();
    
    // Clean up test users
    console.log('\nCleaning up test users...');
    await supabase.auth.admin.deleteUser(prodUser.user.id);
    await supabase.auth.admin.deleteUser(localUser.user.id);
    console.log('Test users deleted');
    
    console.log('\nTest completed!');
  } catch (error) {
    console.error('Test error:', error);
  }
}

async function testUserAccess(browser, email, password, userEnvironment) {
  const page = await browser.newPage();
  
  try {
    // Enable console logging from the browser
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Step 1: Navigate to login page
    console.log(`1. Navigating to production login page...`);
    await page.goto(`${PRODUCTION_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Take a screenshot of the login page
    await page.screenshot({ path: `prod-login-${userEnvironment}.png` });
    console.log(`Screenshot saved as prod-login-${userEnvironment}.png`);
    
    // Step 2: Login
    console.log(`2. Logging in as ${email}...`);
    
    // Wait for form elements to be available
    await page.waitForSelector('input[name="email"]');
    await page.waitForSelector('input[name="password"]');
    
    // Fill in the form
    await page.evaluate((email, password) => {
      document.querySelector('input[name="email"]').value = email;
      document.querySelector('input[name="password"]').value = password;
    }, email, password);
    
    // Take a screenshot before submitting
    await page.screenshot({ path: `prod-login-form-${userEnvironment}.png` });
    console.log(`Screenshot saved as prod-login-form-${userEnvironment}.png`);
    
    // Submit the form directly
    await page.evaluate(() => {
      document.querySelector('form').submit();
    });
    
    // Wait for navigation after login
    try {
      await page.waitForNavigation({ timeout: WAIT_TIMEOUT });
      console.log('Navigation after login completed');
    } catch (error) {
      console.log('Navigation timeout - checking current URL');
    }
    
    // Take a screenshot after login attempt
    await page.screenshot({ path: `prod-after-login-${userEnvironment}.png` });
    console.log(`Screenshot saved as prod-after-login-${userEnvironment}.png`);
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    // Check if we're on the dashboard or error page
    if (currentUrl.includes('/dashboard')) {
      console.log(`✅ Successfully accessed dashboard with ${userEnvironment} user in production environment`);
      
      // Test logout and login again
      await testLogoutAndLoginAgain(page, email, password, userEnvironment);
    } else if (currentUrl.includes('/auth/environment-mismatch')) {
      console.log(`✅ Environment mismatch detected for ${userEnvironment} user in production environment`);
      
      // Check the error message
      const errorMessage = await page.evaluate(() => {
        const errorElement = document.querySelector('.text-amber-700');
        return errorElement ? errorElement.textContent.trim() : null;
      });
      
      if (errorMessage) {
        console.log(`Error message: ${errorMessage}`);
      }
    } else if (currentUrl.includes('/login')) {
      console.log(`❌ Still on login page - login failed for ${userEnvironment} user in production environment`);
      
      // Check for error messages
      const pageContent = await page.content();
      console.log(`Page HTML length: ${pageContent.length} characters`);
      
      const errorText = await page.evaluate(() => {
        // Try different error message selectors
        const errorSelectors = [
          '.error-message',
          '.text-red-500',
          '.text-destructive',
          '[data-error]',
          '.form-error'
        ];
        
        for (const selector of errorSelectors) {
          const element = document.querySelector(selector);
          if (element) return { selector, text: element.textContent };
        }
        
        return null;
      });
      
      if (errorText) {
        console.log(`Error message found with selector ${errorText.selector}: "${errorText.text}"`);
      } else {
        console.log('No error message found on the page');
      }
    } else {
      console.log(`❓ Unexpected redirect to ${currentUrl}`);
    }
  } catch (error) {
    console.error(`Error testing ${userEnvironment} user:`, error);
  } finally {
    // Close the page
    await page.close();
  }
}

async function testLogoutAndLoginAgain(page, email, password, userEnvironment) {
  try {
    // Logout
    console.log(`3. Testing logout...`);
    await page.goto(`${PRODUCTION_URL}/logout`, { waitUntil: 'networkidle2' });
    
    // Check if logged out successfully
    const logoutUrl = page.url();
    console.log(`URL after logout: ${logoutUrl}`);
    
    // Take a screenshot after logout
    await page.screenshot({ path: `prod-after-logout-${userEnvironment}.png` });
    console.log(`Screenshot saved as prod-after-logout-${userEnvironment}.png`);
    
    if (logoutUrl.includes('/login') || logoutUrl === PRODUCTION_URL || logoutUrl === `${PRODUCTION_URL}/`) {
      console.log(`✅ Logout successful`);
      
      // Login again
      console.log(`4. Logging in again...`);
      await page.goto(`${PRODUCTION_URL}/login`, { waitUntil: 'networkidle2' });
      
      // Wait for form elements to be available
      await page.waitForSelector('input[name="email"]');
      await page.waitForSelector('input[name="password"]');
      
      // Fill in the form
      await page.evaluate((email, password) => {
        document.querySelector('input[name="email"]').value = email;
        document.querySelector('input[name="password"]').value = password;
      }, email, password);
      
      // Submit the form directly
      await page.evaluate(() => {
        document.querySelector('form').submit();
      });
      
      // Wait for navigation after second login
      try {
        await page.waitForNavigation({ timeout: WAIT_TIMEOUT });
        console.log('Navigation after second login completed');
      } catch (error) {
        console.log('Navigation timeout - checking current URL');
      }
      
      // Take a screenshot after second login
      await page.screenshot({ path: `prod-after-second-login-${userEnvironment}.png` });
      console.log(`Screenshot saved as prod-after-second-login-${userEnvironment}.png`);
      
      // Check current URL after second login
      const secondLoginUrl = page.url();
      console.log(`URL after second login: ${secondLoginUrl}`);
      
      if (secondLoginUrl.includes('/dashboard')) {
        console.log(`✅ Successfully accessed dashboard after logout and login again`);
      } else if (secondLoginUrl.includes('/auth/environment-mismatch')) {
        console.log(`❌ Environment mismatch error after second login`);
      } else if (secondLoginUrl.includes('/login')) {
        console.log(`❌ Still on login page - second login failed`);
      } else {
        console.log(`❓ Unexpected redirect to ${secondLoginUrl}`);
      }
    } else {
      console.log(`❌ Logout failed, redirected to ${logoutUrl}`);
    }
  } catch (error) {
    console.error('Error during logout and login again test:', error);
  }
}

// Only run the test if this script is executed directly
if (require.main === module) {
  testProductionEnvironment();
}

module.exports = {
  testProductionEnvironment
}; 