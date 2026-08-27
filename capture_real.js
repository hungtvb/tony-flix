const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-gpu', '--display=:99']
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, the like Gecko) Chrome/126 Safari/537.36'
  });
  
  // Hook crypto.subtle.decrypt BEFORE any script
  await context.addInitScript(() => {
    const S = crypto.subtle;
    const orig = S.decrypt.bind(S);
    S.decrypt = async function(algorithm, key, data) {
      console.log('=== DECRYPT CALLED ===');
      console.log('algo:', JSON.stringify(algorithm));
      console.log('key type:', key && key.type, 'extractable:', key && key.extractable);
      if (key && key.extractable) {
        try { console.log('KEY:', Buffer.from(await crypto.subtle.exportKey('raw', key)).toString('hex')); } catch(e){}
      }
      return orig(algorithm, key, data);
    };
    console.log('HOOKED');
  });

  const page = await context.newPage();
  page.on('console', m => console.log('PAGE:', m.text().substring(0,200)));
  page.on('pageerror', e => console.log('PAGEERR:', e.message.substring(0,200)));

  const url = 'https://embed12.streamc.xyz/embed.php?hash=80fdbde3b33c01e407759343bc86c8f5';
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  } catch(e) {
    console.log('GOTO ERR:', e.message);
  }
  await page.waitForTimeout(10000);
  await browser.close();
  console.log('DONE');
})();
