const fs = require('fs');
const path = require('path');
const vm = require('vm');
const mocks = require('./mocks');

// ==========================================
// 1. Setup Environment
// ==========================================
const sandbox = {
    require: require,
    module: module,
    console: console,
    setTimeout: () => { }, // Disable async delays for simulation
    clearTimeout: () => { },
    setInterval: () => { },
    clearInterval: () => { },
    // Mock simple requestAnimationFrame for gauge logic if needed (or we bypass it)
    requestAnimationFrame: (cb) => cb(),
    cancelAnimationFrame: () => { }
};

// Apply Mocks
mocks.setup(sandbox);
vm.createContext(sandbox);

// ==========================================
// 2. Load Game Scripts
// ==========================================
const projectRoot = path.join(__dirname, '..');
const loadScript = (filePath) => {
    const fullPath = path.join(projectRoot, filePath);
    const code = fs.readFileSync(fullPath, 'utf8');
    vm.runInContext(code, sandbox, { filename: filePath });
};

console.log('Loading Game Data...');
loadScript('data/gameData.js');
loadScript('js/SaveManager.js');
loadScript('js/GameState.js');
// loadScript('js/FishingGame.js'); // We might use parts of it, or reimplement simplified logic for speed

// Access Sandbox Globals
const GAME_DATA = sandbox.window.GAME_DATA;
const GameState = sandbox.window.GameState;

// ==========================================
// 3. Simulation Logic
// ==========================================

console.log('\n=== ⚖️ GAME BALANCE ANALYSIS ===\n');

/**
 * Calculates win rate based on power difference and gauge config.
 * Simplified version of FishingGame logic.
 */
function calculateWinRate(playerPower, fishPower, rarity) {
    // 1. Check Power Check
    const isForcedBattle = ['A', 'S', 'SS'].includes(rarity);
    if (!isForcedBattle && playerPower >= fishPower) {
        return 1.0; // Instantly caught
    }

    // 2. Gauge Battle Simulation
    // We assume perfect play (always hitting red/green) or average play.
    // Let's assume user hits "Green" (Good) most of the time, "Red" (Perfect) sometimes.

    // Logic from FishingGame.startGaugeBattle & resolveCatch
    const rawRatio = playerPower / fishPower;
    const powerRatio = Math.min(0.99, rawRatio);

    // Determine typical zone catch rate
    // Green zone is the standard success zone?
    // Looking at GameData (loaded in sandbox, but we need to check structure)
    // We'll peek at GAUGE_CONFIG in the sandbox
    const config = GAME_DATA.GAUGE_CONFIG;

    // Simulate "Average User Capability"
    // Let's say user hits: Red 10%, Green 60%, White 30%
    const weights = { red: 0.1, green: 0.6, white: 0.3 };

    // Calculate expected catch rate per attempt
    let expectedRate = 0;

    ['red', 'green', 'white'].forEach(zone => {
        const zoneConfig = config.zones[zone];
        // Average the min/max random range
        let baseRate = (zoneConfig.catchRate.min + zoneConfig.catchRate.max) / 2;

        // Apply logic from resolveCatch (roughly)
        // Note: Code says `catchRate = base + GameState.getCatchBonus()`
        // We'll ignore skills for basic balance check
        expectedRate += baseRate * weights[zone];
    });

    // SS rank limitation: Must be Red
    if (rarity === 'SS') {
        // Only Red counts
        expectedRate = weights.red * ((config.zones.red.catchRate.min + config.zones.red.catchRate.max) / 2);
    }

    // Cap at 1.0
    return Math.min(1.0, expectedRate);
}

function simulateEconomy() {
    console.log('--- 💰 Economy Analysis (Profit per Catch) ---');
    console.log('Assumption: Average player skill (10% Red, 60% Green, 30% White)');

    // For each Rod Tier (assuming max stars for simplicity, or 0 stars?)
    // Let's check Rod 0 (Wood) vs Rank D Fish
    // Rod 1 (Bamboo) vs Rank C Fish, etc.

    const scenarios = [
        { rodIdx: 0, bait: 'bait_d', targetRarity: 'D' },
        { rodIdx: 0, bait: 'bait_c', targetRarity: 'C' }, // Stretching
        { rodIdx: 1, bait: 'bait_c', targetRarity: 'C' },
        { rodIdx: 2, bait: 'bait_b', targetRarity: 'B' },
        { rodIdx: 3, bait: 'bait_a', targetRarity: 'A' },
        { rodIdx: 4, bait: 'bait_s', targetRarity: 'S' }
    ];

    scenarios.forEach(sc => {
        // Setup State
        GameState.init(null);
        GameState.equipRod(sc.rodIdx);
        // Max upgrade? or base? Let's try Base first.
        const rod = GAME_DATA.RODS[sc.rodIdx];
        const playerPower = rod.basePower;

        const bait = GAME_DATA.BAITS.find(b => b.id === sc.bait);
        const baitCost = bait.price; // Cost per unit (assuming bulk logic isn't complex)
        // Wait, bait price is for a batch?
        // Let's check BAITS data structure
        // 'quantity' property exists
        const costPerCast = bait.price / bait.quantity;

        // Find average fish of that rarity
        const targetFish = GAME_DATA.FISH.filter(f => f.rarity === sc.targetRarity);
        if (targetFish.length === 0) return;

        const avgFishPower = targetFish.reduce((sum, f) => sum + f.power, 0) / targetFish.length;
        const avgFishPrice = targetFish.reduce((sum, f) => sum + (f.price || 0), 0) / targetFish.length;

        // Win Rate
        const winRate = calculateWinRate(playerPower, avgFishPower, sc.targetRarity);

        // Expected Value
        // EV = (WinRate * AvgPrice) - CostPerCast
        // Note: Bait is consumed on success usually? Or always?
        // Logic says: C/B rank bait not consumed on fail? 
        // Let's assume consumed on success for simplicity involved in 'profit per catch'

        // Consumption rate logic adjustment
        let consumptionRate = 1.0;
        if (sc.bait === 'bait_c' || sc.bait === 'bait_b') {
            // "Not consumed on fail" -> Consumed only on Win
            consumptionRate = winRate;
        }

        const expectedCost = costPerCast * consumptionRate;
        const expectedRevenue = winRate * avgFishPrice;
        const profit = expectedRevenue - expectedCost;

        console.log(`[${rod.name} vs Rank ${sc.targetRarity}]`);
        console.log(`  Power: ${playerPower} vs ${avgFishPower.toFixed(1)}`);
        console.log(`  Win Rate: ${(winRate * 100).toFixed(1)}%`);
        console.log(`  Cost/Cast: ¥${expectedCost.toFixed(1)} (Base: ¥${costPerCast.toFixed(1)})`);
        console.log(`  Avg Revenue: ¥${expectedRevenue.toFixed(1)}`);
        console.log(`  Profit/Cast: ¥${profit.toFixed(1)} ${profit > 0 ? '✅' : '❌'}`);
    });
    console.log('');
}

function simulateProgression() {
    console.log('--- 📈 Progression Pacing (Pure Grinding) ---');
    console.log('Calculating catches needed to buy next rod (assuming selling all fish).');

    // From Rod 0 -> Buy Rod 1
    // Strategy: Use efficient bait for current rod

    const steps = [
        { from: 0, to: 1, bait: 'bait_d', target: 'D' }, // Wood -> Bamboo
        { from: 1, to: 2, bait: 'bait_c', target: 'C' }, // Bamboo -> Carbon
        { from: 2, to: 3, bait: 'bait_b', target: 'B' }, // Carbon -> Titanium
        { from: 3, to: 4, bait: 'bait_a', target: 'A' }, // Titanium -> Legendary
    ];

    steps.forEach(step => {
        const currentRod = GAME_DATA.RODS[step.from];
        const nextRod = GAME_DATA.RODS[step.to];
        const targetMoney = nextRod.price;

        // Calculate Profit Per Cast for this strategy
        const playerPower = currentRod.basePower;
        const bait = GAME_DATA.BAITS.find(b => b.id === step.bait);
        const costPerCast = bait.price / bait.quantity;

        const targetFish = GAME_DATA.FISH.filter(f => f.rarity === step.target);
        const avgFishPower = targetFish.reduce((sum, f) => sum + f.power, 0) / targetFish.length;
        const avgFishPrice = targetFish.reduce((sum, f) => sum + (f.price || 0), 0) / targetFish.length;

        const winRate = calculateWinRate(playerPower, avgFishPower, step.target);
        const consumptionRate = (step.bait === 'bait_c' || step.bait === 'bait_b') ? winRate : 1.0;

        const profitPerCast = (winRate * avgFishPrice) - (costPerCast * consumptionRate);

        if (profitPerCast <= 0) {
            console.log(`${currentRod.name} -> ${nextRod.name}: Impossible (Negative Profit)`);
            return;
        }

        const catchesNeeded = Math.ceil(targetMoney / profitPerCast);
        const totalCatches = Math.ceil(catchesNeeded / winRate); // Total attempts

        console.log(`[${currentRod.name} -> ${nextRod.name}] (Target: ¥${targetMoney})`);
        console.log(`  Strategy: Fish Rank ${step.target} with ${bait.name}`);
        console.log(`  Profit/Attempt: ¥${profitPerCast.toFixed(1)}`);
        console.log(`  Attempts Needed: ${totalCatches} (~${(totalCatches * 10 / 60).toFixed(1)} min @ 10s/catch)`);
    });
}

// Run
simulateEconomy();
simulateProgression();
