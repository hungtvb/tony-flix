const fs = require('fs');
const { JSDOM } = require('jsdom');

const playerCode = fs.readFileSync('/tmp/player.js', 'utf8');
const realObf = fs.readFileSync('/tmp/real_obf.txt', 'utf8');

// Hook crypto.subtle.decrypt at Node global level
const realSubtle = globalThis.crypto.subtle;
const origDecrypt = realSubtle.decrypt.bind(realSubtle);
realSubtle.decrypt = async function(algorithm, key, data) {
  console.log('========== crypto.subtle.decrypt INTERCEPTED ==========');
  console.log('algorithm:', JSON.stringify(algorithm));
  console.log('key type:', key ? (key.type || 'unknown') : 'null', 'extractable:', key ? (key.extractable||false) : 'n/a');
  if (key && key.extractable) {
    try {
      const exp = await globalThis.crypto.subtle.exportKey('raw', key);
      console.log('KEY HEX:', Buffer.from(exp).toString('hex'));
    } catch(e) { console.log('export failed:', e.message); }
  }
  const r = await origDecrypt(algorithm, key, data);
  console.log('result len:', r.length);
  return r;
};
console.log('Hooked crypto.subtle.decrypt at global level');

const html = `<!DOCTYPE html><html><head></head><body><div id="player" data-obf="${realObf}"></div></body></html>`;

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  beforeParse(window) {
    if (!window.crypto) window.crypto = globalThis.crypto;
  }
});

const scriptEl = dom.window.document.createElement('script');
scriptEl.textContent = playerCode;
dom.window.document.body.appendChild(scriptEl);

console.log('Appended player.js. Waiting 8s...');
setTimeout(() => { console.log('=== Analysis done ==='); }, 8000);
