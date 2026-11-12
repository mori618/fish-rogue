
const fs = require('fs');
const path = require('path');

// Mock Browser Environment to load gameData.js
const window = {};
global.window = window;

// Load Game Data
const gameDataPath = path.resolve('../fishing/data/gameData.js'); // Assuming running from a sibling or root, adjusting path below
// Actually better to use absolute path provided in context
const ABS_GAME_DATA_PATH = '/Users/mori/Desktop/メモ/fishing/data/gameData.js';

try {
    const gameDataContent = fs.readFileSync(ABS_GAME_DATA_PATH, 'utf8');
    eval(gameDataContent);
} catch (e) {
    console.error('Failed to load gameData.js:', e);
    process.exit(1);
}

const DATA = window.GAME_DATA;
const OUTPUT_DIR = '/Users/mori/Desktop/メモ/fishing/game_data_csv';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// Helper to write CSV
function writeCSV(filename, headers, rows) {
    const headerLine = headers.join(',') + '\n';
    const body = rows.map(row => {
        return row.map(cell => {
            let str = String(cell === undefined || cell === null ? '' : cell);
            // Escape quotes and wrap in quotes if contains comma or newline
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                str = `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',');
    }).join('\n');

    fs.writeFileSync(path.join(OUTPUT_DIR, filename), '\ufeff' + headerLine + body, 'utf8'); // BOM for Excel
    console.log(`Generated ${filename}`);
}

// 1. Rods (釣り竿)
const rodHeaders = ['ID', '名前', 'ランク', '基本パワー', '価格', '説明', 'アンロック条件'];
const rodRows = DATA.RODS.map(item => [
    item.id,
    item.name,
    item.rank,
    item.basePower,
    item.price,
    item.description,
    item.unlockCondition ? `Rank ${item.unlockCondition.rank}` : '初期'
]);
writeCSV('rods.csv', rodHeaders, rodRows);

// 2. Fish (魚)
const fishHeaders = ['ID', '名前', 'パワー', '価値(G)', 'レア度', '説明'];
const fishRows = DATA.FISH.map(item => [
    item.id,
    item.name,
    item.power,
    item.value,
    item.rarity,
    item.description
]);
writeCSV('fish.csv', fishHeaders, fishRows);

// 3. Skills (スキル)
const skillHeaders = ['ID', '名前', 'Tier', '価格', '効果タイプ', '効果値', '説明'];
const skillRows = DATA.SKILLS.map(item => [
    item.id,
    item.name,
    item.tier,
    item.price,
    item.effect.type,
    item.effect.value,
    item.description
]);
writeCSV('skills.csv', skillHeaders, skillRows);

// 4. Baits (餌)
const baitHeaders = ['ID', '名前', 'ランク', '価格', 'セット数', '説明'];
const baitRows = DATA.BAITS.map(item => [
    item.id,
    item.name,
    item.rank,
    item.price,
    item.quantity,
    item.description
]);
writeCSV('baits.csv', baitHeaders, baitRows);

// 5. Skins (スキン)
const skinHeaders = ['ID', '名前', 'Tier', '対応ロッドID', '説明', 'ガチャ限定'];
const skinRows = DATA.SKINS.map(item => [
    item.id,
    item.name,
    item.tier,
    item.rodId || '-',
    item.description,
    item.isGachaExclusive ? '〇' : '-'
]);
writeCSV('skins.csv', skinHeaders, skinRows);

// 6. Skies (空・背景)
const skyHeaders = ['ID', '名前', 'Tier', '価格', '説明', 'ガチャ限定'];
const skyRows = DATA.SKIES.map(item => [
    item.id,
    item.name,
    item.tier || 1,
    item.price,
    item.description,
    item.isGachaExclusive ? '〇' : '-'
]);
writeCSV('skies.csv', skyHeaders, skyRows);

// 7. Ships (漁船)
const shipHeaders = ['ID', '名前', '価格', '容量', '獲得量範囲', '最大レア度', '燃料消費/分', '説明'];
const shipRows = DATA.SHIPS.map(item => [
    item.id,
    item.name,
    item.price,
    item.capacity,
    `${item.catchAmountRange[0]}~${item.catchAmountRange[1]}`,
    item.maxRarity,
    item.fuelConsumption,
    item.description
]);
writeCSV('ships.csv', shipHeaders, shipRows);

// 8. Fuels (燃料)
const fuelHeaders = ['ID', '名前', '価格', '回復量(分)'];
const fuelRows = DATA.FUELS.map(item => [
    item.id,
    item.name,
    item.price,
    item.recovery
]);
writeCSV('fuels.csv', fuelHeaders, fuelRows);

console.log('Ensure you open these CSVs with UTF-8 encoding (Excel handles BOM automatically).');
