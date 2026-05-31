const fs = require('fs');
const content = fs.readFileSync('src/components/KompetensiDashboard.jsx', 'utf8');
const lines = content.split('\n');
let depth = 0;
for(let i=729; i<=1124; i++) {
  const line = lines[i];
  let inString = false;
  let o = 0, c = 0, selfClose = 0;
  for(let j=0; j<line.length; j++) {
    if(line[j] === '"' || line[j] === "'") inString = !inString;
    if(!inString) {
      if(line.substring(j, j+4) === '<div') {
         let k = j;
         while(k < line.length && line[k] !== '>') k++;
         if(line[k-1] === '/') selfClose++;
         else o++;
      }
      if(line.substring(j, j+6) === '</div>') c++;
    }
  }
  depth += (o - c);
  if(depth <= 0 && o===0 && c>0) {
    console.log('CLOSED ROOT AT LINE:', i, 'Depth:', depth);
  }
}
console.log('Final depth:', depth);
