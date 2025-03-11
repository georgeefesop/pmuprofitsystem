require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');

// Configuration
const LOCAL_URL = 'http://localhost:3000';
const WAIT_TIMEOUT = 10000; // 10 seconds

async function testDashboardAccess() {
  console.log('\n=== Dashboard Access Test ===');
  
  try {
    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Create test users if they don't exist
    const localUserEmail = `test-local-user-${Date.now()}@example.com`;
    const prodUserEmail = `test-prod-user-${Date.now()}@example.com`;
    const password = 'Password123!';
    
    console.log('Creating test users...');
    
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
    
    // Launch browser
    console.log('\nLaunching browser for testing...');
    const browser = await puppeteer.launch({ 
      headless: false,
      args: ['--window-size=1280,800'],
      defaultViewport: null
    });
    
    // Test local user
    console.log('\n--- Testing Local User ---');
    await testUserDashboardAccess(browser, localUserEmail, password, 'local');
    
    // Test production user
    console.log('\n--- Testing Production User ---');
    await testUserDashboardAccess(browser, prodUserEmail, password, 'production');
    
    // Close browser
    await browser.close();
    
    // Clean up test users
    console.log('\nCleaning up test users...');
    await supabase.auth.admin.deleteUser(localUser.user.id);
    await supabase.auth.admin.deleteUser(prodUser.user.id);
    console.log('Test users deleted');
    
    console.log('\nTest completed!');
  } catch (error) {
    console.error('Test error:', error);
  }
}

async function testUserDashboardAccess(browser, email, password, environment) {
  const page = await browser.newPage();
  
  try {
    // Enable console logging from the browser
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Step 1: Navigate to login page
    console.log(`1. Navigating to login page...`);
    await page.goto(`${LOCAL_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Debug: Check form elements
    const formElements = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButton = document.querySelector('button[type="submit"]');
      
      return {
        hasEmailInput: !!emailInput,
        hasPasswordInput: !!passwordInput,
        hasSubmitButton: !!submitButton,
        emailInputId: emailInput ? emailInput.id : null,
        passwordInputId: passwordInput ? passwordInput.id : null,
        submitButtonText: submitButton ? submitButton.textContent.trim() : null
      };
    });
    
    console.log('Form elements detected:', formElements);
    
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
    await page.screenshot({ path: `login-form-${environment}.png` });
    console.log(`Screenshot saved as login-form-${environment}.png`);
    
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
    await page.screenshot({ path: `after-login-${environment}.png` });
    console.log(`Screenshot saved as after-login-${environment}.png`);
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    // Check if we're on the dashboard or error page
    if (currentUrl.includes('/dashboard')) {
      console.log(`✅ Successfully accessed dashboard with ${environment} user`);
    } else if (currentUrl.includes('/auth/environment-mismatch')) {
      console.log(`❌ Environment mismatch error for ${environment} user`);
    } else if (currentUrl.includes('/login')) {
      console.log(`❌ Still on login page - login failed for ${environment} user`);
      
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
    
    // Step 3: If on dashboard, test logout and login again
    if (currentUrl.includes('/dashboard')) {
      // Logout
      console.log(`3. Testing logout...`);
      await page.goto(`${LOCAL_URL}/logout`, { waitUntil: 'networkidle2' });
      
      // Check if logged out successfully
      const logoutUrl = page.url();
      console.log(`URL after logout: ${logoutUrl}`);
      
      // Take a screenshot after logout
      await page.screenshot({ path: `after-logout-${environment}.png` });
      console.log(`Screenshot saved as after-logout-${environment}.png`);
      
      if (logoutUrl.includes('/login') || logoutUrl === `${LOCAL_URL}/`) {
        console.log(`✅ Logout successful`);
        
        // Login again
        console.log(`4. Logging in again...`);
        await page.goto(`${LOCAL_URL}/login`, { waitUntil: 'networkidle2' });
        
        // Wait for form elements to be available
        await page.waitForSelector('input[name="email"]');
        await page.waitForSelector('input[name="password"]');
        
        // Fill in the form using evaluate
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
        await page.screenshot({ path: `after-second-login-${environment}.png` });
        console.log(`Screenshot saved as after-second-login-${environment}.png`);
        
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
    }
  } catch (error) {
    console.error(`Error testing ${environment} user:`, error);
  } finally {
    // Close the page
    await page.close();
  }
}

testDashboardAccess(); 