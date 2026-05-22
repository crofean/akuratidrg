const fs = require('fs');
const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');

let useEffectLines = [];
let capture = false;
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('useEffect(() => {') && lines[i+1] && lines[i+1].includes('if (subTab === "user_management" && (username.toLowerCase() === \'admin\'')) {
    capture = true;
    startIdx = i;
  }
  if (capture) {
    useEffectLines.push(lines[i]);
    if (lines[i].includes('}, [subTab, username]);')) {
      endIdx = i;
      capture = false;
    }
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  // Remove the useEffect from its current position
  lines.splice(startIdx, endIdx - startIdx + 1);
  
  // Find the last useState
  let insertIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('const [regState, setRegState] = useState')) {
      insertIdx = i + 1;
      break;
    }
  }
  
  if (insertIdx !== -1) {
    lines.splice(insertIdx, 0, '', ...useEffectLines, '');
    fs.writeFileSync('src/App.jsx', lines.join('\n'));
    console.log('Fixed useEffect TDZ issue successfully!');
  } else {
    console.log('Could not find insert index');
  }
} else {
  console.log('Could not find the useEffect block');
}
