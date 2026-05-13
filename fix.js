const fs = require('fs');
let text = fs.readFileSync('index.html', 'utf8');

// Reverse the bad `Ã` to `Á` replacement
text = text.replace(/Á/g, 'Ã');

// Now we have standard mojibake like ÃƒÂ³
const map = {
    'ÃƒÂ¡': 'á',
    'ÃƒÂ©': 'é',
    'ÃƒÂ­': 'í',
    'ÃƒÂ³': 'ó',
    'ÃƒÂº': 'ú',
    'ÃƒÂ±': 'ñ',
    'ÃƒÂ¼': 'ü',
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã±': 'ñ',
    'Ã¼': 'ü',
    'Ã\u0081': 'Á',
    'Ã\u0089': 'É',
    'Ã\u008D': 'Í',
    'Ã\u0093': 'Ó',
    'Ã\u009A': 'Ú',
    'Ã\u0091': 'Ñ'
};

for (const [bad, good] of Object.entries(map)) {
    text = text.split(bad).join(good);
}

// Just in case we made an accidental Ã replace for a real Á
// Let's fix common uppercase ones if they are still broken
text = text.replace(/UbicaciÃ³n/g, 'Ubicación');

fs.writeFileSync('index.html', text, 'utf8');
console.log('Fixed encoding with Node');