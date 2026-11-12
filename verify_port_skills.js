
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("=== Port Skill Logic Verification Started ===");

// 1. Create Context Object
const contextObj = {
    console: console,
    Math: Math,
    Date: Date,
    localStorage: { getItem: () => null, setItem: () => { } },
    localStorage: { getItem: () => null, setItem: () => { } },
    UIManager: { updateStatus: () => { }, showMessage: () => { }, updateMoney: () => { }, updateInventory: () => { } },
    SaveManager: {
        load: () => null,
        save: () => { },
        getDefaultData: () => ({
            player: {
                money: 0,
                level: 1,
                exp: 0,
                baitInventory: {},
                baitType: 'bait_d',
                selectedSkin: 'skin_default',
                selectedSky: 'sky_default'
            },
            rod: {
                rankIndex: 0,
                rodStarLevels: {},
                equippedSkills: []
            },
            inventory: [],
            encyclopedia: {},
            unlocked: {
                rods: [0],
                skills: [],
                skillInventory: {},
                skins: ['skin_default'],
                skies: ['sky_default']
            },
            statistics: {
                totalFishCaught: 0,
                caughtByRank: {},
                totalTreasure: 0,
                totalSkills: 0,
                totalMoneyEarned: 0,
                totalCoinsEarned: 0,
                casinoTotalWin: 0,
                casinoTotalLoss: 0,
                gachaTickets: 0,
                currentMissionIndex: 0,
                missionProgress: 0,
                beginnerMissionCompleted: [],
                beginnerMissionProgress: {},
                dynamicMissions: null,
                dynamicMissionCompletedCount: 0,
                biggestFish: null
            },
            port: {
                ownedShipId: null,
                fuelMinutes: 0,
                stock: [],
                lastProcessTime: Date.now()
            }
        })
    },
    CasinoManager: {},
    MissionManager: {},
    SkillInventoryManager: { init: () => { } },
    ShopManager: {}, // Will be loaded or mocked
    window: {}
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
// Load PortManager to ensure syntax is correct, though we mainly test GameState integration here
loadScript('js/PortManager.js');

const { GameState, GAME_DATA, PortManager } = context;

function assertEqual(actual, expected, message) {
    // For objects, simple JSON stringify comparison
    if (typeof actual === 'object' && actual !== null) {
        if (JSON.stringify(actual) === JSON.stringify(expected)) {
            console.log(`✅ [PASS] ${message}`);
        } else {
            console.error(`❌ [FAIL] ${message} (Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)})`);
        }
    } else if (Math.abs(actual - expected) < 0.0001) {
        console.log(`✅ [PASS] ${message}`);
    } else {
        console.error(`❌ [FAIL] ${message} (Expected: ${expected}, Actual: ${actual})`);
    }
}

// --- Setup ---
GameState.init(); // Initialize GameState
GameState.money = 100000;
GameState.port = {
    ownedShipId: 'ship_basic',
    fuelMinutes: 0,
    stock: [],
    lastProcessTime: Date.now()
};

// --- Test 1: Interval Reduction (getShipIntervalMultiplier) ---
console.log("\n--- Testing Interval Reduction ---");
GameState.equippedSkills = [];
assertEqual(GameState.getShipIntervalMultiplier(), 1.0, "Default Multiplier should be 1.0");

// Equip Tier 1 (10% reduction -> 0.9 multiplier)
GameState.equippedSkills = ['ship_interval_down_1'];
assertEqual(GameState.getShipIntervalMultiplier(), 0.90, "Tier 1 Multiplier should be 0.90");

// Equip Tier 1 + Tier 2 (10% + 25% = 35% reduction -> 0.65 multiplier)
GameState.equippedSkills = ['ship_interval_down_1', 'ship_interval_down_2'];
assertEqual(GameState.getShipIntervalMultiplier(), 0.65, "Tier 1+2 Multiplier should be 0.65");

// --- Test 2: Catch Bonus (getShipAmountBonus) ---
console.log("\n--- Testing Catch Bonus ---");
GameState.equippedSkills = [];
assertEqual(GameState.getShipAmountBonus(), { min: 0, max: 0 }, "Default Catch Bonus should be {min:0, max:0}");

// Equip Tier 1 (+1~2)
GameState.equippedSkills = ['ship_amount_up_1'];
assertEqual(GameState.getShipAmountBonus(), { min: 1, max: 2 }, "Tier 1 Bonus should be {min:1, max:2}");

// Equip Tier 1 + Tier 3 (+1~2 + +6~10 = +7~12)
GameState.equippedSkills = ['ship_amount_up_1', 'ship_amount_up_3'];
assertEqual(GameState.getShipAmountBonus(), { min: 7, max: 12 }, "Tier 1+3 Bonus should be {min:7, max:12}");

// --- Test 3: Fuel Efficiency (getShipFuelEfficiency) ---
console.log("\n--- Testing Fuel Efficiency ---");
GameState.equippedSkills = [];
assertEqual(GameState.getShipFuelEfficiency(), 0, "Default Efficiency should be 0");

// Equip Tier 2 (40%)
GameState.equippedSkills = ['ship_fuel_eco_2'];
assertEqual(GameState.getShipFuelEfficiency(), 0.40, "Tier 2 Efficiency should be 0.40");

// --- Test 4: Fuel Discount & addFuel integration ---
console.log("\n--- Testing Fuel Discount & addFuel ---");
GameState.equippedSkills = [];
// Fuel ID: fuel_regular (500G)
const fuelId = 'fuel_regular';
const fuel = GAME_DATA.FUELS.find(f => f.id === fuelId);
const initialMoney = GameState.money;

// 4-1: No Discount
GameState.addFuel(fuelId);
assertEqual(GameState.money, initialMoney - 500, "Money should decrease by 500 (No Discount)");

// 4-2: With Discount (Tier 1: 15% -> 425G)
GameState.money = 100000; // Reset money
GameState.equippedSkills = ['ship_fuel_discount_1'];
console.log(`Discount Rate: ${GameState.getPortFuelDiscount()}`); // Should be 0.15

GameState.addFuel(fuelId);
assertEqual(GameState.money, 100000 - 425, "Money should decrease by 425 (15% Discount)");

// 4-3: With Discount (Tier 3: 50% -> 250G)
GameState.money = 100000;
GameState.equippedSkills = ['ship_fuel_discount_3'];
GameState.addFuel(fuelId);
assertEqual(GameState.money, 100000 - 250, "Money should decrease by 250 (50% Discount)");

console.log("\n=== Port Skill Logic Verification Complete ===");
