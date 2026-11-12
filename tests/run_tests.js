const fs = require('fs');
const path = require('path');
const vm = require('vm');
const mocks = require('./mocks');
const framework = require('./test_framework');

// ==========================================
// 1. Setup Environment
// ==========================================
// Create a context for the game scripts to run in (simulating Global Scope)
const sandbox = {
    require: require,
    module: module,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    // Test Framework globals
    describe: framework.describe,
    it: framework.it,
    expect: framework.expect
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
    try {
        vm.runInContext(code, sandbox, { filename: filePath });
    } catch (e) {
        console.error(`Error loading script ${filePath}:`, e);
        process.exit(1);
    }
};

console.log('Loading Game Scripts...');
loadScript('data/gameData.js');
loadScript('js/SaveManager.js');
loadScript('js/GameState.js');
loadScript('js/EncyclopediaManager.js');
loadScript('js/MissionManager.js');
loadScript('js/CasinoManager.js');
// loadScript('js/UIManager.js'); // UIManager might cause issues if it tries to run code immediately.
// We'll load a mocked UIManager or load it if safe.
// Let's try loading it but we might need to overwrite UIManager in the sandbox if it relies heavily on DOM on init.
// For now, let's load it as we have DOM mocks.
loadScript('js/UIManager.js');
loadScript('js/ShopManager.js');
loadScript('js/FishingGame.js');

console.log('Game Scripts Loaded.\n');

// ==========================================
// 3. Load and Run Tests
// ==========================================
const testSuitePath = path.join(__dirname, 'test_suite.js');
const testSuiteCode = fs.readFileSync(testSuitePath, 'utf8');

try {
    vm.runInContext(testSuiteCode, sandbox, { filename: 'test_suite.js' });
} catch (e) {
    console.error(`Error running test suite:`, e);
    process.exit(1);
}

// Load Gacha & Mission Tests
const gachaTestPath = path.join(__dirname, 'test_gacha_mission.js');
const gachaTestCode = fs.readFileSync(gachaTestPath, 'utf8');

try {
    vm.runInContext(gachaTestCode, sandbox, { filename: 'test_gacha_mission.js' });
} catch (e) {
    console.error(`Error running gacha/mission tests:`, e);
    process.exit(1);
}

// Run the tests
framework.runAll();
