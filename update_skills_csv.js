
const fs = require('fs');
const path = require('path');

// gameData.js のパス
const gameDataPath = path.resolve(__dirname, 'data/gameData.js');
const csvPath = path.resolve(__dirname, 'game_data_csv/skills.csv');

// gameData.js を読み込む
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
    return skillsMatch[1];
}

console.log('--- CSV更新開始 ---');

const SKILLS_TEXT = extractSkills(gameDataCode);
if (!SKILLS_TEXT) {
    console.error('SKILLS 配列が見つかりません。');
    process.exit(1);
}

// SKILLS をパース
let SKILLS;
try {
    SKILLS = eval(SKILLS_TEXT);
} catch (e) {
    console.error('SKILLS のパースに失敗しました:', e);
    process.exit(1);
}

// グループの表示順序定義
const GROUP_ORDER = [
    '特殊スキル',
    '強化グループ',
    '商売グループ',
    '技術グループ',
    '捕獲グループ',
    '探索グループ',
    '宝物グループ', // gameData.jsでは「宝物グループ」になっていることを確認（前回のTool Output参照）
    '特殊効果グループ',
    '成長グループ',
    '便利グループ',
    '収集ボーナス'
];

// ソート関数
SKILLS.sort((a, b) => {
    // 1. グループ順
    const groupA = GROUP_ORDER.indexOf(a.group);
    const groupB = GROUP_ORDER.indexOf(b.group);

    // 定義外のグループは最後にする
    const orderA = groupA === -1 ? 999 : groupA;
    const orderB = groupB === -1 ? 999 : groupB;

    if (orderA !== orderB) {
        return orderA - orderB;
    }

    // 2. ID順 (効果種別ごとに固まるように)
    // Tierでソートしてしまうと、Tier1が全部先に来てしまうので、ID順のみにする
    // IDは基本的に base_name_tier の形式なので、ID順＝種別順かつTier順になる
    return a.id.localeCompare(b.id);
});

// CSVヘッダー
const headers = ['ID', '名前', 'Tier', '価格', '効果タイプ', '効果値', '説明', 'グループ', 'アイコン'];

// CSV行生成
const rows = SKILLS.map(skill => {
    // 効果値の抽出: effectオブジェクトから主要な値を一つ取り出す簡易ロジック
    // gameData.jsのeffect構造は多様なので、'value'があればそれ、なければ空文字か代表的なプロパティ
    let effectValue = '';
    if (skill.effect.value !== undefined) {
        effectValue = skill.effect.value;
    } else if (skill.effect.power !== undefined) {
        effectValue = skill.effect.power; // ultimate_risk, godly_power
    } else if (skill.effect.catch !== undefined) {
        effectValue = skill.effect.catch; // master_angler
    } else if (skill.effect.charge !== undefined) {
        effectValue = skill.effect.charge; // eternal_fever
    } else if (skill.effect.min !== undefined) {
        effectValue = `${skill.effect.min}-${skill.effect.max}`; // ship_amount_up
    } else if (skill.effect.minRarity !== undefined) {
        effectValue = skill.effect.minRarity; // rank_sniper
    }

    return [
        skill.id,
        skill.name,
        skill.tier,
        skill.price,
        skill.effect.type,
        effectValue,
        `"${skill.description}"`, // 説明はカンマを含む可能性があるのでダブルクォート
        skill.group || '',
        skill.icon || ''
    ].join(',');
});

// CSV書き込み
const csvContent = headers.join(',') + '\n' + rows.join('\n');
fs.writeFileSync(csvPath, csvContent, 'utf8');

console.log(`CSVファイルを更新しました: ${csvPath}`);
console.log(`全 ${rows.length} 行のスキルデータを書き込みました。`);
