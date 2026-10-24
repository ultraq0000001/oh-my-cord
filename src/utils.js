const fs = require('fs');
const path = require('path');

function readRouterConfig() {
  const configPath = path.join(process.cwd(), '.ROUTER');
  if (!fs.existsSync(configPath)) {
    throw new Error('.ROUTER file not found in cwd');
  }
  const content = fs.readFileSync(configPath, 'utf8');
  const ip = (content.match(/IP="([^"]+)"/) || [])[1];
  const user = (content.match(/USER="([^"]+)"/) || [])[1];
  const password = (content.match(/PASSWORD="([^"]+)"/) || [])[1];
  return { ip, user, password };
}

module.exports = { readRouterConfig };
