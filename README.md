# TP-Link Patch Cord Meter

Tool to diagnose Ethernet patch cord link quality between a TP-Link router and a PC for custom patch cord manufacturing QA.

## Hardware Requirements
- TP-Link Archer C50 v6.0 (stock firmware) - 5x 100BASE-TX ports
- PC with Realtek RTL8168H/8111H Gigabit Ethernet NIC (supports hardware TDR for all 8 wires)

## Important Notes
The Archer C50 v6 only has 100 Mbps ports which use only 4 wires (pins 1,2,3,6). To test all 8 wires of Cat5e/Cat6 Gigabit patch cords (including pins 4,5,7,8), the PC's Realtek RTL8168 Gigabit NIC hardware TDR is required.

## Setup
1. Ensure `.ROUTER` file exists in project root with IP, USER, PASSWORD
2. Run `npm run test-cable` or `node src/index.js`

## Features
- Router authentication via encrypted CGI (`/cgi_gdpr`)
- NIC statistics and link info
- Realtek RTL8168 hardware TDR/cable test (all 4 pairs)
- Framework for stress testing

## Files
- `.ROUTER` - Router credentials
- `PLAN.md` - Detailed plan and findings
- `src/` - Source code
- Realtek diagnostic DLLs in temp directory
