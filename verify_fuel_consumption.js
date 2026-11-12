
// Mock window and dependencies
global.window = {};

// Mock Game Data with modified fuel consumption
global.GAME_DATA = {
    SHIPS: [
        { id: 'ship_small', price: 1000, capacity: 5, catchAmountRange: [1, 2], maxRarity: 'C', fuelConsumption: 1 },
        { id: 'ship_medium', price: 10000, capacity: 20, catchAmountRange: [3, 5], maxRarity: 'B', fuelConsumption: 2 },
        { id: 'ship_large', price: 50000, capacity: 50, catchAmountRange: [5, 10], maxRarity: 'S', fuelConsumption: 3 }
    ],
    FISH: [
        { id: 'fish_common', rarity: 'D', weight: 1.0 }
    ],
    RARITY_WEIGHTS: { 'D': 1.0 }
};

// Mock GameState 
global.GameState = {
    port: {
        ownedShipId: 'ship_small',
        fuelMinutes: 100,
        stock: [],
        lastProcessTime: Date.now()
    },
    encyclopedia: {
        'fish_common': { caught: 1 }
    },
    getShipFuelEfficiency: () => 0, // No eco skill
    getShipIntervalMultiplier: () => 1.0, // Normal speed
    getShipAmountBonus: () => ({ min: 0, max: 0 })
};

// Mock UIManager
global.UIManager = {
    showMessage: (msg) => console.log(`[UI] ${msg}`)
};

// Load PortManager (assuming it's already modified, or we test the modification)
// We will reload it after modification
const fs = require('fs');
const path = require('path');
const portManagerPath = path.join(__dirname, 'js/PortManager.js');

// Helper to reload module
function loadPortManager() {
    delete require.cache[require.resolve(portManagerPath)];
    require(portManagerPath);
    return window.PortManager;
}

// Ensure we have the latest code
const PortManager = loadPortManager();

console.log('=== Starting Fuel Consumption Verification ===');

// Test Case 1: Small Ship (Consumption: 1)
console.log('\n--- Test 1: Small Ship (Consumption 1) ---');
GameState.port.ownedShipId = 'ship_small';
GameState.port.fuelMinutes = 100;
GameState.port.stock = [];
PortManager.fishingTimer = 0;
PortManager.minutesTimer = 0;

// Update 10 minutes (600,000 ms)
PortManager.updateMetric(600000);

// Expected: 100 - (10 * 1) = 90
if (GameState.port.fuelMinutes === 90) {
    console.log(`✅ Small Ship Fuel: 100 -> ${GameState.port.fuelMinutes} (Expected 90)`);
} else {
    console.error(`❌ Small Ship Fuel Failed: Expected 90, got ${GameState.port.fuelMinutes}`);
}


// Test Case 2: Medium Ship (Consumption: 2)
console.log('\n--- Test 2: Medium Ship (Consumption 2) ---');
GameState.port.ownedShipId = 'ship_medium';
GameState.port.fuelMinutes = 100;
GameState.port.stock = [];
PortManager.fishingTimer = 0;
PortManager.minutesTimer = 0;

// Update 10 minutes
PortManager.updateMetric(600000);

// Expected: 100 - (10 * 2) = 80
if (GameState.port.fuelMinutes === 80) {
    console.log(`✅ Medium Ship Fuel: 100 -> ${GameState.port.fuelMinutes} (Expected 80)`);
} else {
    console.error(`❌ Medium Ship Fuel Failed: Expected 80, got ${GameState.port.fuelMinutes}`);
}


// Test Case 3: Large Ship (Consumption: 3)
console.log('\n--- Test 3: Large Ship (Consumption 3) ---');
GameState.port.ownedShipId = 'ship_large';
GameState.port.fuelMinutes = 100;
GameState.port.stock = [];
PortManager.fishingTimer = 0;
PortManager.minutesTimer = 0;

// Update 10 minutes
PortManager.updateMetric(600000);

// Expected: 100 - (10 * 3) = 70
if (GameState.port.fuelMinutes === 70) {
    console.log(`✅ Large Ship Fuel: 100 -> ${GameState.port.fuelMinutes} (Expected 70)`);
} else {
    console.error(`❌ Large Ship Fuel Failed: Expected 70, got ${GameState.port.fuelMinutes}`);
}

// Test Case 4: Fuel Depletion Check
console.log('\n--- Test 4: Fuel Depletion ---');
GameState.port.ownedShipId = 'ship_large';
GameState.port.fuelMinutes = 5; // Less than needed for full run? No, just low
GameState.port.stock = [];
PortManager.fishingTimer = 0;
PortManager.minutesTimer = 0;

// Update 2 minutes (Consumption 3 * 2 = 6, but only have 5)
PortManager.updateMetric(120000);

if (GameState.port.fuelMinutes === 0) {
    console.log(`✅ Fuel Depletion: 5 -> ${GameState.port.fuelMinutes} (Expected 0)`);
} else {
    console.error(`❌ Fuel Depletion Failed: Expected 0, got ${GameState.port.fuelMinutes}`);
}

console.log('\n=== Verification Complete ===');
