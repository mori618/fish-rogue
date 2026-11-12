const fs = require('fs');
const path = require('path');

// Mock globals
global.window = global;
global.localStorage = { getItem: () => null, setItem: () => { }, removeItem: () => { } };

// Helper to load gameData.js
function loadGameData() {
    const dataPath = path.join(__dirname, '../data/gameData.js');
    let content = fs.readFileSync(dataPath, 'utf8');

    // Replace top-level consts with global assignments to make them accessible
    const targets = [
        'RODS', 'FISH', 'TITLE_CONFIG', 'RANK_SYSTEM', 'SKILLS', 'SPECIAL_RECIPES',
        'BAITS', 'SKINS', 'GAUGE_CONFIG', 'FISHING_CONFIG', 'RARITY_WEIGHTS',
        'GACHA_CONFIG', 'RECYCLE_RATES', 'TREASURE_CONFIG', 'SKIES', 'SHIPS', 'FUELS'
    ];

    targets.forEach(t => {
        // Use a more robust regex to handle potential newlines or spaces
        const regex = new RegExp(`const\\s+${t}\\s*=`, 'g');
        content = content.replace(regex, `global.${t} =`);
    });

    try {
        eval(content);
    } catch (e) {
        console.error("Error evaluating gameData.js:", e);
        process.exit(1);
    }

    // Reconstruct global.GAME_DATA if the file's window check didn't run (it should run because we set global.window = global)
    // But let's ensure it exists.
    if (!global.GAME_DATA) {
        global.GAME_DATA = {};
        targets.forEach(t => {
            if (global[t]) global.GAME_DATA[t] = global[t];
        });
    }
}

loadGameData();

// Verification Logic
console.log('=== Verifying Special Synthesis Recipes ===');
const specialRecipes = global.SPECIAL_RECIPES;
const skills = global.SKILLS;
let missingCount = 0;

if (!specialRecipes || !skills) {
    console.error("CRITICAL: Could not load SPECIAL_RECIPES or SKILLS.");
    process.exit(1);
}

for (const [key, resultBaseId] of Object.entries(specialRecipes)) {
    console.log(`Checking recipe for: ${resultBaseId} (Key: ${key})`);

    // Check for Tier 1, 2, 3 variants
    for (let tier = 1; tier <= 3; tier++) {
        const expectedId = `${resultBaseId}_${tier}`;
        const found = skills.find(s => s.id === expectedId);

        if (!found) {
            console.error(`  [MISSING] ${expectedId} (Tier ${tier})`);
            missingCount++;
        } else {
            console.log(`  [OK] ${expectedId}`);
        }
    }
}

if (missingCount > 0) {
    console.error(`\nFAILED: Found ${missingCount} missing special skills.`);
    // Don't exit with error code logic-wise to allow next steps, but standard test behavior is exit 1.
    process.exit(1);
} else {
    console.log('\nSUCCESS: All special skills are defined.');
    process.exit(0);
}
