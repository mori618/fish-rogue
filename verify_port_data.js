
// Mock window object
global.window = {};

// Load the game data
try {
    require('./data/gameData.js');
} catch (e) {
    console.error('Failed to load gameData.js:', e);
    process.exit(1);
}

// Verify SHIPS
console.log('--- Verifying SHIPS ---');
const ships = window.GAME_DATA.SHIPS;

if (!ships) {
    console.error('❌ SHIPS data not found in window.GAME_DATA');
    process.exit(1);
}

if (ships.length !== 3) {
    console.error(`❌ Expected 3 ships, found ${ships.length}`);
    process.exit(1);
}

const expectedShips = [
    { id: 'ship_small', capacity: 20, maxRarity: 'C', catchRange: [1, 3] },
    { id: 'ship_medium', capacity: 50, maxRarity: 'B', catchRange: [4, 8] },
    { id: 'ship_large', capacity: 150, maxRarity: 'S', catchRange: [10, 20] }
];

expectedShips.forEach((expect, index) => {
    const actual = ships[index];
    if (actual.id !== expect.id) console.error(`❌ Ship[${index}] ID mismatch: expected ${expect.id}, got ${actual.id}`);
    else if (actual.capacity !== expect.capacity) console.error(`❌ Ship[${index}] capacity mismatch: expected ${expect.capacity}, got ${actual.capacity}`);
    else if (actual.maxRarity !== expect.maxRarity) console.error(`❌ Ship[${index}] maxRarity mismatch: expected ${expect.maxRarity}, got ${actual.maxRarity}`);
    else if (actual.catchAmountRange[0] !== expect.catchRange[0] || actual.catchAmountRange[1] !== expect.catchRange[1]) console.error(`❌ Ship[${index}] catch range mismatch`);
    else if (actual.fishingInterval !== 300000) console.error(`❌ Ship[${index}] fishingInterval mismatch`);
    else console.log(`✅ ${actual.name} verified`);
});


// Verify FUELS
console.log('\n--- Verifying FUELS ---');
const fuels = window.GAME_DATA.FUELS;

if (!fuels) {
    console.error('❌ FUELS data not found in window.GAME_DATA');
    process.exit(1);
}

if (fuels.length !== 3) {
    console.error(`❌ Expected 3 fuels, found ${fuels.length}`);
    process.exit(1);
}

const expectedFuels = [
    { id: 'fuel_regular', recovery: 30 },
    { id: 'fuel_high', recovery: 60 },
    { id: 'fuel_max', recovery: 180 }
];

expectedFuels.forEach((expect, index) => {
    const actual = fuels[index];
    if (actual.id !== expect.id) console.error(`❌ Fuel[${index}] ID mismatch: expected ${expect.id}, got ${actual.id}`);
    else if (actual.recovery !== expect.recovery) console.error(`❌ Fuel[${index}] recovery mismatch: expected ${expect.recovery}, got ${actual.recovery}`);
    else console.log(`✅ ${actual.name} verified`);
});

console.log('\n✨ All Port Data Verification Passed!');
