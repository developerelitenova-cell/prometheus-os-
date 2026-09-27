const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  await page.goto('http://localhost:3000/');
  
  // Set fake supabase session
  await page.evaluate(() => {
    window.localStorage.setItem('sb-xkztnewwaeiizseopase-auth-token', JSON.stringify({
      access_token: "fake_token",
      expires_in: 3600,
      refresh_token: "fake_refresh",
      token_type: "bearer",
      user: {
        id: "fake_id",
        aud: "authenticated",
        role: "authenticated",
        email: "test@example.com",
        app_metadata: {},
        user_metadata: {}
      }
    }));
  });

  await page.goto('http://localhost:3000/workspace', { waitUntil: 'networkidle0' });

  // wait a bit
  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
})();
