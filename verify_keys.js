const fs = require('fs');

const htmlContent = fs.readFileSync('index.html', 'utf8');
const jsContent = fs.readFileSync('script.js', 'utf8');

// Extract keys from HTML
const htmlKeys = [];
const regex = /data-i18n="([^"]+)"/g;
let match;
while ((match = regex.exec(htmlContent)) !== null) {
    htmlKeys.push(match[1]);
}
const uniqueHtmlKeys = [...new Set(htmlKeys)].sort();

console.log(`Found ${uniqueHtmlKeys.length} unique keys in HTML.`);

// Extract keys from JS
// This is a bit hacky but should work for the structure we have
// We look for the translations object
const languages = ['pt', 'en', 'fr', 'it', 'es'];
const missingKeys = {};

languages.forEach(lang => {
    missingKeys[lang] = [];
    // simplified regex to find keys inside the language block
    // We assume the structure is `lang: { ... }`
    // We can extract the block for each language
    const langBlockRegex = new RegExp(`${lang}:\\s*{([^}]+)}`, 's');
    const langMatch = jsContent.match(langBlockRegex);

    if (!langMatch) {
        console.error(`Could not find block for language ${lang}`);
        return;
    }

    const blockContent = langMatch[1];
    const definedKeys = [];
    const keyRegex = /([a-z0-9_]+):/g;
    let keyMatch;
    while ((keyMatch = keyRegex.exec(blockContent)) !== null) {
        definedKeys.push(keyMatch[1]);
    }

    uniqueHtmlKeys.forEach(key => {
        if (!definedKeys.includes(key)) {
            missingKeys[lang].push(key);
        }
    });
});

let foundMissing = false;
languages.forEach(lang => {
    if (missingKeys[lang].length > 0) {
        foundMissing = true;
        console.log(`Missing keys in ${lang.toUpperCase()}:`);
        missingKeys[lang].forEach(key => console.log(`  - ${key}`));
    } else {
        console.log(`${lang.toUpperCase()}: All keys present.`);
    }
});

if (!foundMissing) {
    console.log("SUCCESS: All keys in HTML are present in all language dictionaries.");
}
