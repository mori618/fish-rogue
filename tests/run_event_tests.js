const fs = require('fs');
const path = require('path');
const vm = require('vm');
const mocks = require('./mocks');
const framework = require('./test_framework');

const sandbox = {
    require: require,
    module: module,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    describe: framework.describe,
    it: framework.it,
    expect: framework.expect
};

mocks.setup(sandbox);
vm.createContext(sandbox);

const projectRoot = path.join(__dirname, '..');
const loadScript = (filePath) => {
    const fullPath = path.join(projectRoot, filePath);
    const code = fs.readFileSync(fullPath, 'utf8');
    vm.runInContext(code, sandbox, { filename: filePath });
};

console.log('Loading Game Scripts...');
loadScript('data/gameData.js');
loadScript('js/SaveManager.js');
loadScript('js/GameState.js');
loadScript('js/EncyclopediaManager.js');
loadScript('js/UIManager.js');
loadScript('js/ShopManager.js');
loadScript('js/FishingGame.js'); // Contains the event logic

console.log('Running Event Tests...');
const testCode = fs.readFileSync(path.join(__dirname, 'event_test.js'), 'utf8');
vm.runInContext(testCode, sandbox);

framework.runAll();
