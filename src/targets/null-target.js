const NetworkTarget = require('../network-target');

class NullTarget extends NetworkTarget {
  constructor() { super('null'); }
  async connect() { return { ok: true }; }
  async disconnect() { return { ok: true }; }
  async getLinkState() { return { link: 'up' }; }
  async getCounters() { return { rx: 0, tx: 0 }; }
  async forceSpeed(speed) { return { ok: true, speed }; }
}

module.exports = NullTarget;
