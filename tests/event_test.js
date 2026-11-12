// Event Logic Tests
describe('Event Logic', () => {
    // ========================================
    // Boat Event Tests
    // ========================================
    describe('Boat Event (Fever)', () => {
        it('should increment fever gauge in normal state', () => {
            // Reset GameState
            GameState.init(null);
            GameState.fever = { value: 0, isActive: false, type: 'sun' };

            // Mock visual updates
            UIManager.showBoatEvent = () => { };
            UIManager.updateFeverVisuals = () => { };
            UIManager.showEventMessage = () => { };
            UIManager.currentScreen = 'fishing';

            // Override global methods if needed or rely on mocked UIManager
            // FishingGame.triggerRandomEvent uses Math.random. 
            // We'll hijack Math.random to ensure Boat Event ( < 0.05 ).

            const originalRandom = Math.random;
            Math.random = () => 0.01; // 0.01 < 0.05 -> Boat

            FishingGame.triggerRandomEvent();

            expect(GameState.fever.value).toBe(1);
            expect(GameState.fever.isActive).toBeFalsy();

            Math.random = originalRandom;
        });

        it('should reset fever gauge to 6 in fever state', () => {
            // Setup Fever State
            GameState.init(null);
            GameState.fever = { value: 10, isActive: true, type: 'sun' };

            UIManager.showBoatEvent = () => { };
            UIManager.updateFeverVisuals = () => { };
            UIManager.showEventMessage = () => { };
            UIManager.currentScreen = 'fishing';

            const originalRandom = Math.random;
            Math.random = () => 0.01; // Force Boat

            FishingGame.triggerRandomEvent();

            expect(GameState.fever.value).toBe(6);
            expect(GameState.fever.isActive).toBeTruthy();

            Math.random = originalRandom;
        });
    });

    // ========================================
    // Bird Event Tests
    // ========================================
    describe('Bird Event (High Tier Guarantee)', () => {
        it('should set guaranteed flag', () => {
            GameState.init(null);
            GameState.fever = { isActive: false, value: 0, type: 'sun' }; // Ensure no fever
            GameState.highTierGuaranteed = false;

            UIManager.showBirdEvent = () => { };
            UIManager.showEventMessage = () => { };
            UIManager.currentScreen = 'fishing';

            const originalRandom = Math.random;
            Math.random = () => 0.06; // 0.05 <= 0.06 < 0.10 -> Bird

            FishingGame.triggerRandomEvent();

            expect(GameState.highTierGuaranteed).toBeTruthy();

            Math.random = originalRandom;
        });

        it('should select fish one rank higher than bait', () => {
            GameState.init(null);
            GameState.fever = { isActive: false, value: 0, type: 'sun' }; // Ensure no fever
            GameState.highTierGuaranteed = true;
            GameState.baitType = 'bait_c'; // C Rank Bait

            // Expected: One rank higher than C -> B
            // FishingGame.selectFish calls GameState methods, so those need to be available.
            // Ensure GAME_DATA is available (mock loaded in runner).

            const selectedFish = FishingGame.selectFish();

            expect(selectedFish.rarity).toBe('B');
            expect(GameState.highTierGuaranteed).toBeFalsy(); // Flag should be consumed
        });

        it('should select SS rank when bait is S', () => {
            GameState.init(null);
            GameState.fever = { isActive: false, value: 0, type: 'sun' }; // Ensure no fever
            GameState.highTierGuaranteed = true;
            GameState.baitType = 'bait_s'; // S Rank

            const selectedFish = FishingGame.selectFish();

            expect(selectedFish.rarity).toBe('SS');
            expect(GameState.highTierGuaranteed).toBeFalsy();
        });
    });
});
