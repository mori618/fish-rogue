
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log("=== Restored Methods Verification Started ===");

// 1. Create Context Object
const contextObj = {
    console: console,
    Math: Math,
    Date: Date,
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
        getDefaultData: () => ({
            player: { money: 0 },
            rod: { rankIndex: 0, equippedSkills: [] },
            inventory: [],
            unlocked: { rods: [0], skills: [] },
            statistics: {}
        })
    },
    // Mock other managers if referenced
    CasinoManager: {},
    MissionManager: {},
    SkillInventoryManager: {},
    ShopManager: {},
};

contextObj.window = contextObj;
const context = vm.createContext(contextObj);

// 2. Load Game Scripts
function loadScript(filePath) {
    const fullPath = path.resolve(__dirname, '..', filePath);
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

if (!GameState) {
    console.error("❌ Failed to find GameState in context");
    process.exit(1);
}

// 3. Verification
const methodsToCheck = [
    'getBoatEventBonus',
    'getBirdEventBonus',
    'getCurrentBaitCount',
    'switchBait',
    'useBait',
    'getCurrentSkin',
    'equipSkin',
    'unlockSkinByRodId',
    'hasPerfectMaster'
];

let missingMethods = [];
methodsToCheck.forEach(method => {
    if (typeof GameState[method] !== 'function') {
        console.error(`❌ Missing method: ${method}`);
        missingMethods.push(method);
    } else {
        console.log(`✅ Found method: ${method}`);
    }
});

if (missingMethods.length > 0) {
    console.error(`FAILED: ${missingMethods.length} methods are missing.`);
    process.exit(1);
}

// Functional Tests in Context
try {
    console.log('\n--- Functional Tests ---');

    // Initialize GameState
    GameState.init();

    // Test getBoatEventBonus
    const boatBonus = GameState.getBoatEventBonus();
    assert.strictEqual(typeof boatBonus, 'number', 'getBoatEventBonus should return number');
    console.log('✅ getBoatEventBonus() OK');

    // Test Bait Methods
    GameState.baitType = 'bait_c';
    GameState.baitInventory['bait_c'] = 10;
    const count = GameState.getCurrentBaitCount();
    assert.strictEqual(count, 10, 'getCurrentBaitCount should return 10');
    console.log('✅ getCurrentBaitCount() OK');

    GameState.useBait(true);
    assert.strictEqual(GameState.baitInventory['bait_c'], 9, 'useBait should decrease count');
    console.log('✅ useBait() OK');

    // Test Skin Methods
    const skin = GameState.getCurrentSkin();
    assert.ok(skin && skin.id, 'getCurrentSkin should return skin object');
    console.log('✅ getCurrentSkin() OK');

    // Test Perfect Master
    const hasMaster = GameState.hasPerfectMaster();
    assert.strictEqual(typeof hasMaster, 'boolean', 'hasPerfectMaster should return boolean');
    console.log('✅ hasPerfectMaster() OK');

    console.log('\n✨ All Verifications Passed!');

} catch (e) {
    console.error('❌ Verification Error:', e);
    process.exit(1);
}
