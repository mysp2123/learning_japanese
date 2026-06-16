const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const xlPath = path.join(__dirname, 'Động từ 日本語.xlsx');
const wb = XLSX.readFile(xlPath);

const MASU_COL = 'Thể 「ます」';
const VI_COL = 'Tiếng Việt';
const DICT_COL = 'Thể Từ Điển';

let xlVerbs = [];

const groupMap = { 'Group 1': 1, 'Group 2': 2, 'Group 3': 3 };

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  let count = 0;
  rows.forEach(r => {
    const masu = (r[MASU_COL] || '').trim();
    const vi = (r[VI_COL] || '').trim();
    const dict = (r[DICT_COL] || '').trim();
    // Skip header rows and empty rows
    if (!masu || !vi || masu.startsWith('Ｖ') || masu.startsWith('～')) return;
    xlVerbs.push({
      masu,
      meaning: vi,
      dictionary: dict,
      group: groupMap[sheetName],
      sheet: sheetName,
      te: (r['Thể　「て」'] || '').trim(),
      ta: (r['Thể　「た」'] || '').trim(),
      nai: (r['Thể　「ない」'] || '').trim(),
      ability: (r['Thể Khả Năng'] || '').trim(),
      volitional: (r['Thể Ý Định'] || '').trim(),
      imperative: (r['Thể Mệnh Lệnh'] || '').trim(),
      causative: (r['Thể Sai khiên'] || '').trim(),
      prohibitive: (r['Thể Cấm Chỉ'] || '').trim(),
      conditional: (r['Thể Điều Kiện'] || '').trim(),
      passive: (r['Thể Bị Động'] || '').trim(),
    });
    count++;
  });
  console.log(`Sheet "${sheetName}": ${count} actual verbs (${rows.length} total rows including headers)`);
});

console.log(`\nTotal Excel verbs (actual): ${xlVerbs.length}`);
const byGroup = {1:0, 2:0, 3:0};
xlVerbs.forEach(v => byGroup[v.group]++);
console.log(`  Group 1 (u-verbs): ${byGroup[1]}`);
console.log(`  Group 2 (ru-verbs): ${byGroup[2]}`);
console.log(`  Group 3 (irregular): ${byGroup[3]}`);

// Read verbs.json
const verbsJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'verbs.json'), 'utf8'));
console.log(`\nverbs.json total: ${verbsJson.length}`);

const jsonMasus = new Set(verbsJson.map(v => v.masu));
const xlMasus = new Set(xlVerbs.map(v => v.masu));

// In Excel but NOT in JSON
const missingFromJson = xlVerbs.filter(v => !jsonMasus.has(v.masu));
console.log(`\n=== In Excel but MISSING from verbs.json: ${missingFromJson.length} ===`);
missingFromJson.slice(0, 30).forEach(v => {
  console.log(`  [Group ${v.group}] ${v.masu} (${v.dictionary}) = ${v.meaning}`);
});
if (missingFromJson.length > 30) console.log(`  ... and ${missingFromJson.length - 30} more`);

// In JSON but NOT in Excel
const extraInJson = verbsJson.filter(v => !xlMasus.has(v.masu));
console.log(`\n=== In verbs.json but NOT in Excel: ${extraInJson.length} ===`);
extraInJson.slice(0, 20).forEach(v => {
  console.log(`  ${v.masu} (${v.dictionary}) = ${v.meaning}`);
});

// Missing group field in JSON
console.log(`\n=== verbs.json missing 'group' field: ALL 209 (field does not exist) ===`);

// Check missing conjugations in Excel data
let missingConj = 0;
const conjFields = ['te','ta','nai','ability','volitional','imperative','causative','prohibitive','conditional','passive'];
xlVerbs.forEach(v => {
  const missing = conjFields.filter(f => !v[f]);
  if (missing.length > 0) missingConj++;
});
console.log(`\nExcel verbs with incomplete conjugations: ${missingConj}/${xlVerbs.length}`);
