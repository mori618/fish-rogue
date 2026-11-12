
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("=== New Skill Logic Verification Started ===");

// 1. Create Context Object
const contextObj = {
    console: console,
    Math: Math,
    Date: Date,
    localStorage: { getItem: () => null, setItem: () => { } },
    UIManager: { updateStatus: () => { } },
    SaveManager: { load: () => null, save: () => { } },
    CasinoManager: {},
    MissionManager: {},
    SkillInventoryManager: { init: () => { } },
    ShopManager: {},
};
contextObj.window = contextObj;
const context = vm.createContext(contextObj);

// 2. Load Game Scripts
function loadScript(filePath) {
    const fullPath = path.resolve(__dirname, filePath);
    try {
        const content = fs.readFileSync(fullPath, 'utf8');
        vm.runInContext(content, context);
    } catch (e) {
        console.error(`Failed to load script: ${fullPath}`);
        throw e;
    }
}

loadScript('data/gameData.js');
loadScript('js/GameState.js');

const { GameState, GAME_DATA } = context;

function assertEqual(actual, expected, message) {
    if (Math.abs(actual - expected) < 0.0001) {
        console.log(`✅ [PASS] ${message}`);
    } else {
        console.error(`❌ [FAIL] ${message} (Expected: ${expected}, Actual: ${actual})`);
    }
}

// --- Setup ---
GameState.equippedSkills = [];
// Clean defined skills for testing isolation if we push new ones, or simple use existing ones if they match
// But simpler to push temporary mock skills to ensure values are controlled.

// --- Test 1: New Fish Finder (Spawn Rate Bonus) ---
console.log("\n--- Testing New Fish Finder (Spawn Bonus) ---");
const testFinder1 = {
    id: 'test_finder_1',
    effect: { type: 'new_fish_finder', value: 1.5, waitIncrease: 0.4 },
    tier: 1
};
const testFinder2 = {
    id: 'test_finder_2',
    effect: { type: 'new_fish_finder', value: 2.0, waitIncrease: 0.25 },
    tier: 2
};
// Add to GAME_DATA
GAME_DATA.SKILLS.push(testFinder1, testFinder2);

// Case 1: Equipped 1 (x1.5)
GameState.equippedSkills = ['test_finder_1'];
let bonus = GameState.getNewFishBonus();
assertEqual(bonus, 1.5, "New Fish Bonus should be 1.5 for Tier 1");

// Case 2: Equipped 1 & 2 (x1.5 * x2.0 = x3.0)
GameState.equippedSkills = ['test_finder_1', 'test_finder_2'];
bonus = GameState.getNewFishBonus();
assertEqual(bonus, 3.0, "New Fish Bonus should be multiplicative (1.5 * 2.0 = 3.0)");


// --- Test 2: New Fish Finder (Wait Time Penalty) ---
console.log("\n--- Testing New Fish Finder (Wait Time Penalty) ---");

// Case 1: Only Finder 1 (Penalty 0.4 -> Reduction = -0.4)
GameState.equippedSkills = ['test_finder_1'];
let reduction = GameState.getWaitTimeReduction();
assertEqual(reduction, -0.4, "Wait Reduction should be negative (penalty) of 0.4");

// Case 2: Finder 1 + Patience Skill (Reduction 0.25)
// Net: 0.25 - 0.4 = -0.15
const testPatience = { id: 'test_patience', effect: { type: 'wait_time_reduction', value: 0.25 }, tier: 2 };
GAME_DATA.SKILLS.push(testPatience);

GameState.equippedSkills = ['test_finder_1', 'test_patience'];
reduction = GameState.getWaitTimeReduction();
assertEqual(reduction, -0.15, "Wait Reduction should be (0.25 - 0.4) = -0.15");


// --- Test 3: Recycle Boost ---
console.log("\n--- Testing Recycle Boost ---");
const testRecycle = {
    id: 'test_recycle',
    effect: { type: 'recycle_boost', value: 1.5 },
    tier: 3
};
GAME_DATA.SKILLS.push(testRecycle);

GameState.equippedSkills = ['test_recycle'];
let recycleBoost = GameState.getRecycleBoost();
assertEqual(recycleBoost, 1.5, "Recycle Boost shoud be 1.5");

GameState.equippedSkills = [];
recycleBoost = GameState.getRecycleBoost();
assertEqual(recycleBoost, 1.0, "Recycle Boost should be 1.0 (default) when not equipped");

console.log("\n=== New Skill Logic Verification Complete ===");
