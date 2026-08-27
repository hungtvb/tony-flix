const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('request', req => {
    const u = req.url();
    if (u.includes('.ts') || u.includes('.m3u8') || u.includes('video') || u.includes('segment') || u.includes('chunk')) {
      console.log('NETWORK REQ:', u.substring(0, 120));
    }
  });
  page.on('response', resp => {
    const u = resp.url();
    if (u.includes('.ts') || u.includes('.m3u8') || u.includes('video') || u.includes('segment') || u.includes('chunk')) {
      console.log('NETWORK RESP:', resp.status(), u.substring(0, 120));
    }
  });

  const url = 'https://embed12.streamc.xyz/embed.php?hash=80fdbde3b33c01e407759343bc86c8f5';
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => console.log('goto err:', e.message));
  } catch (e) {
    console.log('NAV ERROR:', e.message);
  }
  
  await page.waitForTimeout(5000);
  
  // Try to read video element from inside
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
        paused: v.paused
      });
    });
    return info;
  });
  console.log('VIDEO ELEMENTS:', JSON.stringify(result, null, 2));
  
  await browser.close();
})();
