async function testDashboardAccess(page) {
  console.log('Testing dashboard access');
  
  // Look for the dashboard button
  console.log('Looking for dashboard button');
  
  // Get all buttons and links on the page
  const buttonsAndLinks = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(button => ({
      type: 'button',
      text: button.textContent.trim(),
      id: button.id,
      className: button.className,
      href: null
    }));
    
    const links = Array.from(document.querySelectorAll('a')).map(link => ({
      type: 'a',
      text: link.textContent.trim(),
      id: link.id,
      className: link.className,
      href: link.href
    }));
    
    return [...buttons, ...links];
  });
  
  console.log('Buttons and links on success page');
  console.log(buttonsAndLinks);
  
  try {
    // Specifically target the "Go to Dashboard" button in the success page content
    // Using a more specific selector that includes the button's class to ensure we get the right one
    const dashboardButton = await page.waitForSelector('button.bg-purple-600:has-text("Go to Dashboard")', { timeout: 5000 });
    
    if (dashboardButton) {
      console.log('Found "Go to Dashboard" button, clicking it');
      await dashboardButton.click();
    } else {
      throw new Error('Could not find "Go to Dashboard" button');
    }
  } catch (error) {
    console.log('Error finding "Go to Dashboard" button:', error.message);
    
    // Fallback to finding any button with "Go to Dashboard" text
    try {
      console.log('Trying alternative selector for "Go to Dashboard" button');
      const anyDashboardButton = await page.$('button:has-text("Go to Dashboard")');
      
      if (anyDashboardButton) {
        console.log('Found alternative "Go to Dashboard" button, clicking it');
        await anyDashboardButton.click();
      } else {
        throw new Error('Could not find any "Go to Dashboard" button');
      }
    } catch (fallbackError) {
      console.log('Error with fallback approach:', fallbackError.message);
      
      // Last resort: try to find dashboard link by href
      const dashboardLink = buttonsAndLinks.find(item => 
        item.type === 'a' && 
        item.href && 
        item.href.includes('/dashboard')
      );
      
      if (dashboardLink) {
        console.log('Found dashboard link by href as last resort');
        await page.click(`a[href="${dashboardLink.href}"]`);
      } else {
        throw new Error('Could not find any dashboard button or link');
      }
    }
  }
  
  // Wait for navigation to complete
  await page.waitForTimeout(1000);
  
  // Get the current URL
  const currentUrl = page.url();
  console.log('Current URL after dashboard navigation:', currentUrl);
  
  // Check if we're on the dashboard page
  if (currentUrl.includes('/dashboard')) {
    console.log('Successfully navigated to dashboard');
  } else if (currentUrl.includes('/login')) {
    console.log('Redirected to login page instead of dashboard');
  }
} 