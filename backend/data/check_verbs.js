const fs = require('fs');
const path = require('path');

// Read verbs.json
const verbsPath = path.join(__dirname, 'verbs.json');
const verbs = JSON.parse(fs.readFileSync(verbsPath, 'utf8'));

console.log(`\n=== verbs.json Summary ===`);
console.log(`Total verbs: ${verbs.length}`);

// Check fields
const fields = Object.keys(verbs[0] || {});
console.log(`Fields: ${fields.join(', ')}`);
console.log(`Has 'group' field: ${fields.includes('group')}`);

// Group breakdown  
const groups = {};
verbs.forEach(v => {
  const g = v.group !== undefined && v.group !== null && v.group !== '' ? String(v.group) : '(none)';
  groups[g] = (groups[g] || 0) + 1;
});
console.log('\nGroup breakdown:');
Object.keys(groups).sort().forEach(g => console.log(`  Group "${g}": ${groups[g]} verbs`));

// Check completeness: all forms present?
let missingAny = 0;
const formFields = ['masu','dictionary','te','ta','nai','ability','volitional','imperative','causative','prohibitive','conditional','passive'];
verbs.forEach(v => {
  const missing = formFields.filter(f => !v[f] || v[f].trim() === '');
  if (missing.length > 0) missingAny++;
});
console.log(`\nVerbs missing at least 1 conjugation form: ${missingAny}/${verbs.length}`);

// Sample first 5
console.log('\nFirst 5 verbs:');
verbs.slice(0, 5).forEach((v, i) => {
  console.log(`  [${i}] masu="${v.masu}" dict="${v.dictionary}" meaning="${v.meaning}" group="${v.group || 'N/A'}"`);
});

// Last 5
console.log('\nLast 5 verbs:');
verbs.slice(-5).forEach((v, i) => {
  console.log(`  [${verbs.length - 5 + i}] masu="${v.masu}" dict="${v.dictionary}" meaning="${v.meaning}" group="${v.group || 'N/A'}"`);
});
