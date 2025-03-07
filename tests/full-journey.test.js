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
  
  // Find the "Go to Dashboard" button
  const dashboardButton = await page.waitForSelector('button:has-text("Go to Dashboard")');
  if (dashboardButton) {
    console.log('Found "Go to Dashboard" button, clicking it');
    await dashboardButton.click();
  } else {
    // Fallback to finding dashboard link by href
    const dashboardLink = buttonsAndLinks.find(item => 
      item.type === 'a' && 
      item.href && 
      item.href.includes('/dashboard')
    );
    
    if (dashboardLink) {
      console.log('Found dashboard link by href');
      await page.click(`a[href="${dashboardLink.href}"]`);
    } else {
      throw new Error('Could not find dashboard button or link');
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