
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
    showRankUp: (rank, coin, ticket) => console.log(`UI: Rank ${rank}, Coin ${coin}, Ticket ${ticket}`),
    updateMoney: () => { },
    updateStatus: () => { },
    showMessage: (msg) => console.log(`UI Msg: ${msg}`),
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
        statistics: { totalFishCaught: 0, totalTreasure: 0, totalSkills: 0, totalCoinsEarned: 0, gachaTickets: 0 }
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
console.log('=== Rank Reward Boost Verification ===');

GameState.init();

// Helper to reset and set rank
function testReward(rank, skills, expectedCoin, expectedTicket) {
    GameState.rank = rank; // Set Rank (e.g. 5)
    GameState.equippedSkills = skills;
    GameState.money = 0;
    GameState.gachaTickets = 0;

    console.log(`\nTesting Rank ${rank} with skills [${skills.join(', ')}]`);
    console.log(`Expected: Coin ${expectedCoin}, Ticket ${expectedTicket}`);

    // Call process directly (bypassing exp check)
    GameState.processRankUpReward();

    if (GameState.money === expectedCoin && GameState.gachaTickets === expectedTicket) {
        console.log(`✅ Success: Got ${GameState.money} Coins, ${GameState.gachaTickets} Tickets`);
    } else {
        console.error(`❌ Failed: Got ${GameState.money} Coins, ${GameState.gachaTickets} Tickets`);
    }
}

// Case 1: No Skill (Base: Rank * 100 Coin, Rank * 1 Ticket)
// Rank 5 -> 500 Coin, 5 Ticket
testReward(5, [], 500, 5);

// Case 2: 5x Skill (rank_reward_boost_1)
// Rank 5 -> 500 * 5 = 2500 Coin, 5 * 5 = 25 Ticket
testReward(5, ['rank_reward_boost_1'], 2500, 25);

// Case 3: 10x Skill (rank_reward_boost_2)
// Rank 5 -> 500 * 10 = 5000 Coin, 5 * 10 = 50 Ticket
testReward(5, ['rank_reward_boost_2'], 5000, 50);

// Case 4: 20x Skill (rank_reward_boost_3)
// Rank 5 -> 500 * 20 = 10000 Coin, 5 * 20 = 100 Ticket
testReward(5, ['rank_reward_boost_3'], 10000, 100);

// Case 5: 50x Skill (rank_reward_boost_4)
// Rank 5 -> 500 * 50 = 25000 Coin, 5 * 50 = 250 Ticket
testReward(5, ['rank_reward_boost_4'], 25000, 250);

// Case 6: Stacked (5x + 10x)
// Logic: 1 + (5-1) + (10-1) = 1 + 4 + 9 = 14x
// Rank 5 -> 500 * 14 = 7000 Coin, 5 * 14 = 70 Ticket
testReward(5, ['rank_reward_boost_1', 'rank_reward_boost_2'], 7000, 70);
