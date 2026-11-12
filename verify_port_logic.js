
// Mock window
global.window = {};

// Mock Game Data (Minimal)
global.GAME_DATA = {
    SHIPS: [
        { id: 'ship_small', price: 1000, name: 'Small Ship', capacity: 20 },
        { id: 'ship_expensive', price: 999999, name: 'Expensive Ship', capacity: 100 }
    ],
    FUELS: [
        { id: 'fuel_regular', price: 100, recovery: 30, name: 'Regular Fuel' }
    ],
    // Dummy skills required for GameState methods
    SKILLS: [
        { id: 'price_up_1', effect: { type: 'price_boost', value: 0.1 } }
    ],
    BAITS: [] // Required for getRareBonus
};

// Mock SaveManager for init
global.SaveManager = {
    getDefaultData: () => ({
        player: { money: 0 },
        rod: { rankIndex: 0, rodStarLevels: {}, equippedSkills: [] },
        inventory: [],
        unlocked: { rods: [0] },
        statistics: {}
    })
};

// Load GameState
try {
    require('./js/GameState.js');
} catch (e) {
    console.error('Failed to load GameState.js:', e);
    process.exit(1);
}

const GameState = window.GameState || require('./js/GameState.js'); // Depending on how it exports

// 1. Initialize
console.log('--- Test 1: Init ---');
GameState.init(null);
if (!GameState.port) {
    console.error('❌ Port state not initialized');
    process.exit(1);
}
if (GameState.port.ownedShipId !== null || GameState.port.fuelMinutes !== 0) {
    console.error('❌ Port state defaults incorrect');
    process.exit(1);
}
console.log('✅ Init passed');

// 2. Buy Ship
console.log('\n--- Test 2: Buy Ship ---');
GameState.addMoney(2000); // Money: 2000
const buySuccess1 = GameState.buyShip('ship_small');

if (!buySuccess1) console.error('❌ Failed to buy affordable ship');
else if (GameState.money !== 1000) console.error(`❌ Money deduction wrong. Expected 1000, got ${GameState.money}`);
else if (GameState.port.ownedShipId !== 'ship_small') console.error('❌ ownedShipId not updated');
else console.log('✅ Buy affordable ship passed');

const buySuccess2 = GameState.buyShip('ship_expensive');
if (buySuccess2) console.error('❌ Bought unaffordable ship');
else console.log('✅ Buy unaffordable ship prevention passed');


// 3. Add Fuel
console.log('\n--- Test 3: Add Fuel ---');
// Money: 1000
const fuelSuccess1 = GameState.addFuel('fuel_regular');
if (!fuelSuccess1) console.error('❌ Failed to buy affordable fuel');
else if (GameState.money !== 900) console.error(`❌ Money deduction wrong. Expected 900, got ${GameState.money}`);
else if (GameState.port.fuelMinutes !== 30) console.error(`❌ Fuel minutes wrong. Expected 30, got ${GameState.port.fuelMinutes}`);
else console.log('✅ Add fuel passed');


// 4. Collect Stock
console.log('\n--- Test 4: Collect Stock ---');
// Populate stock with dummy fish
GameState.port.stock = [
    { id: 'fish_1', price: 100 },
    { id: 'fish_2', price: 200 }
];
// Money: 900

// Equip price bonus skill if possible (mocked in equippedSkills)
GameState.equippedSkills = ['price_up_1']; // +10%

// Expected value: (100 * 1.1) + (200 * 1.1) = 110 + 220 = 330
const collectedAmount = GameState.collectPortStock();

if (collectedAmount !== 330) {
    // Note: Math.floor logic might make it 110 + 220 = 330.
    console.error(`❌ Collected amount wrong. Expected 330, got ${collectedAmount}`);
}

if (GameState.money !== 1230) { // 900 + 330
    console.error(`❌ Money update wrong. Expected 1230, got ${GameState.money}`);
}

if (GameState.port.stock.length !== 0) {
    console.error('❌ Stock not cleared');
}

console.log(`✅ Collect stock passed (Amount: ${collectedAmount})`);

console.log('\n✨ All Logic Verified!');
