const fs = require('fs');
const { JSDOM } = require('jsdom');

const playerCode = fs.readFileSync('/tmp/player.js', 'utf8');

// Hook crypto.subtle.decrypt at the Node global level BEFORE jsdom loads
const realDecrypt = globalThis.crypto?.subtle?.decrypt;
if (globalThis.crypto && globalThis.crypto.subtle) {
  const orig = globalThis.crypto.subtle.decrypt.bind(globalThis.crypto.subtle);
  globalThis.crypto.subtle.decrypt = async function(algorithm, key, data) {
    console.log('========== crypto.subtle.decrypt INTERCEPTED ==========');
    console.log('algorithm:', JSON.stringify(algorithm));
    console.log('key:', key ? (key.type || 'unknown') + ' extractable=' + (key.extractable||false) : 'null');
    if (key && key.extractable) {
      try {
        const exp = await globalThis.crypto.subtle.exportKey('raw', key);
        console.log('KEY HEX:', Buffer.from(exp).toString('hex'));
      } catch(e) { console.log('export failed:', e.message); }
    }
    const r = await orig(algorithm, key, data);
    console.log('result len:', r.length);
    return r;
  };
}

const obf = 'eyJzVW...NSJ9';
const html = `<!DOCTYPE html><html><head></head><body><div id="player" data-obf="${obf}"></div></body></html>`;

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  beforeParse(window) {
    // Provide crypto if missing
    if (!window.crypto) window.crypto = globalThis.crypto;
  }
});

// Now inject player.js to run
const scriptEl = dom.window.document.createElement('script');
scriptEl.textContent = playerCode;
dom.window.document.body.appendChild(scriptEl);

console.log('player.js appended. Waiting...');
setTimeout(() => { console.log('Done waiting'); }, 5000);
