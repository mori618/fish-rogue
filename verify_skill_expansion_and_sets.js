
// verify_skill_expansion_and_sets.js

// モック環境のセットアップ
if (typeof window === 'undefined') {
    global.window = global;
}

// LocalStorageのモック
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: function (key) {
            return store[key] || null;
        },
        setItem: function (key, value) {
            store[key] = value.toString();
        },
        removeItem: function (key) {
            delete store[key];
        },
        clear: function () {
            store = {};
        }
    };
})();

// グローバルスコープに定義
global.localStorage = localStorageMock;
global.window.localStorage = localStorageMock;
// Node環境でのReferenceError回避のため、globalにも紐付ける
Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true
});

// 必要なモジュールを読み込み
const fs = require('fs');
const path = require('path');

// ファイル読み込みヘルパー
function loadFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    eval(content);
}

// ゲームデータのロード
const projectRoot = __dirname;
loadFile(path.join(projectRoot, 'data/gameData.js'));
loadFile(path.join(projectRoot, 'js/SaveManager.js'));
loadFile(path.join(projectRoot, 'js/GameState.js'));

// テスト用ユーティリティ
function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        throw new Error(message);
    } else {
        console.log(`✅ PASSED: ${message}`);
    }
}

// メイン検証関数
function runTests() {
    console.log('=== Skill Sets and Slot Expansion Verification ===');

    // テスト1: スキルスロット拡張の検証
    console.log('\n--- Test 1: Skill Slot Expansion ---');
    GameState.init(); // 初期化

    // 基本スロット数 (Rod Rank 0, Star 0 -> 1 slot)
    const initialSlots = GameState.getSkillSlots();
    console.log(`Initial Slots: ${initialSlots}`);
    assert(initialSlots === 1, 'Initial slots should be 1');

    // スロット拡張スキル定義 (モック)
    const expansionSkillId = 'skill_slot_expansion_1';
    const expansionSkill = {
        id: expansionSkillId,
        name: 'Slot Expansion I',
        effect: { type: 'skill_slot_expansion', value: 1 },
        tier: 1
    };
    if (!GAME_DATA.SKILLS.find(s => s.id === expansionSkillId)) {
        GAME_DATA.SKILLS.push(expansionSkill);
    }

    // スキルを装備
    GameState.equippedSkills = [expansionSkillId];

    // GameState.getSkillSlots() に拡張ロジックが実装されているか確認
    const expandedSlots = GameState.getSkillSlots();
    console.log(`Expanded Slots (with +1 skill): ${expandedSlots}`);

    // 未実装なら 1 のまま、実装済みなら 2
    if (expandedSlots === 2) {
        console.log('✅ Skill slot expansion logic is implemented.');
    } else {
        console.log('⚠️ Skill slot expansion logic NOT implemented yet.');
    }

    // テスト2: スキルセット保存・復元の検証 (SaveManager)
    console.log('\n--- Test 2: Skill Sets Save/Load ---');

    // テストデータ
    const testSkillSets = [
        { name: 'Set A', skills: ['skill_A'] }
    ];

    // skillSetsプロパティがなければ追加(SaveManager.js修正後なら既にあるはず)
    GameState.skillSets = testSkillSets;

    // 保存
    SaveManager.save(GameState);

    // リセット & ロード
    GameState.init(); // リセット

    const loadedData = SaveManager.load();
    GameState.init(loadedData);

    console.log('Loaded Skill Sets:', JSON.stringify(GameState.skillSets));

    if (GameState.skillSets && GameState.skillSets.length === 1 && GameState.skillSets[0].name === 'Set A') {
        console.log('✅ Skill sets saved and loaded correctly.');
    } else {
        console.log('⚠️ Skill sets NOT saved/loaded correctly.');
    }

    // テスト3: 新規メソッド (saveCurrentSkillSet, canEquipSkillSet, applySkillSet)
    console.log('\n--- Test 3: Skill Set Methods ---');

    // メソッド存在チェック
    if (typeof GameState.saveCurrentSkillSet !== 'function') console.warn('⚠️ GameState.saveCurrentSkillSet is missing.');
    if (typeof GameState.canEquipSkillSet !== 'function') console.warn('⚠️ GameState.canEquipSkillSet is missing.');
    if (typeof GameState.applySkillSet !== 'function') console.warn('⚠️ GameState.applySkillSet is missing.');

    // 現在の装備を "My Best Set" として保存
    if (typeof GameState.saveCurrentSkillSet === 'function') {
        GameState.equippedSkills = ['power_up_1'];
        GameState.saveCurrentSkillSet('My Best Set');

        const savedSet = GameState.skillSets.find(s => s.name === 'My Best Set');
        assert(savedSet && savedSet.skills[0] === 'power_up_1', 'saveCurrentSkillSet should save current skills');
    }

    // 装備可能チェック
    if (typeof GameState.canEquipSkillSet === 'function') {
        // 所持スキルのモック
        GameState.skillInventory = {
            'power_up_1': 1,
            'rare_up_1': 1,
            'skill_slot_expansion_1': 1 // 拡張スキルも持っている
        };
        GameState.rodStarLevels = { 0: 0 }; // 1 slot (base)
        GameState.equippedSkills = [];

        // ケース1: スロット不足 (拡張なしで2枠装備)
        const check1 = GameState.canEquipSkillSet(['power_up_1', 'rare_up_1']);
        if (!check1.can && check1.reason) {
            console.log('✅ canEquipSkillSet correctly rejected due to slot limit.');
        } else {
            console.log(`⚠️ canEquipSkillSet failed to reject slot limit overflow. Result: ${JSON.stringify(check1)}`);
        }

        // ケース2: 拡張スキルを含むセット (1 + 1 = 2枠になるはず)
        // 拡張スキル + 別のスキル (計2個) -> 拡張後のスロット上限は2なのでOKになるはず
        const expansionSet = ['skill_slot_expansion_1', 'power_up_1'];
        const checkExpansion = GameState.canEquipSkillSet(expansionSet);
        if (checkExpansion.can) {
            console.log('✅ canEquipSkillSet correctly calculated slot expansion within the set.');
        } else {
            console.log(`⚠️ canEquipSkillSet failed to account for expansion skill in set. Reason: ${checkExpansion.reason}`);
        }

        // ケース3: 所持数不足 (詳細メッセージ確認)
        // 持っていないスキル2つ (合計2枠) -> スロットを確保してからチェック
        GameState.rodStarLevels = { 0: 1 }; // 2 slots (1 base + 1 star)
        const check2 = GameState.canEquipSkillSet(['unknown_skill_1', 'unknown_skill_2']);
        if (!check2.can && check2.reason.includes('unknown_skill_1') && check2.reason.includes('unknown_skill_2')) {
            console.log('✅ canEquipSkillSet returns detailed missing skills message.');
            console.log(`   Message: ${check2.reason.replace(/\n/g, ' ')}`);
        } else {
            console.log(`⚠️ canEquipSkillSet failed to return detailed missing skills. Result: ${JSON.stringify(check2)}`);
        }

        // ケース4: 成功
        const check3 = GameState.canEquipSkillSet(['power_up_1']);
        if (check3.can) {
            console.log('✅ canEquipSkillSet correctly accepted valid set.');
        } else {
            console.log(`⚠️ canEquipSkillSet rejected a valid set. Reason: ${check3.reason}`);
        }
    }

    // スキルセット適用
    if (typeof GameState.applySkillSet === 'function') {
        // 前提: skillSetsに 'My Best Set' (['power_up_1']) がある
        const setIndex = GameState.skillSets.findIndex(s => s.name === 'My Best Set');
        if (setIndex >= 0) {
            // 所有権確認
            GameState.skillInventory['power_up_1'] = 1;

            const result = GameState.applySkillSet(setIndex);
            if (result.success && GameState.equippedSkills.includes('power_up_1')) {
                console.log('✅ applySkillSet successfully equipped skills.');
            } else {
                console.log(`⚠️ applySkillSet failed to apply skills. Result: ${JSON.stringify(result)}`);
            }
        } else {
            console.log('⚠️ Could not find "My Best Set" for testing applySkillSet.');
        }
    }

    console.log('\n--- Verification Complete ---');
}

try {
    runTests();
} catch (error) {
    console.error('\n🛑 Test Suite Failed', error);
    process.exit(1);
}
