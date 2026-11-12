
const fs = require('fs');
const path = require('path');

// Mock Browser Environment
const window = {};
global.window = window;
global.document = {
    getElementById: () => ({ parentNode: { insertBefore: () => { } }, style: {} }),
    createElement: () => ({ style: {} }),
    querySelector: () => null,
};
global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
};

// Mock UIManager
global.UIManager = {
    updateRankInfo: () => { },
    showRankUp: () => { },
    updateMoney: () => { },
    updateStatus: () => { },
    showMessage: (msg) => console.log(`UI: ${msg}`),
};

// Mock SaveManager
global.SaveManager = {
    hasSaveData: () => false,
    load: () => null,
    save: () => { },
    getDefaultData: () => ({
        player: { money: 0, exp: 0, rank: 1, inventory: [], stats: {} },
        rod: { rankIndex: 0, starLevels: {}, equippedSkills: [] },
        unlocked: { rods: [0], skins: ['skin_default'] },
        settings: {},
        mission: { beginner: {}, dynamic: [] },
        skills: { equipped: [], inventory: {} },
        inventory: [],
        statistics: { totalFishCaught: 0, totalTreasure: 0, totalSkills: 0, totalCoinsEarned: 0, caughtByRank: {} }
    }),
};

// Load Game Sources
const gameDataPath = path.resolve('/Users/mori/Desktop/メモ/fishing/data/gameData.js');
const gameStatePath = path.resolve('/Users/mori/Desktop/メモ/fishing/js/GameState.js');

const gameDataContent = fs.readFileSync(gameDataPath, 'utf8');
const gameStateContent = fs.readFileSync(gameStatePath, 'utf8');

eval(gameDataContent);
global.GAME_DATA = window.GAME_DATA;

eval(gameStateContent);
global.GameState = window.GameState;

// Test Suite
console.log('=== Fever XP Verification ===');

GameState.init();
GameState.rank = 10; // Set high rank to avoid rank up checks interfering (Req Exp > 300)
const baseExp = 100;

// Test 1: Normal State (No Fever)
console.log('\nTest 1: Normal State');
GameState.fever.isActive = false;
GameState.exp = 0;
GameState.addExp(baseExp);

if (GameState.exp === 100) {
    console.log('✅ Normal: Gain 100 XP');
} else {
    console.error(`❌ Normal: Expected 100, Got ${GameState.exp}`);
}

// Test 2: Fever Mode (x2)
console.log('\nTest 2: Fever Mode Active');
GameState.fever.isActive = true;
GameState.exp = 0;
GameState.addExp(baseExp);
// 100 * 2.0 = 200
if (GameState.exp === 200) {
    console.log('✅ Fever: Gain 200 XP (x2)');
} else {
    console.error(`❌ Fever: Expected 200, Got ${GameState.exp}`);
}

// Test 3: Fever + XP Boost Skill
console.log('\nTest 3: Fever + XP Boost I (+10%)');
GameState.fever.isActive = true;
GameState.equippedSkills = ['xp_boost_1'];
GameState.exp = 0;
GameState.addExp(baseExp);
// Multiplier: (1.0 + 0.1) * 2.0 = 2.2
// 100 * 2.2 = 220
if (GameState.exp === 220) {
    console.log('✅ Fever + Skill: Gain 220 XP (110% * 2)');
} else {
    console.error(`❌ Fever + Skill: Expected 220, Got ${GameState.exp}`);
}

// Test 4: Fever OFF check
console.log('\nTest 4: Fever OFF check');
GameState.fever.isActive = false;
GameState.equippedSkills = [];
GameState.exp = 0;
GameState.addExp(baseExp);
if (GameState.exp === 100) {
    console.log('✅ fever OFF returned to normal 100 XP');
} else {
    console.error(`❌ fever OFF check failed: ${GameState.exp}`);
}
