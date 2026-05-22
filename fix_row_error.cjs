const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Remove the mistakenly injected variable declaration that caused 'row is not defined'
code = code.replace("const drilldownDpjp = String(row.DPJP || '-').trim();", "");

// Replace the usage of the variable in the drilldown table with the direct expression
code = code.replace("{drilldownDpjp}", "{String(row.DPJP || '-').trim()}");

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed row is not defined error');
