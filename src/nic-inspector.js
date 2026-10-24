const { execSync } = require('child_process');

function parseJson(output) {
  if (!output) return null;
  const trimmed = output.trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed); } catch (e) { return null; }
}

class NICInspector {
  _run(ps) {
    try {
      return execSync(`powershell -Command "${ps}"`, { encoding: 'utf8' });
    } catch (e) {
      return null;
    }
  }

  listAdapters() {
    const ps = "Get-NetAdapter | Select-Object Name, InterfaceDescription, Status, LinkSpeed, MacAddress | ConvertTo-Json";
    const out = this._run(ps);
    const parsed = parseJson(out);
    if (!parsed) return [];
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    return arr.map(a => ({
      name: a.Name,
      description: a.InterfaceDescription,
      interfaceDescription: a.InterfaceDescription,
      status: a.Status,
      linkSpeed: a.LinkSpeed,
      macAddress: a.MacAddress,
    }));
  }

  getAdapterByName(name) {
    const adapters = this.listAdapters();
    if (!name) return adapters[0] || null;
    const lower = name.toLowerCase();
    return adapters.find(a => a.name.toLowerCase() === lower) ||
      adapters.find(a => a.name.toLowerCase().includes(lower) || (a.description||'').toLowerCase().includes(lower)) ||
      null;
  }

  getLinkStatus(adapterName) {
    const name = adapterName || 'Ethernet';
    // Use Get-NetAdapter for link state/speed/mac
    const ps = `Get-NetAdapter -Name "${name}" | Select-Object Name, Status, LinkSpeed, MacAddress, FullDuplex | ConvertTo-Json`;
    const out = this._run(ps);
    const parsed = parseJson(out);
    const a = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!a) return null;
    return {
      adapter: a.Name,
      link: (a.Status || '').toLowerCase() === 'up' ? 'up' : 'down',
      status: a.Status,
      speed: a.LinkSpeed,
      duplex: a.FullDuplex ? 'full' : 'half',
      macAddress: a.MacAddress,
    };
  }

  getAdapterInfo(adapterName) {
    const a = this.getAdapterByName(adapterName || 'Ethernet') || this.getAdapterByName('Realtek');
    return a;
  }

  getStatistics(adapterName) {
    const name = adapterName || 'Ethernet';
    try {
      const output = execSync(`powershell -Command "Get-NetAdapterStatistics -Name \\"${name}\\" | ConvertTo-Json"`, { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (e) {
      return null;
    }
  }

  getAdvancedProperties(adapterName) {
    const name = adapterName || 'Ethernet';
    try {
      const output = execSync(`powershell -Command "Get-NetAdapterAdvancedProperty -Name \\"${name}\\" | Select-Object DisplayName, DisplayValue, RegistryKeyword | ConvertTo-Json"`, { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (e) {
      return null;
    }
  }
}

module.exports = NICInspector;
