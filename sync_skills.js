
const fs = require('fs');
const path = require('path');

// Mock content loading
const window = {};
global.window = window;

const GAME_DATA_PATH = path.resolve('/Users/mori/Desktop/メモ/fishing/data/gameData.js');
const CSV_PATH = path.resolve('/Users/mori/Desktop/メモ/fishing/game_data_csv/skills.csv');

// Load current gameData
const gameDataContent = fs.readFileSync(GAME_DATA_PATH, 'utf8');
// Use a safe way to extract SKILLS, or just eval it since we trust it (mostly)
try {
    eval(gameDataContent);
} catch (e) {
    console.error('Error loading gameData.js:', e);
    process.exit(1);
}

const OLD_SKILLS = window.GAME_DATA.SKILLS;
const SKILLS_MAP = new Map(OLD_SKILLS.map(s => [s.id, s]));

// Read CSV
const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
const lines = csvContent.split('\n').filter(l => l.trim().length > 0);
const headers = lines[0].split(',');

// Parse CSV lines
const NEW_SKILLS = [];

for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parser ignoring quotes for now as the user input seems not to have complex quotes
    // But to be safe, let's just split by comma if we assume simple values
    // actual user input has description with spaces, but no commas inside fields ideally.
    // User input: "power_up_1,パワーUP I,1,200,power_boost,5,釣りパワー+5"
    // Valid.
    const parts = line.split(',');

    // Mapping based on header: ID,名前,Tier,価格,効果タイプ,効果値,説明
    const id = parts[0];
    const name = parts[1];
    const tier = parseInt(parts[2]);
    const price = parseInt(parts[3]);
    const type = parts[4];
    const valueStr = parts[5];
    const description = parts.slice(6).join(','); // Join rest incase desc has commas

    const oldSkill = SKILLS_MAP.get(id);
    let effect = {};

    if (oldSkill) {
        // update existing
        effect = { ...oldSkill.effect }; // Copy existing structure
        // If type changed, reset effect? Unlikely.
        if (effect.type !== type) {
            effect.type = type; // Warning?
        }

        // Update value if present in CSV
        if (valueStr && valueStr.trim() !== '') {
            const val = parseFloat(valueStr);
            if (!isNaN(val)) {
                effect.value = val;
            }
        }
    } else {
        // New Skill
        effect = { type: type };
        if (valueStr && valueStr.trim() !== '') {
            const val = parseFloat(valueStr);
            if (!isNaN(val)) {
                effect.value = val;
            }
        }
    }

    NEW_SKILLS.push({
        id: id,
        name: name,
        description: description,
        effect: effect,
        price: price,
        tier: tier
    });
}

// Generate new gameData.js content
// We need to replace the SKILLS array in the file string.
// We'll look for `SKILLS: [` and the matching `];`
// But gameData.js might have comments etc.
// Safest is to replace the specific block.
// Let's assume standard formatting.

// Reconstruct the file content by finding the bounds of SKILLS array.
const startMarker = 'const SKILLS = [';
const startIndex = gameDataContent.indexOf(startMarker);

if (startIndex === -1) {
    console.error('Could not find SKILLS array start (checked for "const SKILLS = [")');
    process.exit(1);
}

let openBrackets = 1; // We passed the first [
let currentIndex = startIndex + startMarker.length;
let endIndex = -1;

for (let i = currentIndex; i < gameDataContent.length; i++) {
    const char = gameDataContent[i];
    if (char === '[') openBrackets++;
    if (char === ']') openBrackets--;
    if (openBrackets === 0) {
        endIndex = i + 1;
        break;
    }
}

if (endIndex === -1) {
    console.error('Could not find SKILLS array end');
    process.exit(1);
}

// Format the new skills array as string
// Helper to format object
function formatSkill(s) {
    // We want: { id: '...', name: '...', description: '...', effect: { ... }, price: ..., tier: ... },
    let effectParts = [];
    effectParts.push(`type: '${s.effect.type}'`);
    for (const k in s.effect) {
        if (k === 'type') continue;
        const v = s.effect[k];
        if (typeof v === 'string') effectParts.push(`${k}: '${v}'`);
        else effectParts.push(`${k}: ${v}`);
    }
    const effectString = `{ ${effectParts.join(', ')} }`;

    return `    { id: '${s.id}', name: '${s.name}', description: '${s.description}', effect: ${effectString}, price: ${s.price}, tier: ${s.tier} }`;
}

const newSkillsBlock = 'const SKILLS = [\n' + NEW_SKILLS.map(formatSkill).join(',\n') + '\n]';

const newFileContent = gameDataContent.substring(0, startIndex) + newSkillsBlock + gameDataContent.substring(endIndex);

fs.writeFileSync(GAME_DATA_PATH, newFileContent, 'utf8');
console.log(`Updated SKILLS in gameData.js. Total skills: ${NEW_SKILLS.length}`);
