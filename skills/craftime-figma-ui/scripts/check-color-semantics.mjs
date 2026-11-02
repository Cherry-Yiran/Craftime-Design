import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const defaults = JSON.parse(await readFile(new URL('../references/color-semantics.json', import.meta.url), 'utf8'));

export function checkColorSemantics(records, rules = defaults) {
  if (!Array.isArray(records)) throw new TypeError('Expected an array of node readback records');
  const issues = [];
  const pending = [];
  for (const record of records) {
    if (!record || typeof record !== 'object') {
      pending.push({ id: null, reason: 'Missing node record' });
      continue;
    }
    const rule = Object.hasOwn(rules.roles, record.role) ? rules.roles[record.role] : null;
    if (!record.id || !rule) {
      pending.push({ id: record.id ?? null, reason: 'Missing node ID or confirmed role' });
      continue;
    }
    const missing = [];
    const problems = [];
    if (typeof record.hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(record.hex)) missing.push('hex');
    else if (record.hex.toUpperCase() !== rule.hex) problems.push({ property: 'hex', actual: record.hex, expected: rule.hex });
    for (const key of ['nodeOpacity', 'paintOpacity', 'thickness']) {
      if (!(key in rule)) continue;
      if (!Number.isFinite(record[key])) missing.push(key);
      else if (Math.abs(record[key] - rule[key]) > 0.001) problems.push({ property: key, actual: record[key], expected: rule[key] });
    }
    // An explicit empty list distinguishes a confirmed unbound source Paint
    // from a missing binding readback. Other semantic roles still require bindings.
    if (!Array.isArray(record.variableNames)) missing.push('variableNames');
    else if (record.variableNames.length === 0) {
      if (rule.allowUnbound !== true) missing.push('variableNames');
    } else if (!rule.variableNames.some(name => record.variableNames.includes(name))) {
      problems.push({ property: 'variableNames', actual: record.variableNames, expected: rule.variableNames });
    }
    if (missing.length) pending.push({ id: record.id, missing });
    if (problems.length) issues.push({ id: record.id, role: record.role, problems });
  }
  const status = issues.length ? '有偏差' : pending.length || !records.length ? '待验证' : '通过';
  return { status, checkedRecords: records.length, issues, pending, scope: 'provided records only; ancestor effects and screenshot require separate verification' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2]) {
    process.stderr.write('Usage: node check-color-semantics.mjs /absolute/path/to/readback.json\n');
    process.exitCode = 2;
  } else {
    const result = checkColorSemantics(JSON.parse(await readFile(process.argv[2], 'utf8')));
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exitCode = result.status === '通过' ? 0 : 1;
  }
}



