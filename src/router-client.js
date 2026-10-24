const http = require('http');
const fs = require('fs');
const path = require('path');

global.window = global;
global.navigator = { appVersion: '' };
global.$ = { extend: Object.assign };

const tempDir = process.env.TEMP || process.env.TMP || path.join(process.env.LOCALAPPDATA, 'Temp', 'opencode');
const cryptoJS = path.join(tempDir, 'cryptoJS.min.js');
const encrypt = path.join(tempDir, 'encrypt.js');
const tpEncrypt = path.join(tempDir, 'tpEncrypt.js');
if (fs.existsSync(cryptoJS)) eval(fs.readFileSync(cryptoJS, 'utf8'));
if (fs.existsSync(encrypt)) eval(fs.readFileSync(encrypt, 'utf8'));
if (fs.existsSync(tpEncrypt)) eval(fs.readFileSync(tpEncrypt, 'utf8'));

function req(ip, urlPath, method, headers, body) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: ip, port: 80, path: urlPath, method, headers }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: d }));
    });
    r.on('error', reject);
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
  }

  async _throttle() {
    const now = Date.now();
    if (this._lastReq && now - this._lastReq < 1000) {
      await new Promise(r => setTimeout(r, 1000 - (now - this._lastReq)));
    }
    this._lastReq = Date.now();
  }

  async login() {
    await this._throttle();
    try {
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
      return decrypted;
    } catch (e) {
      return { error: e.message, degraded: true };
    }
  }

  async call(plain) {
    await this._throttle();
    try {
      const encrypted = this.enc.AESEncrypt(plain, 0);
      const postData = `sign=${encrypted.sign}\r\ndata=${encrypted.data}\r\n`;
      const headers = {
        Referer: `http://${this.ip}/`,
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(postData)
      };
      if (this.cookie) headers.Cookie = this.cookie;
      const res = await req(this.ip, '/cgi_gdpr', 'POST', headers, postData);
      return this.enc.AESDecrypt(res.body);
    } catch (e) {
      return { error: e.message, degraded: true };
    }
  }

  async getStatus() {
    const q = [
      '5&5&5&5&1',
      '[LAN_ETH_INTF#0,0,0,0,0,0#0,0,0,0,0,0]0,0',
      '[WAN_ETH_INTF#0,0,0,0,0,0#0,0,0,0,0,0]1,0',
      '[WAN_ETH_INTF_STATS#0,0,0,0,0,0#0,0,0,0,0,0]2,0',
      '[STAT_ENTRY#0,0,0,0,0,0#0,0,0,0,0,0]3,0',
      '[ETH_SWITCH#0,0,0,0,0,0#0,0,0,0,0,0]4,0',
      ''
    ].join('\r\n');
    return await this.call(q);
  }

  parseStatus(raw) {
    const sections = [];
    let current = null;
    for (const line of String(raw).split(/\r?\n/)) {
      const m = line.match(/^\[(.+)\]$/);
      if (m) { current = { name: m[1], fields: {} }; sections.push(current); }
      else if (current && line.includes('=')) {
        const [k, v] = line.split('=');
        current.fields[k.trim()] = v;
      }
    }
    return { raw, sections };
  }

  async getStatusStructured() {
    const raw = await this.getStatus();
    if (raw && raw.degraded) return raw;
    return this.parseStatus(raw);
  }
}

module.exports = RouterClient;
