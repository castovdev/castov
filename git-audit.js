const fs = require('fs');
const execSync = require('child_process').execSync;
const gitFiles = execSync('git ls-files').toString().split('\n').filter(Boolean);

let bad = [];
gitFiles.forEach(file => {
  try {
    const parts = file.split('/');
    let current = '.';
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const dirContents = fs.readdirSync(current);
      const exact = dirContents.find(d => d.toLowerCase() === p.toLowerCase());
      if (exact !== p) {
        bad.push(`Git says: ${file} | Disk says: ${current}/${exact}`);
        break;
      }
      current += '/' + exact;
    }
  } catch { /* best-effort audit: unreadable path is skipped */ }
});
console.log('Bad:', bad.length ? bad : 'None');
