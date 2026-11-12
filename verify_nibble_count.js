// 検証スクリプト: ウキの揺れ回数の設定変更を検証する
const fs = require('fs');
const path = require('path');

// gameData.js をモック環境で読み込む
const gameDataContent = fs.readFileSync(path.join(__dirname, 'data/gameData.js'), 'utf8');

// window.GAME_DATA に代入する部分を抽出
const mockWindow = {};
eval(gameDataContent.replace('if (typeof window !== \'undefined\') {', 'if (true) {').replace('window.GAME_DATA = {', 'mockWindow.GAME_DATA = {'));

const config = mockWindow.GAME_DATA.FISHING_CONFIG;

console.log('--- 検証開始 ---');
console.log(`設定値: nibbleCountMin = ${config.nibbleCountMin}, nibbleCountMax = ${config.nibbleCountMax}`);

let success = true;

if (config.nibbleCountMin !== 1) {
    console.error(`FAIL: nibbleCountMin が 1 ではありません (${config.nibbleCountMin})`);
    success = false;
}

if (config.nibbleCountMax !== 3) {
    console.error(`FAIL: nibbleCountMax が 3 ではありません (${config.nibbleCountMax})`);
    success = false;
}

// シミュレーション: 1000回抽選して範囲内に収まるか確認
let minObserved = Infinity;
let maxObserved = -Infinity;

for (let i = 0; i < 1000; i++) {
    const count = config.nibbleCountMin + Math.floor(Math.random() * (config.nibbleCountMax - config.nibbleCountMin + 1));
    if (count < minObserved) minObserved = count;
    if (count > maxObserved) maxObserved = count;
}

console.log(`シミュレーション結果 (1000回): 最小 = ${minObserved}, 最大 = ${maxObserved}`);

if (minObserved < config.nibbleCountMin || maxObserved > config.nibbleCountMax) {
    console.error('FAIL: 抽選結果が設定範囲を超えています');
    success = false;
}

if (success) {
    console.log('--- 検証成功: すべてのチェックを通過しました ---');
} else {
    console.log('--- 検証失敗 ---');
    process.exit(1);
}
