const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class RealtekTDR {
  constructor() {
    this.selectedAdapter = null;
    const root = process.cwd();
    const vendorDir = path.join(root, 'vendor', 'realtek');
    const tempDir = path.join(process.env.LOCALAPPDATA || 'C:\\Users\\kukus\\AppData\\Local', 'Temp', 'opencode', 'rtk_diag', 'Diagnostic_v2.0.8.3_1_0507', 'EXE', '64');

    if (fs.existsSync(path.join(vendorDir, 'RTDiagLibV2.dll')) && fs.existsSync(path.join(vendorDir, 'RtlDirectDiagLib64.dll'))) {
      this.dllDir = vendorDir;
    } else if (fs.existsSync(path.join(tempDir, 'RTDiagLibV2.dll')) && fs.existsSync(path.join(tempDir, 'RtlDirectDiagLib64.dll'))) {
      this.dllDir = tempDir;
    } else {
      this.dllDir = vendorDir;
    }
    this.hasDLLs = fs.existsSync(path.join(this.dllDir, 'RTDiagLibV2.dll')) && fs.existsSync(path.join(this.dllDir, 'RtlDirectDiagLib64.dll'));
  }

  setAdapter(name) {
    this.selectedAdapter = name;
  }

  async testCable() {
    if (!this.hasDLLs) {
      return { error: 'Realtek diagnostic DLLs not found' };
    }

    try {
      const scriptPath = path.join(process.cwd(), 'src', 'rtk_cable_real.py');
      const result = execSync(`powershell -ExecutionPolicy Bypass -Command "Set-Location '${this.dllDir}'; & 'C:\\\\Program Files\\\\Python310\\\\python.exe' '${scriptPath}'"`, { encoding: 'utf8' });
      return JSON.parse(result.trim());
    } catch (e) {
      return { error: e.message };
    }
  }
}

module.exports = RealtekTDR;
