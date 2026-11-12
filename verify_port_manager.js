
// Mock window and dependencies
global.window = {};

global.GAME_DATA = {
    SHIPS: [
        { id: 'ship_small', price: 1000, capacity: 5, catchAmountRange: [1, 2], maxRarity: 'C' }
    ],
    FISH: [
        { id: 'fish_common', rarity: 'D', weight: 1.0 },
        { id: 'fish_rare', rarity: 'S', weight: 0.1 }
    ],
    RARITY_WEIGHTS: { 'D': 1.0, 'S': 0.1 }
};

// Mock GameState with minimal structure
global.GameState = {
    port: {
        ownedShipId: 'ship_small',
        fuelMinutes: 10,
        stock: [],
        lastProcessTime: Date.now()
    },
    encyclopedia: {
        'fish_common': { caught: 1 },
        'fish_rare': { caught: 0 } // Not caught yet
    }
};

// Mock UIManager
global.UIManager = {
    showMessage: (msg) => console.log(`[UI] ${msg}`)
};

// Load PortManager
require('./js/PortManager.js');
const PortManager = window.PortManager;

// Test 1: Update Loop (Catch Logic)
console.log('--- Test 1: Update Loop ---');
// Advance time by 300,000ms (5 mins) in 1s steps
// Instead of calling update 300 times, we simulate large dt
PortManager.updateMetric(300000);

if (GameState.port.fuelMinutes !== 5) {
    console.error(`❌ Fuel consumption wrong. Expected 5, got ${GameState.port.fuelMinutes}. (Started with 10, consumed 5 mins worth)`);
} else {
    console.log(`✅ Fuel consumed correctly: 10 -> ${GameState.port.fuelMinutes}`);
}

// Check stock
// 5 minutes passed -> 1 catch cycle
if (GameState.port.stock.length > 0) {
    console.log(`✅ Fish caught: ${GameState.port.stock.length}`);
} else {
    console.error('❌ No fish caught after 5 mins');
}

// Reset stock for catch test
GameState.port.stock = [];

// Test 2: Catch Filter Check (Max Rarity)
console.log('\n--- Test 2: Catch Filter ---');
// Unlock Rare fish (S rank), but ship max is C. Should NOT catch S.
GameState.encyclopedia['fish_rare'].caught = 1;

// Force simulate catch
const catchCount = PortManager.simulateCatch(GAME_DATA.SHIPS[0]);
console.log(`Caught: ${catchCount}`);
GameState.port.stock.forEach(fish => {
    if (fish.rarity === 'S') console.error('❌ Caught S rank fish with C rank ship!');
    else console.log(`✅ Caught ${fish.rarity} rank fish (OK)`);
});

// Test 3: Offline Compensation
console.log('\n--- Test 3: Offline Compensation ---');
// Set last time to 1 hour ago
const ONE_HOUR = 3600000;
GameState.port.lastProcessTime = Date.now() - ONE_HOUR;
GameState.port.fuelMinutes = 20; // Enough for 20 mins
GameState.port.stock = [];

PortManager.init();

// Log results
console.log(`Fuel: ${GameState.port.fuelMinutes} (Expected 0)`);
console.log(`Stock: ${GameState.port.stock.length} (Expected multiple catches)`);

if (GameState.port.fuelMinutes !== 0) console.error('❌ Fuel not fully consumed offline');
if (GameState.port.stock.length === 0) console.error('❌ No fish caught offline');

console.log('✨ PortManager Tests Completed');
