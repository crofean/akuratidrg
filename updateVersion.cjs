const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '1.7.0';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

let app = fs.readFileSync('src/App.jsx', 'utf8');
app = app.replace(/1\.6\.0/g, '1.7.0');
fs.writeFileSync('src/App.jsx', app);
console.log('Version updated to 1.7.0');
