const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Listen for console messages and page errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('BROWSER ERROR:', msg.text());
      } else {
        console.log('BROWSER CONSOLE:', msg.text());
      }
    });

    page.on('pageerror', err => {
      console.error('PAGE ERROR:', err.message);
    });

    console.log('Navigating to http://localhost:3000/dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    
    // Check if the body is empty (whitescreen)
    const content = await page.content();
    console.log('Body length:', content.length);
    if (content.length < 500 || content.includes('Application error')) {
       console.log('Possible whitescreen detected!');
    } else {
       console.log('Page loaded successfully.');
    }
    
    await browser.close();
  } catch (error) {
    console.error('Script failed:', error);
  }
})();
