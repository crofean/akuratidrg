const https = require('https');
https.get('https://docs.google.com/spreadsheets/d/1GG8xDtNii2N4V9yNlP_Na-fQtM4zN30ZkLD0aUnMY98/export?format=csv&gid=0', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const lines = data.split('\n');
        const headers = lines[0].split(',');
        console.log('Headers:', headers.join(', '));
        const recent = lines.slice(Math.max(lines.length - 15, 1));
        recent.forEach((l, i) => console.log(`Row ${lines.length - 15 + i}:`, l.split(',').slice(0, 7).join(' | ')));
    });
});
