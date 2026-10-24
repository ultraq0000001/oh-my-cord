const { execSync } = require('child_process');

class NICInspector {
  getAdapterInfo() {
    try {
      const output = execSync('powershell -Command "Get-NetAdapter | Where-Object { $_.InterfaceDescription -match \'Realtek\' } | Select-Object Name, InterfaceDescription, Status, LinkSpeed, MacAddress | ConvertTo-Json"', { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (e) {
      return null;
    }
  }

  getStatistics() {
    try {
      const output = execSync('powershell -Command "Get-NetAdapterStatistics -Name Ethernet | ConvertTo-Json"', { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (e) {
      return null;
    }
  }

  getAdvancedProperties() {
    try {
      const output = execSync('powershell -Command "Get-NetAdapterAdvancedProperty -Name Ethernet | Select-Object DisplayName, DisplayValue, RegistryKeyword | ConvertTo-Json"', { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (e) {
      return null;
    }
  }
}

module.exports = NICInspector;
