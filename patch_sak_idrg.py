import json
import re

with open('audit_rules.json', 'r', encoding='utf-8') as f:
    rules = f.read()

with open('SAK-iDRG.js', 'r', encoding='utf-8') as f:
    js_code = f.read()

# Replace DEFAULT_AUDIT_RULES
pattern_rules = re.compile(r'const DEFAULT_AUDIT_RULES = \[.*?\];', re.DOTALL)
new_rules_str = 'const DEFAULT_AUDIT_RULES = ' + rules + ';'
js_code = pattern_rules.sub(new_rules_str, js_code)

# Replace evaluation logic
pattern_logic = re.compile(r'const acRow = \[\.\.\.dList, \.\.\.pList\]; let hit = false;\s+DEFAULT_AUDIT_RULES\.forEach\(ru => \{.*?\n      \}\);', re.DOTALL)

new_logic = """const acRow = [...dList, ...pList]; let hit = false;
      const ptdVal = String(r['PTD'] || '').trim();
      const umurHari = Number(r['UMUR_HARI']) || 9999;
      const los = Number(r['LOS']) || 9999;
      
      DEFAULT_AUDIT_RULES.forEach(ru => {
        const op = ru.condition?.operator || "OR"; let matched = false;
        const type = ru.condition?.type;
        
        if (type === 'grouped') {
          matched = op === 'AND' 
            ? ru.condition.groups.every(g => g.codes.some(c => acRow.some(ac => ac.startsWith(c)))) 
            : ru.condition.groups.some(g => g.codes.some(c => acRow.some(ac => ac.startsWith(c))));
        } else if (type === 'custom_missing') {
          const reqs = ru.condition.requires || [];
          const missings = ru.condition.missing || [];
          const excludes = ru.condition.excludes || [];
          const hasReq = reqs.some(c => acRow.some(ac => ac.startsWith(c)));
          const hasMissing = missings.some(c => acRow.some(ac => ac.startsWith(c)));
          const hasExclude = excludes.some(c => acRow.some(ac => ac.startsWith(c)));
          if (hasReq && !hasMissing) {
             if (ptdVal === '1') matched = true;
             else if (!hasExclude) matched = true;
          }
        } else if (type === 'custom_age') {
          const reqs = ru.condition.requires || [];
          const maxAge = ru.condition.max_age_days || 999;
          const hasReq = reqs.some(c => acRow.some(ac => ac.startsWith(c)));
          if (hasReq && umurHari <= maxAge) matched = true;
        } else if (type === 'custom_los') {
          const reqs = ru.condition.requires || [];
          const maxLos = ru.condition.max_los_days || 999;
          const hasReq = reqs.some(c => acRow.some(ac => ac.startsWith(c)));
          if (hasReq && los <= maxLos) matched = true;
        } else if (ru.condition?.codes) {
          matched = ru.condition.codes.some(c => acRow.some(ac => ac.startsWith(c)));
        }

        if (matched && type !== 'custom_missing') {
          const rulePtd = String(ru.PTD || '').trim();
          if (rulePtd === '1' && ptdVal !== '1' && ptdVal !== '') matched = false;
          else if (rulePtd === '2' && ptdVal !== '2' && ptdVal !== '') matched = false;
        }

        if (matched) {
          maps.audit.push({ ruleId: String(ru.id || 'N/A'), case: String(ru.case || 'Spesifik'), warning: String(ru.validation_action?.warning_message || ""), mrn: String(r['MRN'] || '-'), sep: String(r['SEP'] || '-'), codes: acRow.join(', '), coderId: cId });
          hit = true;
        }
      });"""

js_code = pattern_logic.sub(new_logic, js_code)

with open('SAK-iDRG.js', 'w', encoding='utf-8') as f:
    f.write(js_code)
print('Patch successful')
