const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=swiftshader'] });
  const page = await browser.newPage();
  
  const requests = [];
  page.on('request', req => {
    const u = req.url();
    if (u.includes('.ts') || u.includes('.m3u8') || u.includes('video') || u.includes('segment') || u.includes('chunk') || u.includes('.mp4')) {
      requests.push(u.substring(0, 150));
    }
  });

  const url = 'https://embed12.streamc.xyz/embed.php?hash=80fdbde3b33c01e407759343bc86c8f5';
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(e => console.log('goto err:', e.message));
  } catch (e) {
    console.log('NAV ERROR:', e.message);
  }
  
  await page.waitForTimeout(8000);
  
  const result = await page.evaluate(() => {
    const videos = document.querySelectorAll('video');
    const info = [];
    videos.forEach((v, i) => {
      info.push({
        idx: i,
        src: v.src || v.currentSrc,
        width: v.videoWidth,
        height: v.videoHeight,
        readyState: v.readyState,
        currentTime: v.currentTime,
        duration: v.duration,
        paused: v.paused,
        readyStateName: ['HAVE_NOTHING','HAVE_METADATA','HAVE_CURRENT_DATA','HAVE_FUTURE_DATA','HAVE_ENOUGH_DATA'][v.readyState] || v.readyState
      });
    });
    return info;
  });
  console.log('VIDEO ELEMENTS:', JSON.stringify(result, null, 2));
  console.log('\nNETWORK REQUESTS:', requests.length);
  requests.slice(0, 20).forEach(r => console.log('  ', r));
  
  await browser.close();
})();
