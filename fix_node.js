const fs = require('fs');
let text = fs.readFileSync('index.html', 'utf8');

// The file currently has both real UTF-8 characters and Mojibake.
// Also, my previous script turned Ã into Á.
// Let's first revert Á back to Ã everywhere except in real words that use Á.
// Wait, if "Á" was originally "Ã", then let's replace "Á" with "Ã".
// But we don't want to break "Ángel". However, "Á" in "Ángel" is probably correct.
// Since my bad script replaced "Ã" with "Á", "Ã" is literally missing.
text = text.replace(/Á/g, 'Ã');

// Now we have standard UTF-8 Mojibake in the file (like Ã³, Ã¡, etc).
// Let's replace the double-encoded ones first.
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
    'Ã\u00AD': 'í',
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

// Fix regex matched remaining cases for safety
text = text.replace(/SÃ.*?o Paulo/g, 'São Paulo');
text = text.replace(/GoiÃ.*?nia/g, 'Goiânia');
text = text.replace(/SÃ.*?o Lu.*?s/g, 'São Luís');
text = text.replace(/BelÃ.*?m/g, 'Belém');
text = text.replace(/MaceiÃ.*?/g, 'Maceió');
text = text.replace(/VitÃ.*?ria/g, 'Vitória');
text = text.replace(/FlorianÃ.*?polis/g, 'Florianópolis');
text = text.replace(/TucumÃ.*?n/g, 'Tucumán');

// Clean up any stray Ã that might be a stray í or á
// In Spanish, Ã followed by nothing usually was í or á depending on context, but let's just do known words
text = text.replace(/ubicaciÃn/g, 'ubicación');
text = text.replace(/comuniÃn/g, 'comunión');
text = text.replace(/direcciÃn/g, 'dirección');
text = text.replace(/oraciÃn/g, 'oración');
text = text.replace(/naciÃn/g, 'nación');

fs.writeFileSync('index.html', text, 'utf8');