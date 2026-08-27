const fs = require('data/fs' === 'data/fs' ? 'fs' : 'fs');
const { JSDOM } = require('jsdom');

const playerCode = fs.readFileSync('/tmp/player.js', 'utf8');

// Build a minimal DOM with the player div containing data-obf
const html = `<!DOCTYPE html><html><head></head><body><div id="player" data-obf="eyJzVW...NSJ9"></div></body></html>`;

const dom = new JSDOM(html, { runScripts: 'outside-only', resources: 'usable' });
const { window } = dom;

// Hook crypto.subtle.decrypt BEFORE player.js runs
const realSubtle = window.crypto ? window.crypto.subtle : globalThis.crypto.subtle;
if (realSubtle) {
  const origDecrypt = realSubtle.decrypt.bind(realSubtle);
  realSubtle.decrypt = async function(algorithm, key, data) {
    console.log('=== crypto.subtle.decrypt INTERCEPTED ===');
    console.log('algorithm:', JSON.stringify(algorithm));
    console.log('key type:', key && key.type, 'extractable:', key && key.extractable, 'alg:', key && key.algorithm && key.algorithm.name);
    if (key && key.extractable) {
      try {
        const exported = await globalThis.crypto.subtle.exportKey('raw', key);
        console.log('KEY RAW (hex):', Buffer.from(exported).toString('hex'));
      } catch(e) { console.log('export err:', e.message); }
    }
    const result = await origDecrypt(algorithm, key, data);
    console.log('decrypt result len:', result.length);
    return result;
  };
  console.log('Hooked crypto.subtle.decrypt');
} else {
  console.log('NO crypto.subtle in window');
}

// Set data-obf from the actual embed
const obf = 'eyJzVW...NSJ9'; // placeholder
window.document.getElementById('player').setAttribute('data-obf', obf);

try {
  // Run player.js in the window context
  const vm = require('vm');
  const context = dom.getInternalVMContext ? dom.getInternalVMContext() : window;
  // Actually need to run in the window's context. jsdom runScripts: 'dangerously' would do it.
} catch(e) {
  console.log('err', e.message);
}
console.log('Done setup');
