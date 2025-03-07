const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '../browser-test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Create a log file with timestamp
const timestamp = new Date().toISOString().replace(/:/g, '-');
const logFile = path.join(outputDir, `session-debug-test-${timestamp}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Helper function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  console.log(formattedMessage);
  logStream.write(formattedMessage + '\n');
}

// Helper function to take screenshots
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(outputDir, `${name}-${timestamp}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  log(`Screenshot saved: ${screenshotPath}`);
}

// Helper function to log storage data
async function logStorageData(page, storageName) {
  const data = await page.evaluate((name) => {
    const storage = name === 'localStorage' ? localStorage : sessionStorage;
    const items = {};
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      items[key] = storage.getItem(key);
    }
    return items;
  }, storageName);
  
  log(`${storageName} data:`);
  log(JSON.stringify(data, null, 2));
}

// Helper function to log cookies
async function logCookies(page) {
  const cookies = await page.context().cookies();
  log('Cookies:');
  log(JSON.stringify(cookies, null, 2));
}

// Helper function to log request/response details
function setupNetworkLogging(page) {
  page.on('request', request => {
    log(`Request: ${request.method()} ${request.url()}`);
    const headers = request.headers();
    if (headers.cookie) {
      log(`Request cookies: ${headers.cookie}`);
    }
  });
  
  page.on('response', async response => {
    const request = response.request();
    log(`Response: ${response.status()} ${request.method()} ${request.url()}`);
    
    // Log response headers
    const headers = response.headers();
    if (headers['set-cookie']) {
      log(`Response set-cookie: ${headers['set-cookie']}`);
    }
    
    // Try to log response body for API calls
    if (request.url().includes('/api/') || request.url().includes('supabase')) {
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          const text = await response.text();
          log(`Response body: ${text}`);
        }
      } catch (error) {
        log(`Error getting response body: ${error.message}`);
      }
    }
  });
  
  page.on('console', msg => {
    log(`Console ${msg.type()}: ${msg.text()}`);
  });
}

describe('Session Debug Test', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    // Launch browser with persistent storage to maintain session
    browser = await chromium.launch({ 
      headless: false, // Set to true for headless mode
      slowMo: 100 // Slow down operations for better visibility
    });
  });
  
  afterAll(async () => {
    await browser.close();
    logStream.end();
  });
  
  test('Debug session recognition in middleware', async () => {
    // Create a new context with storage state persistence
    const context = await browser.newContext({
      recordVideo: {
        dir: outputDir,
        size: { width: 1280, height: 720 }
      }
    });
    
    page = await context.newPage();
    setupNetworkLogging(page);
    
    try {
      // Step 1: Navigate to the homepage
      log('Navigating to homepage');
      await page.goto('http://localhost:3000');
      await takeScreenshot(page, '01-homepage');
      
      // Step 2: Log in with existing credentials
      log('Navigating to login page');
      await page.goto('http://localhost:3000/login');
      await takeScreenshot(page, '02-login-page');
      
      // Fill in login form with valid credentials
      // Replace with a valid user account for your system
      log('Filling login form');
      await page.fill('input[type="email"]', 'user@example.com');
      await page.fill('input[type="password"]', 'password123');
      await takeScreenshot(page, '03-login-form-filled');
      
      // Submit login form
      log('Submitting login form');
      try {
        await Promise.all([
          page.waitForNavigation({ timeout: 10000 }),
          page.click('button[type="submit"]')
        ]);
      } catch (error) {
        log(`Navigation timeout or error: ${error.message}`);
        // Continue with the test even if navigation times out
      }
      
      await takeScreenshot(page, '04-after-login');
      
      // Check if we're still on the login page (login failed)
      const currentUrl = page.url();
      log(`Current URL after login attempt: ${currentUrl}`);
      
      if (currentUrl.includes('/login')) {
        log('Login appears to have failed, checking for error messages');
        const errorText = await page.evaluate(() => {
          const errorElement = document.querySelector('.text-red-500');
          return errorElement ? errorElement.textContent : null;
        });
        
        if (errorText) {
          log(`Login error message: ${errorText}`);
        }
        
        // Create a test account if login failed
        log('Creating a test account for debugging');
        await page.goto('http://localhost:3000/debug/session');
        await takeScreenshot(page, '05-debug-page');
        
        // Log storage and cookies
        await logStorageData(page, 'localStorage');
        await logStorageData(page, 'sessionStorage');
        await logCookies(page);
        
        // Try to access dashboard directly
        log('Attempting to access dashboard directly');
        await page.goto('http://localhost:3000/dashboard');
        await takeScreenshot(page, '06-dashboard-direct');
        
        // Check if we were redirected
        log(`Current URL after dashboard attempt: ${page.url()}`);
        const wasRedirected = !page.url().includes('/dashboard');
        log(`Redirected from dashboard: ${wasRedirected}`);
        
        if (wasRedirected) {
          log(`Redirected to: ${page.url()}`);
        }
        
        // Test the middleware debug endpoint
        log('Testing middleware debug endpoint');
        await page.goto('http://localhost:3000/api/debug/middleware');
        
        // The response should be displayed as JSON in the browser
        const middlewareDebugContent = await page.content();
        log(`Middleware debug response: ${middlewareDebugContent}`);
        
        return; // End the test here
      }
      
      // If we're here, login was successful
      // Log storage and cookies after login
      await logStorageData(page, 'localStorage');
      await logStorageData(page, 'sessionStorage');
      await logCookies(page);
      
      // Step 3: Verify we're logged in by checking for user-specific elements
      log('Verifying login state');
      const isLoggedIn = await page.evaluate(() => {
        // Check for elements that would indicate we're logged in
        // This could be a username display, dashboard link, etc.
        return document.querySelector('a[href="/dashboard"]') !== null;
      });
      
      log(`Login verification: ${isLoggedIn ? 'Logged in' : 'Not logged in'}`);
      
      // Step 4: Try to access dashboard
      log('Attempting to access dashboard');
      const dashboardResponse = await page.goto('http://localhost:3000/dashboard');
      await takeScreenshot(page, '07-dashboard-attempt');
      
      // Check if we were redirected
      log(`Current URL after dashboard attempt: ${page.url()}`);
      const wasRedirected = !page.url().includes('/dashboard');
      log(`Redirected from dashboard: ${wasRedirected}`);
      
      if (wasRedirected) {
        log(`Redirected to: ${page.url()}`);
      }
      
      // Step 5: Analyze Supabase session
      log('Analyzing Supabase session');
      const supabaseSession = await page.evaluate(() => {
        // This assumes you have a global supabase client
        // If not, you'll need to adjust this code
        return window.localStorage.getItem('supabase.auth.token');
      });
      
      if (supabaseSession) {
        log('Supabase session found in localStorage');
        try {
          const parsedSession = JSON.parse(supabaseSession);
          log(`Session expires at: ${new Date(parsedSession.expires_at * 1000).toISOString()}`);
          log(`Current time: ${new Date().toISOString()}`);
          
          // Check if session is expired
          const isExpired = parsedSession.expires_at * 1000 < Date.now();
          log(`Session expired: ${isExpired}`);
        } catch (error) {
          log(`Error parsing session: ${error.message}`);
        }
      } else {
        log('No Supabase session found in localStorage');
      }
      
      // Step 6: Test session endpoint
      log('Testing session endpoint');
      await page.goto('http://localhost:3000/api/auth/session');
      
      // The response should be displayed as JSON in the browser
      const sessionApiContent = await page.content();
      log(`Session API response: ${sessionApiContent}`);
      
      // Step 7: Check for auth-status cookie
      const cookies = await page.context().cookies();
      const authStatusCookie = cookies.find(c => c.name === 'auth-status');
      log(`Auth status cookie: ${authStatusCookie ? JSON.stringify(authStatusCookie) : 'Not found'}`);
      
      // Final storage and cookie check
      await logStorageData(page, 'localStorage');
      await logStorageData(page, 'sessionStorage');
      await logCookies(page);
      
    } catch (error) {
      log(`Test error: ${error.message}`);
      log(error.stack);
      throw error;
    } finally {
      await context.close();
    }
  }, 60000); // 60 second timeout
}); 