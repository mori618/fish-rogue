// Comprehensive Test Suite

// =================================================================
// Data Integrity Tests
// =================================================================
describe('Data Integrity (gameData.js)', () => {
    it('All RODS should have unique IDs', () => {
        const ids = GAME_DATA.RODS.map(r => r.id);
        const unique = new Set(ids);
        expect(ids.length).toBe(unique.size);
    });

    it('All SKINS should refer to valid ROD IDs', () => {
        const rodIds = GAME_DATA.RODS.map(r => r.id);
        GAME_DATA.SKINS.forEach(skin => {
            if (!skin.isGachaExclusive) {
                expect(rodIds).toContain(skin.rodId);
            }
        });
    });

    it('SKINS should have unique IDs', () => {
        const ids = GAME_DATA.SKINS.map(s => s.id);
        const unique = new Set(ids);
        expect(ids.length).toBe(unique.size);
    });
});

// =================================================================
// GameState Logic Tests
// =================================================================
describe('GameState Management', () => {
    it('Should initialize with default values', () => {
        // Clear mocks first to simulate fresh start
        localStorage.clear();
        GameState.init(null);

        expect(GameState.money).toBeGreaterThan(-1);
        expect(GameState.unlockedSkins).toContain('skin_default');
        expect(GameState.selectedSkin).toBe('skin_default');
    });

    it('Should save and load data correctly', () => {
        GameState.money = 9999;
        GameState.selectedSkin = 'skin_dummy';
        SaveManager.save(GameState);

        // Re-init from saved data
        const savedData = SaveManager.load();
        expect(savedData.player.money).toBe(9999);
        expect(savedData.player.selectedSkin).toBe('skin_dummy');
    });

    it('Should unlock skin when purchasing a rod', () => {
        // Reset
        GameState.init(null);
        GameState.money = 100000; // Give plenty of money

        const rodToBuy = GAME_DATA.RODS[1]; // Bamboo Rod
        const skinToUnlock = GAME_DATA.SKINS.find(s => s.rodId === rodToBuy.id);

        expect(GameState.unlockedRods).toContain(0); // Owns initial rod

        // Buy rod index 1
        const success = GameState.buyRod(1);

        expect(success).toBeTruthy();
        expect(GameState.unlockedRods).toContain(1);
        expect(GameState.unlockedSkins).toContain(skinToUnlock.id);
    });

    it('Should not equip locked skin', () => {
        GameState.init(null);
        const lockedSkinId = 'skin_legendary';

        const result = GameState.equipSkin(lockedSkinId);
        expect(result).toBeFalsy();
        expect(GameState.selectedSkin).toBe('skin_default');
    });

    it('Should equip unlocked skin', () => {
        GameState.init(null);
        const skin = 'skin_default'; // Already unlocked

        const result = GameState.equipSkin(skin);
        expect(result).toBeTruthy();
        expect(GameState.selectedSkin).toBe(skin);
    });
});

// =================================================================
// ShopManager Tests
// =================================================================
describe('ShopManager Logic', () => {
    it('Should detect sellable fish', () => {
        GameState.init(null);
        GameState.inventory = [];

        // Mock UIManager.showMessage to prevent errors or clutter
        const originalShowMessage = UIManager.showMessage;
        let messageOutput = '';
        UIManager.showMessage = (msg) => { messageOutput = msg; };

        // Try sell empty
        ShopManager.sellAllFish();
        expect(messageOutput).toBe('売る魚がありません');

        // Restore
        UIManager.showMessage = originalShowMessage;
    });

    it('Should calculate sell price correctly', () => {
        GameState.init(null);
        GameState.inventory = [
            { name: 'Fish1', price: 100 },
            { name: 'Fish2', price: 200 }
        ];

        // Mock UI updates
        UIManager.updateMoney = () => { };
        UIManager.updateInventory = () => { };
        UIManager.showMessage = () => { };
        ShopManager.renderShop = () => { };

        const initialMoney = GameState.money;
        ShopManager.sellAllFish();

        expect(GameState.money).toBe(initialMoney + 300);
        expect(GameState.inventory.length).toBe(0);
    });
});

// =================================================================
// Encyclopedia Tests
// =================================================================
describe('Encyclopedia Logic', () => {
    it('Should register new fish', () => {
        GameState.init(null);
        const fish = { id: 'test_fish', name: 'Test Fish' };

        EncyclopediaManager.registerCatch(fish);
        expect(GameState.encyclopedia['test_fish'].count).toBe(1);

        EncyclopediaManager.registerCatch(fish);
        expect(GameState.encyclopedia['test_fish'].count).toBe(2);
    });

    it('Should not count "common" or generic IDs if ignored', () => {
        // Depends on implementation, but assuming we track by ID
    });
});
// This file is executed in a sandbox where describe, it, expect are globals.

describe('Multi-Catch Skills', () => {

    it('should have 0 chance by default', () => {
        GameState.equippedSkills = [];
        expect(GameState.getMultiCatch2Chance()).toBe(0);
        expect(GameState.getMultiCatch3Chance()).toBe(0);
    });

    it('should calculate Dual Catcher chance correctly', () => {
        GameState.equippedSkills = ['dual_catcher_1'];
        expect(GameState.getMultiCatch2Chance()).toBe(0.10);

        GameState.equippedSkills = ['dual_catcher_2'];
        expect(GameState.getMultiCatch2Chance()).toBe(0.25);

        // Multiple skills
        GameState.equippedSkills = ['dual_catcher_1', 'dual_catcher_2'];
        expect(GameState.getMultiCatch2Chance()).toBe(0.35); // 0.10 + 0.25

        // Cap at 1.0 (though technically 0.35 is low, just verifying logic)
        // If we have enough to exceed 1.0
        GameState.equippedSkills = ['dual_catcher_3', 'dual_catcher_3', 'dual_catcher_1']; // 0.5 + 0.5 + 0.1 = 1.1 -> 1.0
        expect(GameState.getMultiCatch2Chance()).toBe(1.0);
    });

    it('should calculate Triple Catcher chance correctly', () => {
        GameState.equippedSkills = ['triple_catcher_1'];
        expect(GameState.getMultiCatch3Chance()).toBe(0.05);

        GameState.equippedSkills = ['triple_catcher_3'];
        expect(GameState.getMultiCatch3Chance()).toBe(0.30);
    });

});
