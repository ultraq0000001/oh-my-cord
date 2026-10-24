const fs = require('fs');
const path = require('path');
const RouterClient = require('./src/router-client');

function parseRouterFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^(\w+)="([^"]*)"/);
    if (m) vars[m[1]] = m[2];
  }
  return vars;
}

(async () => {
  const vars = parseRouterFile(path.join(__dirname, '.ROUTER'));
  const ip = vars.IP;
  const user = vars.USER;
  const password = vars.PASSWORD;

  const client = new RouterClient(ip, user, password);
  console.log('Logging in...');
  const loginRes = await client.login();
  console.log('Login result:', JSON.stringify(loginRes).slice(0, 500));

  await new Promise(r => setTimeout(r, 3000));

  console.log('Getting status...');
  const status = await client.getStatus();
  const out = JSON.stringify(status);
  console.log('Status (truncated):', out.slice(0, 2000));

  // cleanup
  client.sessionValid = false;
  client.cookie = null;
  client.enc = null;
  console.log('Done.');
})();