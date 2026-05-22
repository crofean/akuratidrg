const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');
code = code.replace(
  'const [pendingUsers, setPendingUsers] = useState([]);',
  'const [userSearchTerm, setUserSearchTerm] = useState("");\n  const [pendingUsers, setPendingUsers] = useState([]);'
);
fs.writeFileSync('src/App.jsx', code);
console.log('Added userSearchTerm');
