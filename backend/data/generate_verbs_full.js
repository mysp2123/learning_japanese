const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const xlPath = path.join(__dirname, 'Động từ 日本語.xlsx');
const wb = XLSX.readFile(xlPath);

const MASU_COL = 'Thể 「ます」';
const VI_COL = 'Tiếng Việt';
const DICT_COL = 'Thể Từ Điển';

const groupMap = { 'Group 1': 1, 'Group 2': 2, 'Group 3': 3 };

let xlVerbs = [];
let idCounter = 1;

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  rows.forEach(r => {
    const masu = (r[MASU_COL] || '').trim();
    const vi = (r[VI_COL] || '').trim();
    const dict = (r[DICT_COL] || '').trim();
    if (!masu || !vi || masu.startsWith('Ｖ') || masu.startsWith('～')) return;
    xlVerbs.push({
      id: idCounter++,
      masu,
      meaning: vi,
      dictionary: dict,
      group: groupMap[sheetName],
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
      created_by: 'system',
    });
  });
});

const outPath = path.join(__dirname, 'verbs_full.json');
fs.writeFileSync(outPath, JSON.stringify(xlVerbs, null, 2), 'utf8');

const byGroup = {1:0, 2:0, 3:0};
xlVerbs.forEach(v => byGroup[v.group]++);

console.log(`Generated verbs_full.json with ${xlVerbs.length} verbs:`);
console.log(`  Group 1 (u-verbs):    ${byGroup[1]}`);
console.log(`  Group 2 (ru-verbs):   ${byGroup[2]}`);
console.log(`  Group 3 (irregular):  ${byGroup[3]}`);
console.log(`File saved to: ${outPath}`);
