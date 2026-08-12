const fs = require('fs');
const path = require('path');

const directory = '.';
const ignoreDirs = ['node_modules', '.git', 'supabase_bin', 'supabase_bin4', 'supabase_cli', '.github'];

function replaceInFile(filePath) {
    if (filePath.endsWith('.zip') || filePath.endsWith('.pdf') || filePath.endsWith('.jpg') || filePath.endsWith('.ttf') || filePath.endsWith('.exe')) return;
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content
            .replace(/8602881468:AAF04TGYwH18uuKPlGhC3qtAnmFBfHrZh_4/g, '8906068445:AAGc5L08H9a1Lc0oYIDL9o4ZqjJbLVMII4Y')
            .replace(/pgnxsgysnvrgsbuecesc/g, 'yrelqbvkxwdkzaraydfz')
            .replace(/sb_publishable_i1qSlBg5OBbnLpSHuDN4UA_bH6bWAVQ/g, 'sb_publishable_ZIfc-LO2UBt8CPVdY-WUgQ_U_WGF8T3')
            .replace(/Dl1gdEE4ekuJK1EO/g, '[YOUR-PASSWORD]');
        
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated', filePath);
        }
    } catch (e) {
        // skip
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!ignoreDirs.includes(file)) walk(fullPath);
        } else {
            replaceInFile(fullPath);
        }
    }
}
walk(directory);
