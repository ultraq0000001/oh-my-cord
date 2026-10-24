const http = require('http');
const fs = require('fs');
const path = require('path');

global.window = global;
global.navigator = { appVersion: '' };
global.$ = { extend: Object.assign };

const tempDir = path.join(process.env.TEMP || process.env.TMP || path.join(process.env.LOCALAPPDATA, 'Temp'), 'opencode');
const cryptoJS = path.join(tempDir, 'cryptoJS.min.js');
const encrypt = path.join(tempDir, 'encrypt.js');
const tpEncrypt = path.join(tempDir, 'tpEncrypt.js');
if (fs.existsSync(cryptoJS)) eval(fs.readFileSync(cryptoJS, 'utf8'));
if (fs.existsSync(encrypt)) eval(fs.readFileSync(encrypt, 'utf8'));
if (fs.existsSync(tpEncrypt)) eval(fs.readFileSync(tpEncrypt, 'utf8'));

const REQUEST_TIMEOUT = 5000;

function req(ip, urlPath, method, headers, body, timeoutMs) {
  timeoutMs = timeoutMs || REQUEST_TIMEOUT;
  return new Promise((resolve, reject) => {
    let settled = false;
    const r = http.request({ host: ip, port: 80, path: urlPath, method, headers }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ status: res.statusCode, headers: res.headers, body: d });
      });
    });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { r.destroy(); } catch (e) {}
      reject(new Error('Request timeout after ' + Math.round(timeoutMs / 1000) + 's'));
    }, timeoutMs);
    r.on('error', e => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(e);
    });
    if (body) r.write(body);
    r.end();
  });
}

class RouterClient {
  constructor(ip, user, password) {
    this.ip = ip;
    this.user = user;
    this.password = password;
    this.cookie = null;
    this.enc = null;
    this._lastReq = 0;
    this.sessionValid = false;
  }

  async _throttle() {
    const now = Date.now();
    if (this._lastReq && now - this._lastReq < 500) {
      await new Promise(r => setTimeout(r, 500 - (now - this._lastReq)));
    }
    this._lastReq = Date.now();
  }

  isSessionValid() {
    return !!(this.cookie && this.enc && this.sessionValid);
  }

  async _retry(fn) {
    const delays = [1000, 2000];
    let lastErr;
    for (let i = 0; i <= 1; i++) {
      try {
        if (i > 0) {
          const wait = delays[i - 1] || 1000;
          await new Promise(r => setTimeout(r, wait));
        }
        return await fn();
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  }

  async login() {
    if (this.isSessionValid()) {
      return { ret: 0, reused: true };
    }
    await this._throttle();
    try {
      return await this._retry(async () => {
const p = await req(this.ip, '/cgi/getParm', 'POST', { Referer: `http://${this.ip}/` });
        const ee = p.body.match(/ee="([^"]+)"/)[1];
        const nn = p.body.match(/nn="([^"]+)"/)[1];
        const seq = p.body.match(/seq="([^"]+)"/)[1];

        this.enc = $.encrypt.encryptManager.genEncryptor();
        this.enc.setSeq(seq);
        this.enc.setRSAKey(nn, ee);
        this.enc.setHash(this.user, this.password);
        this.enc.genAESKey();

        const plainLogin = `8\r\n[/cgi/login#0,0,0,0,0,0#0,0,0,0,0,0]0,2\r\nusername=${this.user}\r\npassword=${this.password}\r\n`;
        const encrypted = this.enc.AESEncrypt(plainLogin, 1);
        const postData = `sign=${encrypted.sign}\r\ndata=${encrypted.data}\r\n`;

        const l = await req(this.ip, '/cgi_gdpr', 'POST', {
          Referer: `http://${this.ip}/`,
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(postData)
        }, postData);

        if (l.headers['set-cookie']) {
          this.cookie = l.headers['set-cookie'][0].split(';')[0];
        }
        const decrypted = this.enc.AESDecrypt(l.body);
        this.sessionValid = true;
        return decrypted;
      });
    } catch (e) {
      this.sessionValid = false;
      return { error: 'router_unavailable', message: e.message };
    }
  }


  async isConnected() {
    const r = await this.login();
    if (r && r.error) return false;
    return true;
  }
}

module.exports = RouterClient;

module.exports = RouterClient;
