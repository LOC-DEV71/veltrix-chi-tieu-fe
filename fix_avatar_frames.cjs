const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      filelist = walkSync(fullPath, filelist);
    }
    else {
      if (fullPath.endsWith('.jsx')) filelist.push(fullPath);
    }
  });
  return filelist;
};

const files = walkSync(srcDir);
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Regex to match src={`/${anyVar.avatarFrame}`}
  // We capture everything inside ${...}
  const regex = /src=\{`\/\$\{(.*?avatarFrame.*?)\}`\}/g;
  
  if (regex.test(content)) {
    const newContent = content.replace(regex, 'src={$1}');
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
    console.log('Fixed', file);
  }
});

console.log('Total files fixed:', changedCount);
