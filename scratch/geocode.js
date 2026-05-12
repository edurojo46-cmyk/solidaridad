const fs = require('fs');
const https = require('https');

// Read target_zonas.txt
// It's UTF-16LE, let's read it properly
const text = fs.readFileSync('../target_zonas.txt', 'utf16le');

// Use eval to parse the JS array object.
let zonasData = [];
try {
    const code = text.replace('var zonasData = ', '').trim().replace(/;$/, '');
    zonasData = eval(code);
} catch (e) {
    console.error('Error parsing target_zonas.txt:', e);
    process.exit(1);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function geocode(address, city) {
    return new Promise((resolve) => {
        // Strip everything after comma for the street
        let cleanAddress = address.split(',')[0].trim();
        const query = encodeURIComponent(`${cleanAddress}, ${city}, Argentina`);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
        
        https.get(url, { headers: { 'User-Agent': 'SolidaridadApp/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result && result.length > 0) {
                        resolve({ lat: parseFloat(result[0].lat), lng: parseFloat(result[0].lon) });
                    } else {
                        resolve(null);
                    }
                } catch(e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

async function run() {
    console.log(`Loaded ${zonasData.length} zones.`);
    let success = 0;
    let total = 0;
    
    for (const zona of zonasData) {
        // Adapt to Comedores style
        zona.icon = 'ri-restaurant-fill';
        zona.color = '#e67e22';
        zona.grad = 'linear-gradient(135deg,#e67e22,#d35400)';
        
        let city = zona.nombre.includes('Buenos Aires') ? 'Buenos Aires' : 'Capital Federal';
        if (zona.nombre.includes('Córdoba')) city = 'Córdoba';
        
        for (const ig of zona.iglesias) {
            total++;
            process.stdout.write(`Geocoding: ${ig.n} - ${ig.d}... `);
            const geo = await geocode(ig.d, city);
            if (geo) {
                ig.lat = geo.lat;
                ig.lng = geo.lng;
                console.log(`OK (${geo.lat}, ${geo.lng})`);
                success++;
            } else {
                console.log('NOT FOUND');
                // provide fallback inside Argentina
                ig.lat = -34.6037 + (Math.random() * 0.1 - 0.05);
                ig.lng = -58.3816 + (Math.random() * 0.1 - 0.05);
            }
            await sleep(1500); // Respect Nominatim limits
        }
    }
    
    console.log(`\nGeocoded ${success}/${total} addresses.`);
    
    const output = `var zonasData = ${JSON.stringify(zonasData, null, 2)};\n`;
    fs.writeFileSync('../comedores_data.js', output, 'utf8');
    console.log('Saved to comedores_data.js');
}

run();
