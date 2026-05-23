const fs = require('fs');
const path = require('path');

function findFiles(dir, files = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === 'node_modules') continue;
      findFiles(fullPath, files);
    } else if (item.isFile() && (item.name.endsWith('.vue') || item.name.endsWith('.css'))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = findFiles('packages/app/src/gui');
const patterns = [
  /\bcolor:\s*#fff\b(?!\))/g,
  /\bbackground:\s*#0a0a0a\b(?!\))/g,
  /\bbackground:\s*#111111\b(?!\))/g,
  /\bbackground:\s*#1a1a1a\b(?!\))/g,
  /\bbackground:\s*#000000\b(?!\))/g,
  /\bborder:\s*1px solid #1a1a1a\b(?!\))/g,
  /\bborder:\s*1px solid #2a2a2a\b(?!\))/g,
  /\bborder-color:\s*rgba\(255,\s*255,\s*255,\s*0\.(06|08|1|12)\)(?!\))/g,
  /\binset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.(03|05|06|08|1)\)(?!\))/g,
  /\bcolor:\s*rgba\(255,\s*255,\s*255,\s*0\.(08|15|18|2|22|25|3|35|4|45|5|55|6|65|7|75|8|9)\)(?!\))/g,
  /\bbackground:\s*rgba\(255,\s*255,\s*255,\s*0\.(04|06|08|1|12|15|02|03|05)\)(?!\))/g,
];

let total = 0;
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let m;
  let fileMatches = 0;
  while ((m = styleRegex.exec(content)) !== null) {
    const style = m[1];
    for (const pat of patterns) {
      const matches = style.match(pat);
      if (matches) fileMatches += matches.length;
    }
  }
  if (fileMatches > 0) {
    console.log(path.relative('.', file) + ': ' + fileMatches);
    total += fileMatches;
  }
}
console.log('Total remaining in <style> blocks: ' + total);

// Check for JS const patterns (canvas colors)
const jsPatterns = [
  /const\s+\w+\s*=\s*['"]rgba\(255,\s*255,\s*255,\s*[\d.]+\)['"]/g,
  /const\s+\w+\s*=\s*['"]rgba\(0,\s*0,\s*0,\s*[\d.]+\)['"]/g,
];
let jsTotal = 0;
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  let fileMatches = 0;
  while ((m = scriptRegex.exec(content)) !== null) {
    const script = m[1];
    for (const pat of jsPatterns) {
      const matches = script.match(pat);
      if (matches) fileMatches += matches.length;
    }
  }
  if (fileMatches > 0) {
    console.log('JS: ' + path.relative('.', file) + ': ' + fileMatches);
    jsTotal += fileMatches;
  }
}
console.log('Total JS canvas colors: ' + jsTotal);
