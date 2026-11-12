const fs = require('fs');
const path = require('path');
const { setup } = require('./mocks');

// Setup global environment
setup(global);

// Mock UIManager to avoid errors
global.UIManager = {
    showTreasureResult: (chest, results, callback) => { if (callback) callback(); },
    showIdle: () => { },
    showMessage: (msg) => console.log('[UI]', msg),
    updateFeverVisuals: () => { },
    showScreen: () => { },
};

// Mock MissionManager
global.MissionManager = {
    checkMission: () => { }
};

// Mock SaveManager
global.SaveManager = {
    save: () => { },
    getDefaultData: () => ({
        player: { money: 0, baitInventory: {}, baitType: 'bait_d' },
        unlocked: { rods: [0], skins: [], skies: [] },
        statistics: {},
        port: {},
        rod: { rankIndex: 0, rodStarLevels: {}, equippedSkills: [] },
        inventory: []
    })
};

// Helper: load script
function loadScript(filename) {
    const code = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
    eval(code);
}

// Load Game Scripts
loadScript('data/gameData.js');
loadScript('js/GameState.js');
loadScript('js/FishingGame.js');

// Initialize GameState
GameState.init();

console.log('=== Verifying Skill Slot Expansion ===');

// --- Test 1: Verify getSkillSlots Logic ---
console.log('\n--- Test 1: getSkillSlots Logic ---');

// Baseline (Rank 0 rod = 0 stars)
GameState.rodStarLevels[GameState.rodRankIndex] = 0;
let slots = GameState.getSkillSlots();
console.log(`Baseline Slots (Star 0): ${slots} (Expected: 1)`);
if (slots !== 1) console.error('FAILED: Baseline slots calculation incorrect');

// Equip Slot Expansion I (+2)
// Mock addSkill so it doesn't try to save
GameState.skillInventory = { 'slot_expansion_1': 1 };
GameState.equippedSkills = ['slot_expansion_1'];
slots = GameState.getSkillSlots();
console.log(`Slots with Expansion I (+2): ${slots} (Expected: 3)`);
if (slots !== 3) console.error('FAILED: Expansion I (+2) calculation incorrect');

// Equip Slot Expansion II (+3)
GameState.skillInventory = { 'slot_expansion_2': 1 };
GameState.equippedSkills = ['slot_expansion_2'];
slots = GameState.getSkillSlots();
console.log(`Slots with Expansion II (+3): ${slots} (Expected: 4)`);
if (slots !== 4) console.error('FAILED: Expansion II (+3) calculation incorrect');

// Equip Slot Expansion III (+4)
GameState.skillInventory = { 'slot_expansion_3': 1 };
GameState.equippedSkills = ['slot_expansion_3'];
slots = GameState.getSkillSlots();
console.log(`Slots with Expansion III (+4): ${slots} (Expected: 5)`);
if (slots !== 5) console.error('FAILED: Expansion III (+4) calculation incorrect');

// --- Test 2: Verify Drop Logic ---
console.log('\n--- Test 2: Drop Logic (5% chance) ---');

// Mock GameState.addSkill to track drops
let droppedSkills = [];
GameState.addSkill = (id) => {
    droppedSkills.push(id);
};

// Test specific chest type
function testDrop(chestType, expectedSkillId) {
    droppedSkills = [];
    const chest = { treasureType: chestType, name: chestType + ' Chest' };
    const trials = 10000;

    // Silence console log for drop
    const originalLog = console.log;
    console.log = () => { };

    for (let i = 0; i < trials; i++) {
        FishingGame.processTreasureChest(chest);
    }

    console.log = originalLog;

    const count = droppedSkills.filter(id => id === expectedSkillId).length;
    const rate = (count / trials) * 100;
    console.log(`[${chestType}] Dropped ${expectedSkillId}: ${count}/${trials} (${rate.toFixed(2)}%)`);

    // Expect roughly 5% (4.0% - 6.0%)
    if (rate >= 4.0 && rate <= 6.0) {
        console.log('PASS: Drop rate within expected range.');
    } else {
        console.error('FAILED: Drop rate verification failed.');
    }
}

testDrop('WOOD', 'slot_expansion_1');
testDrop('SILVER', 'slot_expansion_2');
testDrop('GOLD', 'slot_expansion_3');

console.log('\n=== Verification Complete ===');
