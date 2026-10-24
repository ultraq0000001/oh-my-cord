# TP-Link Patch Cord Meter & Cable Diagnostic Tool (`tp-link-meter`)

## 1. Hardware & Environment Discovery Summary

### Router: TP-Link Archer C50 v6.0
* **IP Address**: `192.168.0.1`
* **Firmware**: Stock TP-Link `0.9.1 0.5 v0001.0 Build 250119 Rel.51087n(4555)`
* **SoC / Switch Chip**: MediaTek **MT7628AN** (MIPS 24KEc @ 580 MHz, 8 MB Flash, 64 MB RAM)
* **Ethernet Ports**: **5x 100BASE-TX (Fast Ethernet, 100 Mbps max)** (1x WAN + 4x LAN)
* **Interfaces**:
  * **Port 80 (HTTP Web UI)**: Uses RSA + AES-CBC (`/cgi_gdpr`) encryption. Authentication verified and working.
  * **Port 22 (SSH)**: Runs `dropbear_2020.80` for TP-Link's Agile/Tether app tunnel; password auth succeeds, but shell/exec/pty requests are locked down in stock firmware.
  * **OpenWrt Compatibility**: Supported since OpenWrt 24.10+ (`ramips/mt76x8`), installable via Web UI by prepending the 131,584-byte TP-Link bootloader header from stock firmware onto an OpenWrt sysupgrade image.

### PC Network Card: Realtek RTL8168H/8111H Gigabit Ethernet
* **Interface**: `Ethernet` (`Realtek PCIe GbE Family Controller`, `PCI\VEN_10EC&DEV_8168&REV_15`)
* **Ethernet Port**: **1000BASE-T (Gigabit Ethernet, uses all 4 twisted pairs / 8 wires)**
* **Current Driver**: Microsoft inbox driver `rtcx21x64.inf` (`1.0.0.14`)

---

## 2. Critical Hardware Finding for Testing Patch Cords

Standard Cat5e / Cat6 patch cords have **4 twisted pairs (8 wires)**:
* **Pair 1 & Pair 2 (Pins 1, 2, 3, 6)**: Used by **100BASE-TX (100 Mbps)**.
* **Pair 3 & Pair 4 (Pins 4, 5, 7, 8)**: Used **only** by **1000BASE-T (1 Gbps)** and PoE.

Because the **TP-Link Archer C50 v6 only has 100 Mbps (100BASE-TX) ports**, its physical switch ports only connect to **4 out of the 8 wires** (pins 1, 2, 3, and 6) during normal operation!
* If a customer buys a Cat5e/Cat6 cable for Gigabit Ethernet and **pins 4, 5, 7, or 8 are broken, un-crimped, or shorted**, a 100 Mbps link test between the PC and the Archer C50 will still negotiate at 100 Mbps and pass 100% of traffic without noticing the dead pairs.

### How to Test All 8 Wires (4 Pairs):
1. **Hardware TDR (Time Domain Reflectometry) on the PC's Realtek RTL8168 Gigabit NIC**:
   * The Realtek RTL8168 chip on your PC has a built-in hardware TDR pulse generator on all 4 pairs (A: 1-2, B: 3-6, C: 4-5, D: 7-8).
   * It can measure the state of all 4 pairs (Normal, Open, Short, Impedance Mismatch) and cable length/distance to fault—even when the other end is unplugged or plugged into a 100M router!
   * Accessing the RTL8168 TDR registers requires either:
     * Installing the official **Realtek Diagnostic Utility / NDIS Driver** on Windows, OR
     * Booting/running a lightweight Linux environment (or USB/VM with PCI passthrough) with `ethtool --cable-test`.
2. **Router Loopback / Dual-Port Test (if testing 2 ports on the router)**:
   * Only tests 4 wires (pins 1, 2, 3, 6) unless paired with Gigabit hardware.
3. **Active Link & Stress Certification (PC <-> Router)**:
   * Negotiates link (10M Half/Full, 100M Half/Full), measures link establishment time, runs high-pps UDP/ICMP/TCP stress traffic, and monitors hardware FCS/CRC/Alignment/Symbol error counters on both the PC NIC and the router switch (`swconfig` on OpenWrt or `/cgi_gdpr` stats on stock firmware).

---

## 3. High-Level Project Plan

### Phase 1: Architecture & Approach Selection
Choose the best combination based on your workflow:
* **Option A (Stock Firmware + PC Diagnostic Suite)**:
  * Keep stock TP-Link firmware on the Archer C50.
  * Use a custom Node.js/Python CLI & Web Dashboard in this project that queries PC NDIS hardware counters, Router `/cgi_gdpr` interface counters, forces speed/duplex modes (`10M` / `100M`), and runs a high-throughput stress test to detect bad crimps/packet loss.
* **Option B (Flash OpenWrt to Archer C50 + Router/PC Agent)**:
  * Flash OpenWrt 24.10 to the Archer C50 v6 (unlocks root SSH, `swconfig`, `ethtool`, `iperf3`, raw MediaTek MT7628 switch port MIB counters, and per-port link state monitoring).
  * Build a small daemon/script on the router + dashboard on the PC that automatically starts testing a cable the moment you plug it in.
* **Option C (Full 8-Wire Gigabit TDR + Active Stress Test)**:
  * Enable Realtek RTL8168 TDR diagnostics on the PC (to verify all 4 pairs / 8 wires including pins 4, 5, 7, 8) + combine with the active PC-to-Router stress test.

### Phase 2: Core Diagnostic Modules (`src/`)
1. **`router-client`**:
   * Stock TP-Link `/cgi_gdpr` RSA/AES client (or OpenWrt SSH/ubus client) to read router switch port states and error counters.
2. **`nic-inspector`**:
   * Windows Realtek NIC controller to read link speed, duplex, NDIS hardware error counters (`ReceivedPacketErrors`, `OutboundPacketErrors`, alignment/FCS errors), and toggle speed/duplex negotiation.
3. **`stress-tester`**:
   * High-frequency packet burst & throughput tester to expose marginal crimps, crosstalk, or intermittent contact (wiggle test).
4. **`ui` / CLI Runner**:
   * Automated "Plug & Test" workflow with clear **PASS / FAIL** report for each patch cord.

### Phase 3: Validation & Calibration
* Test with a known-good patch cord.
* Test with a simulated fault (e.g.,wiggling connector, forced speed modes) to verify error detection sensitivity.
