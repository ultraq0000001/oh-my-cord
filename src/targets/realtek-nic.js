const NetworkTarget = require('../network-target');
const NICInspector = require('../nic-inspector');

class RealtekNICTarget extends NetworkTarget {
  constructor() {
    super('realtek-nic');
    this.nic = new NICInspector();
  }
  async connect() { return { ok: true }; }
  async disconnect() { return { ok: true }; }
  async getLinkState() { return this.nic.getAdapterInfo(); }
  async getCounters() { return this.nic.getStatistics(); }
  async forceSpeed(speed) { return { requested: speed, note: 'NIC speed forcing not supported via this interface' }; }
}

module.exports = RealtekNICTarget;
