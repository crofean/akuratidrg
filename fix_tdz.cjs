const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');
let lines = code.split('\n');

let statesToMove = [
  "  const [pendingDurations, setPendingDurations] = useState({});",
  "  const [showPasswordList, setShowPasswordList] = useState({});"
];

// Remove them from their current position
lines = lines.filter(line => !statesToMove.includes(line));

// Find the first useState in App
let insertIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const [isLoggedIn, setIsLoggedIn] = useState(')) {
    insertIdx = i + 1;
    break;
  }
}

if (insertIdx !== -1) {
  lines.splice(insertIdx, 0, ...statesToMove);
  fs.writeFileSync('src/App.jsx', lines.join('\n'));
  console.log('Fixed TDZ issue in App.jsx');
} else {
  console.log('Could not find insert index');
}
