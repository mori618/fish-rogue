/**
 * Synthesis Verification Test
 */

// Mock localStorage for Node
global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { }
};
global.window = global;

const fs = require('fs');
const path = require('path');

// Mock necessary globals
global.UIManager = { showMessage: (msg) => console.log("UI Message:", msg) };

function loadScript(filePath) {
    const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
    // const を global. に置換してグローバル変数にする
    const name = filePath.split('/').pop().replace('.js', '');
    let modified = content;
    if (name === 'gameData') {
        modified = content.replace('const GAME_DATA =', 'global.GAME_DATA =');
    } else if (name === 'GameState') {
        modified = content.replace('const GameState =', 'global.GameState =');
    } else if (name === 'SaveManager') {
        modified = content.replace('const SaveManager =', 'global.SaveManager =');
    }
    eval(modified);
}

// データの読み込み
loadScript('data/gameData.js'); // global.GAME_DATA が定義される
loadScript('js/SaveManager.js'); // global.SaveManager が定義される
loadScript('js/GameState.js');  // global.GameState が定義される

function runTest() {
    console.log("=== Start Synthesis Test ===");

    // Reset State
    GameState.init();
    GameState.money = 100000;

    // 1. 同ランク合成テスト (Rank Up)
    console.log("\n1. Rank Up Test (Tier 3 -> Tier 4)");
    GameState.skillInventory['power_up_3'] = 2;
    const res1 = GameState.synthesizeSkills('power_up_3', 'power_up_3');
    console.log("Result:", res1.success ? "SUCCESS" : "FAILED", res1.message || "");
    if (res1.success) {
        console.log("Synthesized Skill:", res1.skill.name);
        console.log("Inventory power_up_4:", GameState.getSkillCount('power_up_4'));
    } else {
        process.exit(1);
    }

    // 2. 異名合成テスト (Hybrid)
    console.log("\n2. Hybrid Synthesis Test (Tier 3 + Tier 3)");
    GameState.skillInventory['gauge_slow_3'] = 1;
    GameState.skillInventory['price_up_3'] = 1;
    const res2 = GameState.synthesizeSkills('gauge_slow_3', 'price_up_3');
    console.log("Result:", res2.success ? "SUCCESS" : "FAILED", res2.message || "");
    if (res2.success) {
        console.log("Synthesized Hybrid:", res2.skill.name);
        console.log("ID:", res2.skill.id);
        console.log("Effects:", JSON.stringify(res2.skill.effect.effects));
        console.log("Inventory Hybrid:", GameState.getSkillCount(res2.skill.id));
    } else {
        process.exit(1);
    }

    // 3. 効果適用テスト
    console.log("\n3. Effect Application Test");
    const hybridId = res2.skill.id;
    GameState.equippedSkills = [hybridId];

    // ゲージ減速効果の確認
    const slowBonus = GameState.getGaugeSlowBonus();
    console.log("Gauge Slow Bonus:", slowBonus); // gauge_slow_3 = 0.3

    // 価格アップ効果の確認
    const priceBonus = GameState.getPriceBonus();
    console.log("Price Bonus:", priceBonus); // price_up_3 = 0.45

    if (Math.abs(slowBonus - 0.3) < 0.001 && Math.abs(priceBonus - 0.45) < 0.001) {
        console.log("Effect Application: SUCCESS");
    } else {
        console.log("Effect Application: FAILED");
        process.exit(1);
    }

    // 4. 重複効果の合算テスト
    console.log("\n4. Multi-Effect Aggregation Test");
    GameState.equippedSkills = ['power_up_4', hybridId]; // power_up_4 = +60
    const totalPower = GameState.getTotalPower();
    // Base power + power_up_4
    const rodPower = GameState.getCurrentRod().basePower;
    console.log("Expected Power:", rodPower + 60, "Actual:", totalPower);

    if (totalPower === rodPower + 60) {
        console.log("Aggregate Power: SUCCESS");
    } else {
        console.log("Aggregate Power: FAILED");
        process.exit(1);
    }

    // 5. 追加の極スキル検証 (rare_up_4, slot_expansion_4)
    console.log("\n5. New Tier 4 Expansion Test");

    // 幸運の星 極
    GameState.skillInventory['rare_up_3'] = 2;
    const res3 = GameState.synthesizeSkills('rare_up_3', 'rare_up_3');
    console.log("Synthesize rare_up_4:", res3.success ? "SUCCESS" : "FAILED");

    // スロット拡張 極
    GameState.skillInventory['slot_expansion_3'] = 2;
    const res4 = GameState.synthesizeSkills('slot_expansion_3', 'slot_expansion_3');
    console.log("Synthesize slot_expansion_4:", res4.success ? "SUCCESS" : "FAILED");

    if (res3.success && res4.success) {
        console.log("New Tier 4 Verification: SUCCESS");
    } else {
        console.log("New Tier 4 Verification: FAILED");
        process.exit(1);
    }

    console.log("\n=== Synthesis Test Finished SUCCESSFULLY ===");
}

runTest();
