const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=swiftshader'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  
  // Capture ALL requests
  const allReqs = [];
  page.on('request', req => { allReqs.push(req.url()); });
  page.on('response', resp => { if(resp.status() >= 400) console.log('HTTP', resp.status(), resp.url().substring(0,100)); });
  page.on('console', msg => { if(msg.type()==='error') console.log('CONSOLE ERR:', msg.text().substring(0,150)); });
  page.on('pageerror', err => console.log('PAGE ERR:', err.message.substring(0,150)));

  const url = 'https://embed12.streamc.xyz/embed.php?hash=80fdbde3b33c01e407759343bc86c8f5';
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(e => console.log('goto err:', e.message));
  } catch (e) {
    console.log('NAV ERROR:', e.message);
  }
  
  await page.waitForTimeout(10000);
  
  // Check if jwplayer object exists
  const jwInfo = await page.evaluate(() => {
    return {
      jwplayer: typeof window.jwplayer,
      jwplayerInstances: document.querySelectorAll('.jwplayer').length,
      iframes: document.querySelectorAll('iframe').length,
      bodyHTML: document.getElementById('player') ? document.getElementById('player').outerHTML.substring(0, 500) : 'NO PLAYER DIV'
    };
  });
  console.log('JWPLAYER INFO:', JSON.stringify(jwInfo, null, 2));
  
  console.log('\nTOTAL REQUESTS:', allReqs.length);
  const interesting = allReqs.filter(u => /\.(ts|m3u8|mp4|webm|m4s|json|js|css)$/.test(u) || u.includes('stream') || u.includes('video'));
  console.log('INTERESTING REQUESTS:', interesting.length);
  interesting.slice(0, 30).forEach(r => console.log('  ', r.substring(0, 120)));
  
  await browser.close();
})();
