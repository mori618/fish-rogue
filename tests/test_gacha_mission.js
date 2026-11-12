
describe('# Gacha System Logic', () => {

    it('Should return true if player has enough tickets', () => {
        GameState.gachaTickets = 1;
        GameState.money = 0;
        const result = GameState.canDrawGacha(100, 1);
        expect(result.can).toBe(true);
        expect(result.method).toBe('ticket');
    });

    it('Should return true if player has enough money (no tickets)', () => {
        GameState.gachaTickets = 0;
        GameState.money = 100;
        const result = GameState.canDrawGacha(100, 1);
        expect(result.can).toBe(true);
        expect(result.method).toBe('money');
    });

    it('Should return false if player has neither', () => {
        GameState.gachaTickets = 0;
        GameState.money = 0;
        const result = GameState.canDrawGacha(100, 1);
        expect(result.can).toBe(false);
    });

    it('Should consume tickets first', () => {
        GameState.gachaTickets = 2;
        GameState.money = 1000;
        const method = GameState.consumeGachaResources(100, 1);
        expect(method).toBe('ticket');
        expect(GameState.gachaTickets).toBe(1);
        expect(GameState.money).toBe(1000);
    });

    it('Should consume money if no tickets', () => {
        GameState.gachaTickets = 0;
        GameState.money = 1000;
        const method = GameState.consumeGachaResources(100, 1);
        expect(method).toBe('money');
        expect(GameState.money).toBe(900);
    });
});


describe('# Mission System Logic', () => {
    // Reset GameState and MissionManager before each test if possible,
    // or manually reset relevant variables.
    GameState.currentMissionIndex = 0;
    GameState.missionProgress = 0;

    it('Should start with the first mission (help)', () => {
        const text = MissionManager.getCurrentMissionText();
        expect(text.includes('ヘルプ')).toBe(true);
    });

    it('Should complete "help" mission on help_click', () => {
        GameState.currentMissionIndex = 0;
        MissionManager.checkMission('help_click');
        expect(GameState.currentMissionIndex).toBe(1);
        expect(MissionManager.getCurrentMissionText().includes('1匹釣る')).toBe(true);
    });

    it('Should complete "catch_1" mission on catch_success', () => {
        GameState.currentMissionIndex = 1;
        MissionManager.checkMission('catch_success');
        expect(GameState.currentMissionIndex).toBe(2);
        expect(MissionManager.getCurrentMissionText().includes('街へ行く')).toBe(true);
    });

    it('Should complete "go_town" mission on go_town', () => {
        GameState.currentMissionIndex = 2;
        MissionManager.checkMission('go_town');
        expect(GameState.currentMissionIndex).toBe(3);
    });

    it('Should complete "buy_bait" mission on buy_bait', () => {
        GameState.currentMissionIndex = 3;
        MissionManager.checkMission('buy_bait');
        expect(GameState.currentMissionIndex).toBe(4); // To catch_with_bait
    });

    it('Should NOT complete "catch_with_bait" if bait is D-rank', () => {
        GameState.currentMissionIndex = 4;
        MissionManager.checkMission('catch_success', { baitId: 'bait_d' });
        expect(GameState.currentMissionIndex).toBe(4);
    });

    it('Should complete "catch_with_bait" if bait is NOT D-rank', () => {
        GameState.currentMissionIndex = 4;

        // Mock UIManager.showMessage to avoid error
        const originalShowMessage = UIManager.showMessage;
        UIManager.showMessage = () => { };

        MissionManager.checkMission('catch_success', { baitId: 'bait_c' });

        expect(GameState.currentMissionIndex).toBe(5);
        expect(GameState.getSkillCount('power_up_1') > 0).toBe(true);

        UIManager.showMessage = originalShowMessage; // Restore
    });

    it('Should track progress for "catch_3" mission', () => {
        GameState.currentMissionIndex = 6;
        GameState.missionProgress = 0;

        // Mock UIManager.showMessage to avoid error
        const originalShowMessage = UIManager.showMessage;
        UIManager.showMessage = () => { };

        MissionManager.checkMission('catch_success');
        expect(GameState.missionProgress).toBe(1);
        expect(GameState.currentMissionIndex).toBe(6);

        MissionManager.checkMission('catch_success');
        expect(GameState.missionProgress).toBe(2);

        // Mock GameState.gachaTickets to check reward
        const initialTickets = GameState.gachaTickets;

        MissionManager.checkMission('catch_success');
        expect(GameState.currentMissionIndex).toBe(7); // Completed
        expect(GameState.gachaTickets).toBe(initialTickets + 5);

        UIManager.showMessage = originalShowMessage;
    });

});
