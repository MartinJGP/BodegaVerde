const fs = require('fs');
const path = require('path');

function fix(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fp = path.join(dir, file);
    if (fs.statSync(fp).isDirectory()) {
      fix(fp);
    } else if (fp.endsWith('.ts')) {
      const content = fs.readFileSync(fp, 'utf8');
      fs.writeFileSync(fp, content.replace(/\\n/g, '\n'));
    }
  }
}
fix('./src');
console.log('Fixed newlines');
