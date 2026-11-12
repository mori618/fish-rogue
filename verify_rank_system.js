
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
    updateRankInfo: () => console.log('UI: updateRankInfo called'),
    showRankUp: (rank, coin, ticket) => console.log(`UI: showRankUp called. Rank: ${rank}, Coin: ${coin}, Ticket: ${ticket}`),
    updateMoney: () => { },
    updateStatus: () => { },
    showMessage: (msg) => console.log(`UI Message: ${msg}`),
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
console.log('=== User Rank System Verification ===');

// Check if loaded
if (!global.GameState || !global.GAME_DATA) {
    console.error('Failed to load GameState or GAME_DATA');
    process.exit(1);
}

// Test 1: Initial State
console.log('\nTest 1: Initial State');
GameState.init();
if (GameState.rank === 1 && GameState.exp === 0) {
    console.log('✅ Initial Rank is 1, Exp is 0');
} else {
    console.error(`❌ Initial State incorrect: Rank=${GameState.rank}, Exp=${GameState.exp}`);
}

// Test 2: Add Experience
console.log('\nTest 2: Add Experience');
const initialExp = GameState.exp;
GameState.addExp(50);
if (GameState.exp === initialExp + 50) {
    console.log('✅ Exp increased by 50');
} else {
    console.error(`❌ Exp gain incorrect: ${GameState.exp}`);
}

// Test 3: Rank Up Logic
console.log('\nTest 3: Rank Up Logic');
// Base Exp for Rank 1->2 is 100. Current is 50. Add 60 -> 110. Should scale up.
// Remainder should be 10. Rank should be 2.
GameState.addExp(60);

if (GameState.rank === 2) {
    console.log('✅ Rank Up successful: Rank 2');
} else {
    console.error(`❌ Rank Up failed. Rank: ${GameState.rank}`);
}

if (GameState.exp === 10) {
    console.log('✅ Exp carry-over correct: 10');
} else {
    console.error(`❌ Exp carry-over incorrect: ${GameState.exp} (Expected 10)`);
}

// Test 4: Power Bonus
console.log('\nTest 4: Rank Power Bonus');
// Rank 2 should give (2-1)*0.01 = +0.01 bonus (assuming powerBonusPerRank is 0.01)
const bonus = GameState.getRankPowerBonus();
if (Math.abs(bonus - 0.01) < 0.0001) {
    console.log('✅ Rank Power Bonus correct: +0.01 (+1%)');
} else {
    console.error(`❌ Rank Power Bonus incorrect: ${bonus}`);
}

// Test 5: Reward Multiplier
console.log('\nTest 5: Rank Reward Multiplier');
// Rank 2 -> 1.0 + (1 * 0.05) = 1.05
const multiplier = GameState.getRankRewardMultiplier();
if (Math.abs(multiplier - 1.05) < 0.001) {
    console.log('✅ Reward Multiplier correct: 1.05');
} else {
    console.error(`❌ Reward Multiplier incorrect: ${multiplier}`);
}

// Test 6: Recursive Rank Up (Multi-level)
console.log('\nTest 6: Multi-level Rank Up');
// Rank 2->3 requires 100 * 1.15 = 115.
// Current Exp 10. Add 200. Total 210.
// 210 >= 115 -> Rank 3. Remainder 95.
// Rank 3->4 requires 100 * 1.15^2 = 132.
// 95 < 132. So should stop at Rank 3.
GameState.addExp(200);
if (GameState.rank === 3) {
    console.log('✅ Multi-level Rank Up successful: Rank 3');
    console.log(`Current Exp: ${GameState.exp} (Expected around 95)`);
    // Rank 2->3 Reward: Coin 300, Ticket 3
    // (Previous test checked Rank 2 rewards)
} else {
    console.error(`❌ Multi-level Rank Up failed. Rank: ${GameState.rank}`);
}
