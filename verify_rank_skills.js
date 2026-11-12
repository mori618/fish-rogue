
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
console.log('=== Rank Skills Verification ===');

GameState.init();
GameState.rank = 5; // Base Power Bonus = 4 (if per rank is 1)

// Test 1: XP Boost
console.log('\nTest 1: XP Boost');
const baseExpGain = 100;

// Case 1: No Skills
GameState.equippedSkills = [];
GameState.exp = 0;
GameState.addExp(baseExpGain);
if (GameState.exp === 100) {
    console.log('✅ No Skill: Gain 100 XP');
} else {
    console.error(`❌ No Skill: Expected 100, Got ${GameState.exp}`);
}

// Case 2: XP Boost I (+10%)
GameState.equippedSkills = ['xp_boost_1'];
GameState.exp = 0;
GameState.addExp(baseExpGain);
// 100 * 1.1 = 110
if (GameState.exp === 110) {
    console.log('✅ XP Boost I: Gain 110 XP (+10%)');
} else {
    console.error(`❌ XP Boost I: Expected 110, Got ${GameState.exp}`);
}

// Case 3: XP Boost III (+50%)
GameState.equippedSkills = ['xp_boost_3'];
GameState.exp = 0;
GameState.addExp(baseExpGain);
// 100 * 1.5 = 150
if (GameState.exp === 150) {
    console.log('✅ XP Boost III: Gain 150 XP (+50%)');
} else {
    console.error(`❌ XP Boost III: Expected 150, Got ${GameState.exp}`);
}

// Test 2: Rank Power Bonus Boost
console.log('\nTest 2: Rank Power Boost');
// Rank 5 -> Base Bonus Rate = (5-1) * 0.01 = 0.04 (4%).

// Case 1: No Skill
GameState.equippedSkills = [];
let bonus = GameState.getRankPowerBonus();
if (Math.abs(bonus - 0.04) < 0.0001) {
    console.log('✅ No Skill: Bonus 0.04 (4%)');
} else {
    console.error(`❌ No Skill: Expected 0.04, Got ${bonus}`);
}

// Case 2: Rank Mastery I (+50%)
GameState.equippedSkills = ['rank_power_boost_1'];
bonus = GameState.getRankPowerBonus();
// 0.04 * (1 + 0.5) = 0.06
if (Math.abs(bonus - 0.06) < 0.0001) {
    console.log('✅ Rank Mastery I: Bonus 0.06 (6%)');
} else {
    console.error(`❌ Rank Mastery I: Expected 0.06, Got ${bonus}`);
}

// Case 3: Rank Mastery II (+100%)
GameState.equippedSkills = ['rank_power_boost_2'];
bonus = GameState.getRankPowerBonus();
// 0.04 * (1 + 1.0) = 0.08
if (Math.abs(bonus - 0.08) < 0.0001) {
    console.log('✅ Rank Mastery II: Bonus 0.08 (8%)');
} else {
    console.error(`❌ Rank Mastery II: Expected 0.08, Got ${bonus}`);
}

// Case 4: Stacked (I + II) -> +150%
GameState.equippedSkills = ['rank_power_boost_1', 'rank_power_boost_2'];
bonus = GameState.getRankPowerBonus();
// 0.04 * (1 + 0.5 + 1.0) = 0.04 * 2.5 = 0.10
if (Math.abs(bonus - 0.10) < 0.0001) {
    console.log('✅ Stacked Skills: Bonus 0.10 (10%)');
} else {
    console.error(`❌ Stacked Skills: Expected 0.10, Got ${bonus}`);
}
