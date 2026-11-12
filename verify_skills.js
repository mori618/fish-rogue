
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("=== Skill Logic Verification Started ===");

// 1. Create Context Object
const contextObj = {
    console: console,
    Math: Math,
    Date: Date,
    // Add mocks
    localStorage: {
        getItem: () => null,
        setItem: () => { },
    },
    UIManager: {
        updateStatus: () => { },
        updateInventory: () => { },
        updateRodView: () => { },
        updateSkyVisuals: () => { },
        renderShop: () => { },
        showMessage: (msg) => console.log(`[UI Message] ${msg}`),
        showScreen: () => { },
        currentScreen: 'fishing',
        refreshMissionUI: () => { },
        updateMoney: () => { }
    },
    SaveManager: {
        load: () => null,
        save: () => { },
    },
    CasinoManager: {
        render: () => { }
    },
    MissionManager: {
        renderMissionList: () => { },
        checkMission: () => { }
    },
    SkillInventoryManager: {
        init: () => { }
    },
    ShopManager: {},
    // These will be populated by scripts
    // GameState, GAME_DATA, etc.
};

// Circular reference for window -> global
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

// Order matters
loadScript('data/gameData.js');
loadScript('js/GameState.js');
loadScript('js/MissionManager.js');
loadScript('js/ShopManager.js');
loadScript('js/CasinoManager.js');

// Access globals directly from context
const { GameState, GAME_DATA } = context;

if (!GameState) {
    console.error("❌ Failed to find GameState in context");
    process.exit(1);
}
if (!GAME_DATA) {
    console.error("❌ Failed to find GAME_DATA in context");
    process.exit(1);
}

// 3. Helper for Assertions
function assert(condition, message) {
    if (condition) {
        console.log(`✅ [PASS] ${message}`);
    } else {
        console.error(`❌ [FAIL] ${message}`);
    }
}

function assertEqual(actual, expected, message) {
    if (Math.abs(actual - expected) < 0.0001) {
        console.log(`✅ [PASS] ${message}`);
    } else {
        console.error(`❌ [FAIL] ${message} (Expected: ${expected}, Actual: ${actual})`);
    }
}

// 4. Test Cases

// --- Setup ---
GameState.money = 100000;
GameState.gachaTickets = 0;
GameState.inventory = [];
GameState.equippedSkills = [];
GameState.missionList = [];
GameState.skillInventory = {};

// --- Test 1: Dynamic Power Bonus (count_skill_power) ---
console.log("\n--- Testing Dynamic Power Bonus ---");
const testSkillPower = { id: 'test_power', effect: { type: 'count_skill_power', value: 2 }, tier: 1 };
GAME_DATA.SKILLS.push(testSkillPower);
GameState.skillInventory['test_power'] = 5;
GameState.equippedSkills = ['test_power'];

const dynamicPower = GameState.getDynamicPowerBonus();
assertEqual(dynamicPower, 10, "Dynamic Power Bonus should be skills_count * value");


// --- Test 2: Dynamic Sell Multiplier (count_gacha_sell) ---
console.log("\n--- Testing Dynamic Sell Multiplier ---");
const testSkillSell = { id: 'test_sell', effect: { type: 'count_gacha_sell', value: 0.01 }, tier: 1 };
GAME_DATA.SKILLS.push(testSkillSell);
GameState.equippedSkills = ['test_sell'];
GameState.gachaTickets = 50;

const sellMult = GameState.getDynamicSellMultiplier();
assertEqual(sellMult, 0.5, "Sell Multiplier should be tickets * value");


// --- Test 3: Shop Discount ---
console.log("\n--- Testing Shop Discount ---");
const testSkillDiscount1 = { id: 'test_disc1', effect: { type: 'shop_discount', value: 0.1 }, tier: 1 };
const testSkillDiscount2 = { id: 'test_disc2', effect: { type: 'shop_discount', value: 0.2 }, tier: 1 };
GAME_DATA.SKILLS.push(testSkillDiscount1, testSkillDiscount2);
GameState.equippedSkills = ['test_disc1', 'test_disc2'];

const discount = GameState.getShopDiscount();
assertEqual(discount, 0.3, "Shop Discount should sum up skill values");


// --- Test 4: Upgrade Cost Modifier ---
console.log("\n--- Testing Upgrade Cost Modifier ---");
const testSkillUpgrade = { id: 'test_upg', effect: { type: 'upgrade_discount', value: 0.15 }, tier: 1 };
GAME_DATA.SKILLS.push(testSkillUpgrade);
GameState.equippedSkills = ['test_upg'];

const upgradeMod = GameState.getUpgradeCostModifier();
assertEqual(upgradeMod, 0.85, "Upgrade Modifier should be 1.0 - discount");


// --- Test 5: Auto Hit Flag ---
console.log("\n--- Testing Auto Hit ---");
const testSkillAutoHit = { id: 'test_auto', effect: { type: 'auto_hit', value: 0.5 }, tier: 3 };
GAME_DATA.SKILLS.push(testSkillAutoHit);
GameState.equippedSkills = ['test_auto'];

const autoHit = GameState.hasAutoHit();
assert(autoHit.hasIt === true, "hasAutoHit should return true");
assertEqual(autoHit.chance, 0.5, "hasAutoHit chance should be correct");


// --- Test 6: Mission Reward Modifier with Power ---
console.log("\n--- Testing Mission Reward Modifier ---");
GameState.equippedSkills = [];
GameState.rodRankIndex = 0;
GameState.rodStars = 0;
const testSkillMission = { id: 'test_mission', effect: { type: 'mission_reward_up', value: 0.2 }, tier: 1 };
GAME_DATA.SKILLS.push(testSkillMission);
GameState.equippedSkills = ['test_mission'];

// Mock getTotalPower
GameState.getTotalPower = () => 500;

const missionMod = GameState.getMissionRewardModifier();
assertEqual(missionMod, 1.7, "Mission Reward Modifier should include skill and power bonus");


// --- Test 7: Casino High Roller (Logic Check) ---
console.log("\n--- Testing Casino High Roller Logic ---");
const testHighRoller = { id: 'casino_high_roller', effect: { type: 'casino_high_roller' }, tier: 3 };
GAME_DATA.SKILLS.push(testHighRoller);
GameState.equippedSkills = ['casino_high_roller'];

const hasHighRoller = GameState.equippedSkills.some(id => {
    const s = GAME_DATA.SKILLS.find(sk => sk.id === id);
    return s && s.effect.type === 'casino_high_roller';
});
assert(hasHighRoller, "High Roller skill should be detected in equipped skills");

console.log("\n=== Skill Logic Verification Complete ===");
