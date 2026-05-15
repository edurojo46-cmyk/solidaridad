
const fs = require('fs');
const file = 'c:\\Users\\Eduardo\\Desktop\\solidaridad\\index.html';
let content = fs.readFileSync(file, 'utf8');

const fixes = [
    // Double UTF-8 encoded characters (ÃƒÂx pattern)
    ['\u00c3\u0192\u00c2\u00a1', '\u00e1'],  // á
    ['\u00c3\u0192\u00c2\u00a9', '\u00e9'],  // é
    ['\u00c3\u0192\u00c2\u00ad', '\u00ed'],  // í
    ['\u00c3\u0192\u00c2\u00b3', '\u00f3'],  // ó
    ['\u00c3\u0192\u00c2\u00ba', '\u00fa'],  // ú
    ['\u00c3\u0192\u00c2\u00b1', '\u00f1'],  // ñ
    ['\u00c3\u0192\u00c2\u00bc', '\u00fc'],  // ü
    // Single Â prefix leftover
    ['\u00c3\u0192\u00c2', ''],              // cleanup stray prefix
    // question mark
    ['\u00c3\u201a\u00c2\u00bf', '\u00bf'],  // ¿
    ['\u00c2\u00bf', '\u00bf'],              // ¿
    // Capital accented
    ['\u00c3\u0192\u00c2\u001a', '\u00da'],  // Ú
];

let count = 0;
for (const [bad, good] of fixes) {
    const before = content.split(bad).length - 1;
    if (before > 0) {
        content = content.split(bad).join(good);
        console.log(`Fixed '${encodeURIComponent(bad)}' -> '${good}' (${before} times)`);
        count += before;
    }
}

fs.writeFileSync(file, content, 'utf8');
console.log(`\nDONE. Total fixes: ${count}. File saved.`);
