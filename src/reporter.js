const fs = require('fs');
const path = require('path');

function generateReport(testResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: testResults,
    human: '',
  };
  report.human = formatHuman(report);
  return report;
}

function formatHuman(report) {
  let out = `=== oh-my-cord Report ===\nTime: ${report.timestamp}\n`;
  out += JSON.stringify(report.summary, null, 2) + '\n';
  return out;
}

function saveReport(report, outputDir) {
  const dir = outputDir || path.join(process.cwd(), 'reports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `report-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  // also human readable
  fs.writeFileSync(file.replace('.json', '.txt'), report.human);
  return file;
}

function getReportHistory(dir) {
  const d = dir || path.join(process.cwd(), 'reports');
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f => f.endsWith('.json')).sort().reverse();
}

module.exports = { generateReport, saveReport, getReportHistory };

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  let output = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output') output = args[++i];
  }
  const sample = { note: 'sample report' };
  const r = generateReport(sample);
  const f = saveReport(r, output);
  console.log('Saved', f);
}