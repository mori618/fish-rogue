const { describe, it, expect, runAll } = require('./test_framework.js');
const mocks = require('./mocks.js');

// モックのセットアップ
mocks.setup(global);

// ゲームスクリプトの読み込み
// 依存関係の順序に注意
require('../data/gameData.js');
require('../js/SaveManager.js');
require('../js/GameState.js');

describe('Sky Customization System', () => {

    it('should have SKIES data defined', () => {
        expect(window.GAME_DATA.SKIES).toBeDefined();
        expect(window.GAME_DATA.SKIES.length).toBeGreaterThan(0);
        expect(window.GAME_DATA.SKIES[0].id).toBe('sky_default');
    });

    it('should initialize GameState with default sky', () => {
        GameState.init(); // Reset state
        expect(GameState.unlockedSkies).toBeDefined();
        expect(GameState.unlockedSkies).toContain('sky_default');
        expect(GameState.selectedSky).toBe('sky_default');
        expect(GameState.getCurrentSky().id).toBe('sky_default');
    });

    it('should allow buying a sky if affordable', () => {
        GameState.init();
        GameState.money = 5000; // Give money

        const skyId = 'sky_night'; // Price 3000
        const result = GameState.buySky(skyId);

        expect(result).toBe(true);
        expect(GameState.money).toBe(2000); // 5000 - 3000
        expect(GameState.unlockedSkies).toContain(skyId);
    });

    it('should prevent buying a sky if too expensive', () => {
        GameState.init();
        GameState.money = 100; // Poor

        const skyId = 'sky_night'; // Price 3000
        const result = GameState.buySky(skyId);

        expect(result).toBe(false);
        expect(GameState.money).toBe(100);
        expect(GameState.unlockedSkies).not.toContain(skyId);
    });

    it('should prevent buying an already unlocked sky', () => {
        GameState.init();
        GameState.money = 5000;
        const skyId = 'sky_night';

        GameState.buySky(skyId); // Buy once
        const result = GameState.buySky(skyId); // Buy again

        expect(result).toBe(false);
        expect(GameState.money).toBe(2000); // Money shouldn't decrease twice
    });

    it('should allow equipping an unlocked sky', () => {
        GameState.init();
        GameState.money = 5000;
        const skyId = 'sky_night';
        GameState.buySky(skyId);

        const result = GameState.equipSky(skyId);

        expect(result).toBe(true);
        expect(GameState.selectedSky).toBe(skyId);
        expect(GameState.getCurrentSky().id).toBe(skyId);
    });

    it('should prevent equipping a locked sky', () => {
        GameState.init();
        const skyId = 'sky_golden'; // Not bought

        const result = GameState.equipSky(skyId);

        expect(result).toBe(false);
        expect(GameState.selectedSky).toBe('sky_default');
    });

    it('should save and load sky data correctly', () => {
        GameState.init();
        GameState.money = 10000;
        const skyId = 'sky_sunset';

        GameState.buySky(skyId);
        GameState.equipSky(skyId);

        // Save is automatic in buy/equip, but let's force a save check via mocking if needed,
        // or just re-init from saved data.
        // SaveManager.save(GameState) writes to localStorage mock.

        // Simulate reload
        const savedData = SaveManager.load();
        expect(savedData).toBeDefined();

        // Reset GameState and init from save
        GameState.init(savedData);

        expect(GameState.unlockedSkies).toContain(skyId);
        expect(GameState.selectedSky).toBe(skyId);
    });
});

runAll();
