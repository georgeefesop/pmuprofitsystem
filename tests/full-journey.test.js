async function testDashboardAccess(page) {
  console.log('Testing dashboard access');
  
  try {
    console.log('Looking for dashboard button');
    
    // Wait a moment for any animations or state changes to complete
    await page.waitForTimeout(2000);
    
    // Get all buttons and links on the page for debugging
    const buttonsAndLinks = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const links = Array.from(document.querySelectorAll('a'));
      
      return [...buttons, ...links].map(el => ({
        type: el.tagName.toLowerCase(),
        text: el.textContent.trim(),
        id: el.id,
        className: el.className,
        href: el.tagName.toLowerCase() === 'a' ? el.href : null,
        rect: el.getBoundingClientRect ? {
          top: el.getBoundingClientRect().top,
          left: el.getBoundingClientRect().left,
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height
        } : null
      }));
    });
    
    console.log('Buttons and links on success page:');
    console.log(JSON.stringify(buttonsAndLinks, null, 2));
    
    // Try multiple selectors for the dashboard button
    const dashboardButtonSelectors = [
      'button:has-text("Go to Dashboard")',
      'button.bg-purple-600',
      'button.bg-indigo-600',
      'button:has-text("Dashboard")',
      'button:has-text("Go to")',
      'a:has-text("Go to Dashboard")',
      'a:has-text("Dashboard")'
    ];
    
    let dashboardElement = null;
    let usedSelector = '';
    
    // Try each selector until we find a matching element
    for (const selector of dashboardButtonSelectors) {
      console.log(`Trying selector: ${selector}`);
      dashboardElement = await page.$(selector);
      
      if (dashboardElement) {
        usedSelector = selector;
        console.log(`Found dashboard element with selector: ${selector}`);
        break;
      }
    }
    
    if (dashboardElement) {
      // Get the text of the element for logging
      const buttonText = await dashboardElement.evaluate(el => el.textContent.trim());
      console.log(`Found dashboard element with text: "${buttonText}"`);
      
      // Take a screenshot before clicking
      await page.screenshot({ path: 'before-dashboard-click.png' });
      
      // Click the element
      console.log(`Clicking dashboard element with selector: ${usedSelector}`);
      await dashboardElement.click();
      
      // Wait for navigation to complete
      console.log('Waiting for navigation after dashboard click');
      await page.waitForNavigation({ timeout: 5000 }).catch(() => {
        console.log('Navigation timeout, checking current URL');
      });
      
      // Take a screenshot after clicking
      await page.screenshot({ path: 'after-dashboard-click.png' });
    } else {
      // Fallback to the dashboard link in the navbar
      console.log('Dashboard button not found, looking for dashboard link by URL');
      const dashboardLinkSelector = 'a[href*="/dashboard"]';
      const hasDashboardLink = await page.$(dashboardLinkSelector).then(Boolean);
      
      if (hasDashboardLink) {
        console.log('Found dashboard link by href, clicking it');
        await page.click(dashboardLinkSelector);
        
        // Wait for navigation to complete
        await page.waitForNavigation({ timeout: 5000 }).catch(() => {
          console.log('Navigation timeout, checking current URL');
        });
      } else {
        console.error('Could not find any dashboard button or link');
        
        // Take a screenshot to debug
        await page.screenshot({ path: 'dashboard-button-not-found.png' });
        return;
      }
    }
    
    // Check if we're on the dashboard or login page
    const currentUrl = page.url();
    console.log('Current URL after dashboard navigation:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('Successfully navigated to dashboard');
    } else if (currentUrl.includes('/login')) {
      console.log('Redirected to login page instead of dashboard');
      
      // Check if the redirect URL contains the purchase_success and session_id parameters
      const redirectParam = await page.evaluate(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('redirect');
      });
      
      console.log('Redirect parameter on login page:', redirectParam);
    }
  } catch (error) {
    console.error('Error testing dashboard access:', error);
    
    // Take a screenshot on error
    await page.screenshot({ path: 'dashboard-access-error.png' });
  }
} 