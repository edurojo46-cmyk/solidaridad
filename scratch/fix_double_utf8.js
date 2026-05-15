// fix_double_utf8.js - Repara el doble encoding UTF-8 en index.html y app.js
const fs = require('fs');

// Mapa de secuencias doble-UTF8 -> caracter correcto
// Cada par corrompe un acento específico:
// í: C3 AD → doble UTF8: C3 83 C2 AD   (también Ã­)
// ó: C3 B3 → doble UTF8: C3 83 C2 B3   (también Ã³)
// á: C3 A1 → doble UTF8: C3 83 C2 A1   (también Ã¡)
// é: C3 A9 → doble UTF8: C3 83 C2 A9   (también Ã©)
// ú: C3 BA → doble UTF8: C3 83 C2 BA   (también Ãº)
// ñ: C3 B1 → doble UTF8: C3 83 C2 B1   (también Ã±)
// Ó: C3 93 → doble UTF8: C3 83 C2 93
// Á: C3 81 → doble UTF8: C3 83 C2 81
// É: C3 89 → doble UTF8: C3 83 C2 89
// ü: C3 BC → doble UTF8: C3 83 C2 BC

const doubleUtf8Map = [
  // [doble-encoded string (as latin1 bytes), correct char]
  ['\xC3\x83\xC2\xAD', 'í'],
  ['\xC3\x83\xC2\xB3', 'ó'],
  ['\xC3\x83\xC2\xA1', 'á'],
  ['\xC3\x83\xC2\xA9', 'é'],
  ['\xC3\x83\xC2\xBA', 'ú'],
  ['\xC3\x83\xC2\xB1', 'ñ'],
  ['\xC3\x83\xC2\x93', 'Ó'],
  ['\xC3\x83\xC2\x81', 'Á'],
  ['\xC3\x83\xC2\x89', 'É'],
  ['\xC3\x83\xC2\x9A', 'Ú'],
  ['\xC3\x83\xC2\x91', 'Ñ'],
  ['\xC3\x83\xC2\xBC', 'ü'],
  ['\xC3\x83\xC2\xBF', 'ÿ'],
  // Additional common double-encodings:
  ['\xC3\x83\xC2\xB6', 'ö'],
  ['\xC3\x83\xC2\xA0', 'à'],
  ['\xC3\x83\xC2\xA8', 'è'],
  ['\xC3\x83\xC2\xAC', 'ì'],
  ['\xC3\x83\xC2\xB9', 'ù'],
  // Also check for Ã alone patterns (single level corruption)
  ['\xC3\xAD', 'í'],
  ['\xC3\xB3', 'ó'],
  ['\xC3\xA1', 'á'],
  ['\xC3\xA9', 'é'],
  ['\xC3\xBA', 'ú'],
  ['\xC3\xB1', 'ñ'],
];

function fixFile(filePath) {
  console.log(`\nProcessing: ${filePath}`);
  
  // Read as raw bytes (latin-1 to preserve byte values)
  let content = fs.readFileSync(filePath, 'latin1');
  let totalFixes = 0;
  
  for (const [badSeq, goodChar] of doubleUtf8Map) {
    let count = 0;
    let newContent = '';
    let i = 0;
    while (i < content.length) {
      if (content.startsWith(badSeq, i)) {
        newContent += goodChar;
        i += badSeq.length;
        count++;
      } else {
        newContent += content[i];
        i++;
      }
    }
    if (count > 0) {
      console.log(`  Fixed [${Buffer.from(badSeq, 'latin1').toString('hex')}] -> '${goodChar}' (${count}x)`);
      totalFixes += count;
    }
    content = newContent;
  }
  
  console.log(`  Total fixes: ${totalFixes}`);
  
  // Write back as UTF-8
  // Since we replaced the double-encoded bytes with the correct unicode chars,
  // writing as UTF-8 will produce correct encoding
  const buf = Buffer.from(content, 'latin1');
  
  // Verify: re-read and check
  const verification = buf.toString('utf8');
  const remaining = (verification.match(/\uFFFD/g) || []).length;
  console.log(`  Replacement chars remaining: ${remaining}`);
  
  // Backup
  fs.copyFileSync(filePath, filePath + '.bkp.fix_encoding');
  fs.writeFileSync(filePath, buf);
  console.log(`  ✅ Written (backup at ${filePath}.bkp.fix_encoding)`);
  
  return totalFixes;
}

// Also do targeted text replacements for any remaining issues
function fixTextPatterns(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let fixes = 0;
  
  const textFixes = [
    // Chat screen specific fixes visible in the code output
    ['No le\uFFFDdos', 'No leídos'],
    ['Conversaci\uFFFDn', 'Conversación'],
    ['en l\uFFFDnea', 'en línea'],
    ['Mar\uFFFDa', 'María'],
    ['M\uFFFDs', 'Más'],
    // Common patterns
    ['situaci\uFFFDn', 'situación'],
    ['Situaci\uFFFDn', 'Situación'],
    ['acci\uFFFDn', 'acción'],
    ['notificaci\uFFFDn', 'notificación'],
    ['Notificaci\uFFFDn', 'Notificación'],
    ['configuraci\uFFFDn', 'configuración'],
    ['Configuraci\uFFFDn', 'Configuración'],
  ];
  
  for (const [bad, good] of textFixes) {
    while (content.includes(bad)) {
      content = content.replace(bad, good);
      fixes++;
    }
  }
  
  if (fixes > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Text pattern fixes: ${fixes}`);
  }
  
  return fixes;
}

const files = [
  'c:\\Users\\Eduardo\\Desktop\\solidaridad\\index.html',
  'c:\\Users\\Eduardo\\Desktop\\solidaridad\\app.js',
];

for (const f of files) {
  try {
    const bytesFixes = fixFile(f);
    const textFixes = fixTextPatterns(f);
    console.log(`  Grand total for ${f.split('\\').pop()}: ${bytesFixes + textFixes} fixes`);
  } catch (e) {
    console.error(`Error processing ${f}:`, e.message);
  }
}

console.log('\n✅ Done! Check the files now.');
