
const fs = require('fs');
const path = require('path');

function checkFileExistsCase(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  if (!fs.existsSync(dir)) return false;
  const files = fs.readdirSync(dir);
  return files.includes(base);
}

function checkImports(dir) {
  let hasError = false;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      hasError = checkImports(fullPath) || hasError;
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const importRegex = /import\s+.*?\s+from\s+['\"'](.*?)['\"']/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.')) {
          let resolvedPath = path.resolve(dir, importPath);
          let found = false;
          
          if (checkFileExistsCase(resolvedPath)) {
            found = true;
          } else if (checkFileExistsCase(resolvedPath + '.js')) {
            found = true;
          } else if (checkFileExistsCase(resolvedPath + '.jsx')) {
            found = true;
          } else if (checkFileExistsCase(path.join(resolvedPath, 'index.js'))) {
            found = true;
          } else if (checkFileExistsCase(path.join(resolvedPath, 'index.jsx'))) {
            found = true;
          }
          
          if (!found) {
            console.error('Case sensitivity error in', fullPath, ':', importPath);
            hasError = true;
          }
        }
      }
    }
  }
  return hasError;
}

const error = checkImports('./src');
if (!error) console.log('All imports match case!');

