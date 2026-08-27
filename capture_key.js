const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  });
  
  // Inject script to hook crypto.subtle.decrypt BEFORE any page script runs
  await context.addInitScript(() => {
    const origDecrypt = crypto.subtle.decrypt.bind(crypto.subtle);
    crypto.subtle.decrypt = async function(algorithm, key, data) {
      console.log('=== crypto.subtle.decrypt called ===');
      console.log('algorithm:', JSON.stringify(algorithm));
      if (key && key.type === 'secret') {
        console.log('KEY (secret, length):', key.algorithm ? key.algorithm.name : 'unknown', key.usage);
        // Try to extract key bytes if possible
        if (key.extractable) {
          try {
            const exported = await crypto.subtle.exportKey('raw', key);
            console.log('KEY BYTES (hex):', Buffer.from(exported).toString('hex'));
          } catch(e) { console.log('export failed:', e.message); }
        } else {
          console.log('KEY not extractable');
        }
      }
      const result = await origDecrypt(algorithm, key, data);
      console.log('decrypt result length:', result.length);
      return result;
    };
    console.log('HOOK INSTALLED: crypto.subtle.decrypt');
  });

  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text().substring(0,300)));
  page.on('pageerror', err => console.log('PAGE ERR:', err.message.substring(0,200)));

  const url = 'https://embed12.streamc.xyz/embed.php?hash=80fdbde3b33c01e407759343bc86c8f5';
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log('goto err:', e.message));
  } catch (e) {
    console.log('NAV ERROR:', e.message);
  }
  
  await page.waitForTimeout(15000);
  
  await browser.close();
})();
