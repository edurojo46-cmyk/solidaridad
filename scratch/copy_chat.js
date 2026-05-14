const fs = require('fs');

const srcDir = 'C:/Users/Eduardo/Desktop/solidaridad-nuevo';
const destDir = 'C:/Users/Eduardo/Desktop/solidaridad';

function getFileUTF8(filePath) {
    try {
        const bytes = fs.readFileSync(filePath);
        if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
            return Buffer.from(bytes.buffer, bytes.byteOffset + 2, bytes.length - 2).toString('utf16le');
        }
        return bytes.toString('utf8');
    } catch(e) { return null; }
}

function saveFileUTF8(filePath, content) {
    fs.writeFileSync(filePath, Buffer.from(content, 'utf8'));
}

// 1. Copy App JS Logic
let appSrc = getFileUTF8(`${srcDir}/app.js`);
let appDest = getFileUTF8(`${destDir}/app.js`);

if (appSrc && appDest && !appDest.includes('CHAT JS LOGIC')) {
    const chatIndex = appSrc.indexOf('// ==================== CHAT JS LOGIC ====================');
    if (chatIndex > -1) {
        const chatLogic = appSrc.substring(chatIndex);
        appDest = appDest + '\n\n' + chatLogic;
        saveFileUTF8(`${destDir}/app.js`, appDest);
        console.log('App JS chat logic copied.');
    }
}

// 2. Copy CSS Logic
let cssSrc = getFileUTF8(`${srcDir}/index.css`);
let cssDest = getFileUTF8(`${destDir}/index.css`);

if (cssSrc && cssDest && !cssDest.includes('CHAT (WhatsApp Style)')) {
    const chatIndex = cssSrc.indexOf('/* ==================== CHAT (WhatsApp Style) ==================== */');
    if (chatIndex > -1) {
        const chatCss = cssSrc.substring(chatIndex);
        cssDest = cssDest + '\n\n' + chatCss;
        saveFileUTF8(`${destDir}/index.css`, cssDest);
        console.log('CSS chat logic copied.');
    }
}

// 3. Copy Supabase JS Logic
let supaSrc = getFileUTF8(`${srcDir}/supabase.js`);
let supaDest = getFileUTF8(`${destDir}/supabase.js`);

if (supaSrc && supaDest && !supaDest.includes('searchUsersGlobal')) {
    // Extract everything after function searchUsersGlobal
    const chatIndex = supaSrc.indexOf('// Buscador Global de Usuarios');
    if (chatIndex > -1) {
        const chatSupa = supaSrc.substring(chatIndex);
        supaDest = supaDest.replace('window.db = {', 'window.db = {\n    // Chat methods exported\n');
        
        // Let's just append the raw functions directly.
        // Actually, in supabase.js, the functions need to be attached to window.db if they are exported.
        // I will just overwrite supabase.js since it's a small file and they are identical except for the chat methods.
        saveFileUTF8(`${destDir}/supabase.js`, supaSrc);
        console.log('Supabase JS copied.');
    } else {
        // Overwrite entirely if it matches
        saveFileUTF8(`${destDir}/supabase.js`, supaSrc);
        console.log('Supabase JS overwritten entirely.');
    }
}

// 4. HTML Navigation and Screen
let htmlSrc = getFileUTF8(`${srcDir}/index.html`);
let htmlDest = getFileUTF8(`${destDir}/index.html`);

if (htmlSrc && htmlDest) {
    let changed = false;
    
    // Copy Screen
    const screenMatch = htmlSrc.match(/<section id="screen-chat"[\s\S]*?<\/section>/);
    if (screenMatch && !htmlDest.includes('id="screen-chat"')) {
        const insertPos = htmlDest.indexOf('<section id="screen-profile"');
        if (insertPos > -1) {
            htmlDest = htmlDest.substring(0, insertPos) + screenMatch[0] + '\n\n' + htmlDest.substring(insertPos);
            changed = true;
            console.log('Screen Chat copied.');
        }
    }
    
    // Copy Nav Item
    const navMatch = htmlSrc.match(/<a href="#" class="nav-item"\s*onclick="app\.navigate\('screen-chat'\)[\s\S]*?<\/a>/);
    if (navMatch && !htmlDest.includes('id="nav-chat-item"')) {
        const navPos = htmlDest.indexOf('<a href="#" class="nav-item" onclick="app.navigate(\'screen-profile\')">');
        if (navPos > -1) {
            htmlDest = htmlDest.substring(0, navPos) + navMatch[0] + '\n            ' + htmlDest.substring(navPos);
            changed = true;
            console.log('Nav item copied.');
        }
    }

    if (changed) {
        // Write it using UTF16 if the original was UTF16 (wait, saveFileUTF8 writes UTF8, which is safer!)
        // But if PowerShell expects UTF16, it might break? No, modern PowerShell handles UTF8 fine.
        // We will just write UTF8.
        saveFileUTF8(`${destDir}/index.html`, htmlDest);
    }
}
