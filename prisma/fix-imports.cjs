const fs = require('fs');
const path = require('path');

function addJsExt(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fp = path.join(dir, file);
    if (fs.statSync(fp).isDirectory()) {
      addJsExt(fp);
    } else if (fp.endsWith('.ts')) {
      let content = fs.readFileSync(fp, 'utf8');
      content = content.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, p1) => {
        if (!p1.endsWith('.js') && !p1.endsWith('.ts')) {
          return `from '${p1}.js'`;
        }
        return match;
      });
      fs.writeFileSync(fp, content);
    }
  }
}
addJsExt('./src');
console.log('Added .js to imports');
