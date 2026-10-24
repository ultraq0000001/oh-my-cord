const NetworkTarget = require('../network-target');
const RouterClient = require('../router-client');
const { readRouterConfig } = require('../utils');

class RouterTPLinkTarget extends NetworkTarget {
  constructor(config) {
    super('router-tp-link');
    this.config = config || null;
    this.client = null;
  }
  async connect() {
    if (!this.config) return { ok: false, error: 'no config' };
    this.client = new RouterClient(this.config.ip, this.config.user, this.config.password);
    try {
      const r = await this.client.login();
      if (r && r.error) return { ok: false, error: r.error };
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }
  async disconnect() { this.client = null; return { ok: true }; }
  async getLinkState() {
    if (!this.client) {
      const c = await this.connect();
      if (!c.ok) return { error: 'router_unavailable' };
    }
    try {
      const s = await this.client.getStatus();
      if (s && s.error) return { error: 'router_unavailable' };
      return { status: s };
    } catch (e) { return { error: 'router_unavailable', message: e.message }; }
  }
  async getCounters() { return this.getLinkState(); }
  async forceSpeed() { return { note: 'router speed forcing not supported' }; }
}

module.exports = RouterTPLinkTarget;
