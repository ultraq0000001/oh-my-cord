// Abstract NetworkTarget interface. Implementations provide connect/disconnect/link/counters/forceSpeed.
class NetworkTarget {
  constructor(name) { this.name = name; }
  async connect() { throw new Error('not implemented'); }
  async disconnect() { throw new Error('not implemented'); }
  async getLinkState() { throw new Error('not implemented'); }
  async getCounters() { throw new Error('not implemented'); }
  async forceSpeed(speed) { throw new Error('not implemented'); }
}

module.exports = NetworkTarget;
