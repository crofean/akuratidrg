import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target_regex = r"(if\s*\(ru\.condition\?\.type\s*===\s*'grouped'\)\s*\{.*?\s*\})\s*else\s*if\s*\(ru\.condition\?\.codes\)\s*matched\s*=\s*ru\.condition\.codes\.some"

match = re.search(target_regex, text, re.DOTALL)
if match:
    new_logic = match.group(1) + '''
        else if (ru.condition?.type === 'custom_missing') {
          const ptd = String(r['PTD'] || '').trim();
          const reqs = ru.condition.requires || [];
          const missings = ru.condition.missing || [];
          const excludes = ru.condition.excludes || [];
          const hasReq = reqs.some(c => acRow.some(ac => ac.startsWith(c)));
          const hasMissing = missings.some(c => acRow.some(ac => ac.startsWith(c)));
          const hasExclude = excludes.some(c => acRow.some(ac => ac.startsWith(c)));
          if (hasReq && !hasMissing) {
            if (ptd === '1') matched = true; // Ranap: always flag if no CT Scan (ignore Z08/Z09)
            else if (!hasExclude) matched = true; // Rajal/Others: flag only if no Z08/Z09
          }
        }
        else if (ru.condition?.codes) matched = ru.condition.codes.some'''
    text = text[:match.start()] + new_logic + text[match.end():]
    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Patched successfully!')
else:
    print('Failed to patch, could not find target.')
