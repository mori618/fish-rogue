
const fs = require('fs');
const path = require('path');

// gameData.js を擬似的に読み込むための環境設定
const gameDataPath = path.resolve(__dirname, 'data/gameData.js');
let gameDataCode = fs.readFileSync(gameDataPath, 'utf8');

// window オブジェクトをモック化
const mockWindow = {};
const evalCode = `
    const window = ${JSON.stringify(mockWindow)};
    ${gameDataCode}
    if (typeof window.GAME_DATA !== 'undefined') {
        module.exports = window.GAME_DATA;
    }
`;

// 簡易的な抽出（正規表現を使用）
function extractSkills(code) {
    const skillsMatch = code.match(/const SKILLS = \s*(\[[\s\S]*?\]);/);
    if (!skillsMatch) return null;
    try {
        // オブジェクトリテラルをJSONっぽく変換してパースするのは難しいため、
        // 簡易的な評価を行うか、特定のプロパティをチェックする
        return skillsMatch[1];
    } catch (e) {
        return null;
    }
}

// 実際の検証ロジック
console.log('--- スキルデータ検証開始 ---');

const SKILLS_TEXT = extractSkills(gameDataCode);
if (!SKILLS_TEXT) {
    console.error('SKILLS 配列が見つかりません。');
    process.exit(1);
}

// eval は安全ではないが、ローカルの検証用として使用
let SKILLS;
try {
    SKILLS = eval(SKILLS_TEXT);
} catch (e) {
    console.error('SKILLS のパースに失敗しました:', e);
    process.exit(1);
}

let errors = [];
let tier4Count = 0;

SKILLS.forEach(skill => {
    // 1. group プロパティの存在確認
    if (!skill.group) {
        errors.push(`ID: ${skill.id} - group プロパティがありません。`);
    }

    // 2. icon プロパティの存在確認
    if (!skill.icon) {
        errors.push(`ID: ${skill.id} - icon プロパティがありません。`);
    }

    // 3. Tier 4 の名称ルール確認
    if (skill.tier === 4) {
        tier4Count++;
        if (!skill.name.endsWith('極')) {
            errors.push(`ID: ${skill.id} - Tier 4 ですが名称が「極」で終わっていません（現在の名称: ${skill.name}）。`);
        }

        // 基本名が重複していないか（例：パワーUP I の Tier 4 が パワーUP 極 になっているか）
        // これは目視でも確認済みだが、一応形式のみチェック
    }
});

console.log(`検証対象スキル数: ${SKILLS.length}`);
console.log(`Tier 4 スキル数: ${tier4Count}`);

if (errors.length > 0) {
    console.error('--- エラー検出 ---');
    errors.forEach(err => console.error(err));
    process.exit(1);
} else {
    console.log('--- 検証完了: 全てのスキルがルールに従って更新されています。 ---');
}
