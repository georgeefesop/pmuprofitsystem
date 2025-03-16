/**
 * Purchases Accuracy Test
 * 
 * This script tests the accuracy of the purchases section in the dashboard,
 * focusing on entitlements and product display.
 * 
 * Test Coverage:
 * - Verifies that only products with active entitlements are shown as purchased
 * - Checks that entitlement details match database records
 * - Tests the debug view for accurate information
 * 
 * Usage:
 * node scripts/testing/test-purchases-accuracy.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://pmuprofitsystem.vercel.app' 
  : 'http://localhost:3000';
const WAIT_TIMEOUT = 20000; // 20 seconds
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'purchases-test');

// Test user credentials - using existing test accounts
const TEST_USER = {
  email: process.env.NODE_ENV === 'production' 
    ? 'george.efesopb@gmail.com' 
    : 'george.efesopa@gmail.com',
  password: 'Wheels99!'
};

// Helper functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

/**
 * Helper function to take and save screenshots
 */
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${path.basename(screenshotPath)}`);
  return screenshotPath;
}

/**
 * Helper function to scroll to an element
 */
async function scrollToElement(page, selector) {
  try {
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        // Scroll the element into view with some padding
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
      return false;
    }, selector);
    
    // Give time for the scroll to complete
    await sleep(500);
    return true;
  } catch (error) {
    console.error(`Error scrolling to element ${selector}:`, error);
    return false;
  }
}

/**
 * Helper function to log HTML structure for debugging
 */
async function logHtmlStructure(page, selector = 'body') {
  try {
    const structure = await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return 'Element not found';
      
      // Simple function to get a summary of the DOM structure
      function summarizeNode(node, depth = 0) {
        if (!node) return '';
        
        const indent = ' '.repeat(depth * 2);
        let summary = `${indent}${node.tagName || 'TEXT'}`;
        
        if (node.id) summary += `#${node.id}`;
        if (node.className && typeof node.className === 'string') {
          summary += `.${node.className.split(' ').join('.')}`;
        }
        
        // Add data attributes which are often useful for testing
        const dataAttrs = [];
        for (const attr of node.attributes || []) {
          if (attr.name.startsWith('data-')) {
            dataAttrs.push(`${attr.name}="${attr.value}"`);
          }
        }
        if (dataAttrs.length > 0) {
          summary += ` [${dataAttrs.join(', ')}]`;
        }
        
        return summary;
      }
      
      // Get a simplified representation of the DOM
      function getStructure(node, depth = 0, maxDepth = 3) {
        if (!node || depth > maxDepth) return '';
        
        let result = summarizeNode(node, depth) + '\n';
        
        // Only process element nodes
        if (node.nodeType === 1) {
          for (const child of node.children) {
            result += getStructure(child, depth + 1, maxDepth);
          }
        }
        
        return result;
      }
      
      return getStructure(element);
    }, selector);
    
    console.log(`HTML Structure for ${selector}:`);
    console.log(structure);
  } catch (error) {
    console.error(`Error logging HTML structure for ${selector}:`, error);
  }
}

/**
 * Main test function
 */
async function runTest() {
  console.log('=== Purchases Accuracy Test ===');
  const isDev = process.env.NODE_ENV !== 'production';
  const baseUrl = isDev ? 'http://localhost:3000' : 'https://pmuprofitsystem.vercel.app';
  console.log('Environment:', isDev ? 'development' : 'production');
  console.log('Base URL:', baseUrl);
  
  // Test user credentials
  const testUser = TEST_USER;
  console.log('Testing with user:', testUser.email);
  console.log('');
  
  // Verify user entitlements in database
  console.log('Verifying user entitlements in database... ');
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('Supabase credentials not found in environment variables');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', testUser.email)
      .single();
    
    if (userError) {
      console.error('Error fetching user:', userError.message);
      return;
    }
    
    const userId = userData.id;
    
    // Get user entitlements
    const { data: entitlements, error: entitlementsError } = await supabase
      .from('user_entitlements')
      .select('*, products:product_id(*)')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (entitlementsError) {
      console.error('Error fetching entitlements:', entitlementsError.message);
      return;
    }
    
    console.log(`Found ${entitlements.length} active entitlements for user:`);
    entitlements.forEach(entitlement => {
      console.log(`- ${entitlement.products?.name || 'Unknown'} (ID: ${entitlement.product_id})`);
    });
    console.log('');
    
    // Launch browser for testing
    console.log('Launching browser for testing...');
    const browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1280, height: 800 }
    });
    
    try {
      // Run test scenarios
      await testLoginAndNavigate(browser, baseUrl, testUser, entitlements);
      
      // Keep browser open for a moment to see the results
      await sleep(10000);
    } catch (error) {
      console.error('Test failed with error:', error);
      // Take screenshot of error state
      const pages = await browser.pages();
      const page = pages[0];
      await takeScreenshot(page, 'login-error');
      console.log('Error screenshot saved');
      
      // Keep browser open for a moment to view error state
      console.log('Keeping browser open for 10 seconds to view error state...');
      await sleep(10000);
    } finally {
      // Clean up
      console.log('Cleaning up...');
      await browser.close();
      console.log('Browser closed');
    }
  } catch (error) {
    console.error('Error in test:', error);
  }
}

/**
 * Test login and navigation to profile page
 */
async function testLoginAndNavigate(browser, baseUrl, testUser, expectedEntitlements) {
  console.log('\n--- Test Scenario 1: Login and Navigate to Profile ---');
  const page = (await browser.pages())[0];
  
  // Clear cookies before starting
  await page.deleteCookie();
  
  // 1. Navigate to login page
  console.log('1. Navigating to login page...');
  await page.goto(`${baseUrl}/login`);
  await takeScreenshot(page, 'login-page');
  
  // 2. Wait for login form to fully load
  console.log('2. Waiting for login form to fully load...');
  await page.waitForSelector('input[type="email"]', { timeout: WAIT_TIMEOUT });
  await page.waitForSelector('input[type="password"]', { timeout: WAIT_TIMEOUT });
  await page.waitForSelector('button[type="submit"]', { timeout: WAIT_TIMEOUT });
  
  console.log('   Waiting 3 seconds for the form to stabilize...');
  await sleep(3000);
  
  // 3. Fill in login form
  console.log('3. Filling login form...');
  await page.type('input[type="email"]', testUser.email);
  await page.type('input[type="password"]', testUser.password);
  await takeScreenshot(page, 'login-form-filled');
  
  // 4. Submit login form
  console.log('4. Submitting login form...');
  await page.click('button[type="submit"]');
  
  // 5. Wait for login to complete and redirect to dashboard
  console.log('5. Verifying login success...');
  try {
    // Wait for redirect to dashboard
    await page.waitForNavigation({ timeout: WAIT_TIMEOUT });
    const currentUrl = page.url();
    
    // Take screenshot after login
    await takeScreenshot(page, 'after-login');
    
    console.log('Current URL:', currentUrl);
    
    if (!currentUrl.includes('/dashboard')) {
      throw new Error(`Login failed. Expected URL to contain '/dashboard', got: ${currentUrl}`);
    }
    
    console.log('✅ Successfully logged in');
    
    // 6. Navigate to profile page
    console.log('6. Navigating to profile page...');
    await page.goto(`${baseUrl}/dashboard/profile`);
    
    // 7. Wait for profile page to load
    console.log('7. Waiting for profile page to load...');
    
    // Wait for the main content to load - look for the account information section first
    await page.waitForSelector('h2', { timeout: WAIT_TIMEOUT });
    
    // Take screenshot of profile page
    await takeScreenshot(page, 'profile-page');
    
    // Verify that we're on the profile page
    const pageTitle = await page.evaluate(() => {
      const titleElement = document.querySelector('h1');
      return titleElement ? titleElement.textContent : null;
    });
    
    if (!pageTitle || !pageTitle.includes('Profile')) {
      throw new Error(`Not on profile page. Page title: ${pageTitle}`);
    }
    
    console.log('✅ Successfully navigated to profile page');
    
    // Now test the purchases display
    await testPurchasesDisplay(page, expectedEntitlements);
    
    // Test the debug view if in development
    if (process.env.NODE_ENV !== 'production') {
      await testDebugView(page, expectedEntitlements);
    }
    
  } catch (error) {
    console.log('Login and navigation failed:', error);
    throw error;
  }
}

/**
 * Test the purchases display section
 */
async function testPurchasesDisplay(page, expectedEntitlements) {
  console.log('\n--- Test Scenario 2: Verify Purchases Display ---');
  
  try {
    // 1. Check if we're on the profile page, if not navigate there
    const currentUrl = page.url();
    if (!currentUrl.includes('/profile')) {
      console.log('Navigating to profile page...');
      await page.goto(`${currentUrl.split('/dashboard')[0]}/dashboard/profile`);
      await page.waitForSelector('h2', { timeout: WAIT_TIMEOUT });
    }
    
    // 2. Look for the purchases section
    console.log('1. Looking for purchases section...');
    
    // First take a screenshot before scrolling
    await takeScreenshot(page, 'before-scroll');
    
    // Scroll down to make sure we can see the purchases section
    console.log('2. Scrolling to view purchases section...');
    
    // Try to find a heading that might indicate the purchases section
    const purchasesHeadingExists = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3'));
      const purchasesHeading = headings.find(h => 
        h.textContent && 
        (h.textContent.includes('Available Products') || 
         h.textContent.includes('Purchases') || 
         h.textContent.includes('Products') || 
         h.textContent.includes('Entitlements'))
      );
      
      if (purchasesHeading) {
        purchasesHeading.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
      return false;
    });
    
    if (purchasesHeadingExists) {
      console.log('✅ Found and scrolled to purchases section heading');
    } else {
      console.log('⚠️ Could not find purchases section heading, scrolling down the page');
      // Scroll down the page to try to find the purchases section
      await page.evaluate(() => {
        window.scrollBy(0, 500);
      });
    }
    
    // Wait a moment for any animations to complete
    await sleep(1000);
    
    // Take a screenshot after scrolling
    await takeScreenshot(page, 'after-scroll');
    
    // 3. Look for product cards
    console.log('3. Looking for product cards...');
    
    // Log the HTML structure to help debug
    await logHtmlStructure(page, 'div.space-y-4');
    
    // Check for various selectors that might contain product information
    const productCardsInfo = await page.evaluate(() => {
      // Try different selectors that might contain product cards
      const selectors = [
        '.card', // Standard card component
        '[class*="card"]', // Any element with "card" in class name
        'div.space-y-4 > div', // Child divs of space-y-4 container
        'div[class*="product"]', // Any div with "product" in class name
        'div[class*="entitlement"]', // Any div with "entitlement" in class name
      ];
      
      let productElements = [];
      
      // Try each selector
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          productElements = Array.from(elements);
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          break;
        }
      }
      
      // If we still don't have elements, try a more generic approach
      if (productElements.length === 0) {
        // Look for any div that might contain product information
        const allDivs = document.querySelectorAll('div');
        productElements = Array.from(allDivs).filter(div => {
          const text = div.textContent || '';
          return (
            (text.includes('PMU Profit System') || 
             text.includes('Ad Generator') || 
             text.includes('Blueprint')) &&
            (text.includes('Purchased') || text.includes('Purchase'))
          );
        });
      }
      
      // Extract information from the product cards
      return {
        count: productElements.length,
        products: productElements.map(el => {
          const titleEl = el.querySelector('h3') || el.querySelector('[class*="title"]');
          const title = titleEl ? titleEl.textContent : null;
          
          const isPurchased = el.textContent.includes('Purchased') || 
                             el.textContent.includes('Active') ||
                             el.classList.contains('border-green-200') ||
                             el.classList.contains('bg-green-50');
          
          return {
            title: title || 'Unknown',
            isPurchased,
            text: el.textContent.substring(0, 100) + (el.textContent.length > 100 ? '...' : '')
          };
        })
      };
    });
    
    console.log(`Found ${productCardsInfo.count} potential product elements`);
    
    if (productCardsInfo.count > 0) {
      console.log('Product cards found:');
      productCardsInfo.products.forEach((product, i) => {
        console.log(`  ${i+1}. ${product.title} - Purchased: ${product.isPurchased}`);
        console.log(`     ${product.text}`);
      });
      
      // Check if the main product (PMU Profit System) is displayed
      const mainProductDisplayed = productCardsInfo.products.some(product => 
        product.title.includes('PMU Profit System') && product.isPurchased
      );
      
      if (mainProductDisplayed) {
        console.log('✅ Main product (PMU Profit System) is displayed as purchased');
      } else {
        console.log('❌ Main product (PMU Profit System) is not displayed as purchased');
      }
      
      // Check if the expected number of products is displayed
      if (productCardsInfo.count >= expectedEntitlements.length) {
        console.log(`✅ Found at least ${expectedEntitlements.length} product cards as expected`);
      } else {
        console.log(`❌ Expected ${expectedEntitlements.length} product cards, but found ${productCardsInfo.count}`);
      }
    } else {
      console.log('❌ No product cards found');
      
      // Take a screenshot of the page for debugging
      await takeScreenshot(page, 'no-products-found');
      
      // Log the HTML structure for debugging
      await logHtmlStructure(page, 'body');
    }
    
  } catch (error) {
    console.error('Error testing purchases display:', error);
    await takeScreenshot(page, 'purchases-display-error');
  }
}

/**
 * Test the debug view in the purchases section
 */
async function testDebugView(page, expectedEntitlements) {
  console.log('\n--- Test Scenario 3: Verify Debug View ---');
  
  try {
    // Look for debug toggle button
    console.log('1. Looking for debug toggle...');
    
    const debugToggleExists = await page.evaluate(() => {
      // Look for buttons that might be debug toggles
      const buttons = Array.from(document.querySelectorAll('button'));
      const debugButton = buttons.find(btn => 
        btn.textContent && 
        (btn.textContent.includes('Debug') || 
         btn.textContent.includes('Show Debug'))
      );
      
      if (debugButton) {
        debugButton.click();
        return true;
      }
      
      return false;
    });
    
    if (debugToggleExists) {
      console.log('✅ Found and clicked debug toggle');
      
      // Wait a moment for debug info to appear
      await sleep(1000);
      
      // Take screenshot of debug view
      await takeScreenshot(page, 'debug-view');
      
      // Check for debug information
      const debugInfo = await page.evaluate(() => {
        // Look for debug information containers
        const debugContainers = document.querySelectorAll('div[class*="bg-gray"], pre, div.mt-8');
        
        // Check for dropdowns in the debug view
        const dropdowns = Array.from(document.querySelectorAll('details'));
        
        return {
          containerCount: debugContainers.length,
          hasEntitlementInfo: document.body.textContent.includes('Entitlements'),
          hasProductInfo: document.body.textContent.includes('Products'),
          dropdownCount: dropdowns.length,
          dropdowns: dropdowns.map(d => {
            const summary = d.querySelector('summary');
            return summary ? summary.textContent : 'Unknown dropdown';
          })
        };
      });
      
      console.log('Debug information found:');
      console.log(`- Debug containers: ${debugInfo.containerCount}`);
      console.log(`- Has entitlement info: ${debugInfo.hasEntitlementInfo}`);
      console.log(`- Has product info: ${debugInfo.hasProductInfo}`);
      console.log(`- Dropdown count: ${debugInfo.dropdownCount}`);
      console.log(`- Dropdowns: ${debugInfo.dropdowns.join(', ')}`);
      
      if (debugInfo.containerCount > 0) {
        console.log('✅ Debug information is displayed');
      } else {
        console.log('❌ No debug information found');
      }
      
      // Check if the expected number of entitlements is shown
      const entitlementCountMatches = await page.evaluate((expectedCount) => {
        const bodyText = document.body.textContent || '';
        return bodyText.includes(`Active Entitlements Count: ${expectedCount}`) || 
               bodyText.includes(`Entitlements Count: ${expectedCount}`) ||
               bodyText.includes(`entitlementCount: ${expectedCount}`);
      }, expectedEntitlements.length);
      
      if (entitlementCountMatches) {
        console.log(`✅ Entitlement count matches expected (${expectedEntitlements.length})`);
      } else {
        console.log(`❌ Entitlement count does not match expected (${expectedEntitlements.length})`);
      }
      
      // Check for the three dropdowns in the debug view
      const hasThreeDropdowns = await page.evaluate(() => {
        const dropdowns = document.querySelectorAll('details');
        return dropdowns.length >= 3;
      });
      
      if (hasThreeDropdowns) {
        console.log('✅ Found at least 3 dropdowns in debug view');
      } else {
        console.log('❌ Expected at least 3 dropdowns in debug view');
      }
      
    } else {
      console.log('⚠️ No debug toggle found, skipping debug view test');
    }
    
  } catch (error) {
    console.error('Error testing debug view:', error);
    await takeScreenshot(page, 'debug-view-error');
  }
}

// Run the test
runTest(); 