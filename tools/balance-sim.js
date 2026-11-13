#!/usr/bin/env node
// バランス試算スクリプト
// data/gameData.js の ROGUE_CONFIG を読み、自動プレイで「各ラウンドをクリアできた航海の割合」を出す。
//
//   node tools/balance-sim.js            # 1,500航海 × 腕前3段階
//   node tools/balance-sim.js 5000       # 航海数を指定
//
// 試算に入っているもの: 餌のランク別の出現、パワー判定、ゲージバトル（腕前で赤・緑・白に止める割合）、
//   S以上の2連戦、赤ゾーンの下限、コンボ、支給餌、釣り宿での竿・餌の購入、余り餌とクリアボーナス、
//   竿のタイプ（パワー・赤に止める割合・コンボ上限・価格の近似）、釣り場のよく釣れる魚と本日の高値、
//   天候の目標倍率と売値、ヌシ戦（R3/R6/R9/R10、6投目から、3連戦、パワー1.5倍）、荒波レベル
// 入っていないもの: 宝箱、フィーバー、称号付き（ヌシ以外）、イベント、特殊餌、系統ボーナス、個別のスキル効果
//   → スキルは「標準ビルド＝ラウンドごとに売値+10%」の仮定で別に試算する
// 目標達成したらすぐ宿へ戻る（評価は常に銅）ので、実際より少し厳しめの数字になる。
//
//   node tools/balance-sim.js 1500 strong   # 竿のタイプを指定（all / strong / soft / quick / probe）
//   node tools/balance-sim.js 1500 all 2    # 荒波レベルを指定

const fs = require('fs');
const path = require('path');

global.window = {};
eval(fs.readFileSync(path.join(__dirname, '..', 'data', 'gameData.js'), 'utf8'));
const G = window.GAME_DATA;
const CFG = G.ROGUE_CONFIG;

const SPAWN = {
    D: { D: 0.9, C: 0.1, S: 0.01 },
    C: { C: 0.8, D: 0.2, B: 0.1 },
    B: { B: 0.8, C: 0.2, D: 0.1, A: 0.05 },
    A: { A: 0.6, B: 0.4, C: 0.2, S: 0.05 },
    S: { A: 0.6, S: 0.2, B: 0.2, SS: 0.033 }
};
const RANK_INDEX = { D: 0, C: 1, B: 2, A: 3, S: 4, SS: 5 };
const RANKS = ['D', 'C', 'B', 'A', 'S'];

// 腕前: ゲージを赤・緑に止める割合（残りは白）と、ヒットを逃す割合
const SKILL = {
    '初心者': { red: 0.25, green: 0.35, miss: 0.15 },
    '標準': { red: 0.45, green: 0.35, miss: 0.07 },
    '上級者': { red: 0.70, green: 0.22, miss: 0.03 }
};

// 竿のタイプの近似: パワー倍率、赤に止める割合の増減（ゲージの速さ・赤の幅）、コンボ上限、売値、竿の値段
const ROD_TYPES = {
    all: { power: 1.0, red: 0, combo: 0, price: 1.0, cost: 0.8 },
    strong: { power: 1.2, red: -0.06, combo: 0, price: 1.0, cost: 1.0 },
    soft: { power: 0.85, red: 0.1, combo: 0, price: 1.0, cost: 1.0 },
    quick: { power: 0.9, red: 0, combo: 2, price: 1.0, cost: 1.0 },
    probe: { power: 1.0, red: 0, combo: 0, price: 0.9 + 0.05, cost: 1.0 }  // 宝箱+5%の分を売値+5%で近似
};

const byRank = {};
G.FISH.forEach(f => (byRank[f.rarity] = byRank[f.rarity] || []).push(f));

const pickWeighted = (items, weightOf) => {
    let total = 0;
    items.forEach(i => total += weightOf(i));
    let r = Math.random() * total;
    for (const i of items) {
        r -= weightOf(i);
        if (r < 0) return i;
    }
    return items[0];
};

const rankOf = baitId => baitId.slice(-1).toUpperCase();

function redRate(baitRank, fish, power) {
    const diff = RANK_INDEX[fish.rarity] - RANK_INDEX[baitRank];
    let base = 0.9;
    if (diff === 1) base = 0.8;
    else if (diff === 2) base = 0.6;
    else if (diff >= 3) base = 0.4;
    const penalty = Math.max(0, fish.power - power) / Math.max(1, power) * 0.5;
    return Math.max(base - penalty, CFG.redZoneFloor);
}

function battle(baitRank, fish, power, skill, speedUp = 0) {
    const r = Math.random() * (1 + speedUp);  // ゲージが速いほど赤に止めにくい
    if (r < skill.red) return Math.random() < redRate(baitRank, fish, power);
    if (fish.rarity === 'SS') return false;
    if (r < skill.red + skill.green) return Math.random() < 0.4 + Math.random() * 0.2;
    return Math.random() < 0.1 + Math.random() * 0.1;
}

// 1投の結果（釣れたら魚、だめなら null）
//   favored: その釣り場でよく釣れる魚のID
function cast(baitRank, power, skill, favored = []) {
    const w = SPAWN[baitRank];
    const rank = pickWeighted(Object.keys(w), k => w[k]);
    const fish = pickWeighted(byRank[rank], f => f.weight * (favored.includes(f.id) ? CFG.favoredWeight : 1));
    if (Math.random() < skill.miss) return null;
    const forced = ['A', 'S', 'SS'].includes(rank);
    if (power >= fish.power && !forced) return fish;
    if (!battle(baitRank, fish, power, skill)) return null;
    if (['S', 'SS'].includes(rank) && !battle(baitRank, fish, power, skill)) return null;
    return fish;
}

function expectedPerCast(baitRank, power, skill, n = 400) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
        const fish = cast(baitRank, power, skill);
        if (fish) sum += fish.price;
    }
    return sum / n;
}

const supplyFor = round => {
    let id = CFG.supplyBait[0].id;
    CFG.supplyBait.forEach(e => { if (round >= e.from) id = e.id; });
    return id;
};

const targetFor = round => round <= CFG.targets.length
    ? CFG.targets[round - 1]
    : CFG.targets[CFG.targets.length - 1] * Math.pow(CFG.endlessGrowth, round - CFG.targets.length);

const regionFor = round => {
    let region = CFG.regions[0];
    CFG.regions.forEach(r => { if (round >= r.from) region = r; });
    return region;
};

// 荒波レベルの条件
function ascensionRules(level) {
    const rules = { targetMult: 1, supplyDelta: 0, stockDelta: 0 };
    CFG.ascension.filter(a => a.level <= level).forEach(a => {
        if (a.targetMult) rules.targetMult += a.targetMult;
        if (a.supplyDelta) rules.supplyDelta += a.supplyDelta;
        if (a.stockDelta) rules.stockDelta += a.stockDelta;
    });
    return rules;
}

// ヌシ: 支給餌より1つ上のランクの魚。パワーは powerMult 倍、3連戦で速くなる
function nushiFor(round) {
    const supply = rankOf(supplyFor(round));
    const order = ['D', 'C', 'B', 'A', 'S', 'SS'];
    const rank = order[Math.min(order.indexOf(supply) + 1, 4)];
    const base = byRank[rank][Math.floor(Math.random() * byRank[rank].length)];
    return { ...base, power: Math.round(base.power * CFG.nushi.powerMult), price: base.price * CFG.nushi.priceMult, won: 0 };
}

// 勝った連戦は次の一投に持ち越す（ヌシの体力が減ったまま）
function fightNushi(nushi, baitRank, power, skill) {
    while (nushi.won < CFG.nushi.phases) {
        if (!battle(baitRank, nushi, power, skill, CFG.nushi.speedStep * nushi.won)) return false;
        nushi.won++;
    }
    return true;
}

// 1航海。クリアしたラウンド数を返す
function playRun(skillBase, valueMult, maxRound, rodTypeId = 'all', ascension = 0) {
    const type = ROD_TYPES[rodTypeId];
    const skill = { ...skillBase, red: Math.max(0.05, skillBase.red + type.red) };
    const rules = ascensionRules(ascension);
    const st = { money: 0, rod: 0, stars: 0, bait: { D: 0, C: 0, B: 0, A: 0, S: 0 } };
    const power = () => Math.round((G.RODS[st.rod].basePower + G.RODS[st.rod].starPowerBonus * st.stars) * type.power);
    const supplyCount = Math.max(1, CFG.baitPerRound + rules.supplyDelta);

    for (let round = 1; round <= maxRound; round++) {
        // 釣り場と天候は釣り宿でランダムに3つ並ぶ。目標の低い（得な）ものを選ぶ
        const region = regionFor(round);
        const offers = region.spots.map(spot => ({
            spot,
            weather: round === 1 ? CFG.weathers[0] : CFG.weathers[Math.floor(Math.random() * CFG.weathers.length)],
            high: spot.fish[Math.floor(Math.random() * spot.fish.length)]
        }));
        const offer = offers.reduce((a, b) => (b.weather.targetMult < a.weather.targetMult ? b : a));
        const weatherPrice = 1 + offer.weather.effects.filter(e => e.type === 'price_boost').reduce((a, e) => a + e.value, 0);
        const target = targetFor(round) * offer.weather.targetMult * rules.targetMult;
        const supply = rankOf(supplyFor(round));
        st.bait[supply] += supplyCount;
        let earned = 0;
        let combo = 0;
        let casts = 0;
        const p = power();
        const mult = valueMult(round) * weatherPrice * type.price;
        const isNushi = CFG.nushi.rounds.includes(round);
        const nushi = isNushi ? nushiFor(round) : null;
        let nushiCaught = !isNushi;

        // 安い餌から使う（ヌシのラウンドは6投目からヌシがかかる）
        for (const rank of RANKS) {
            while (st.bait[rank] > 0 && (earned < target || !nushiCaught)) {
                st.bait[rank]--;
                casts++;
                let fish;
                if (!nushiCaught && casts >= CFG.nushi.fromCast) {
                    fish = Math.random() < skill.miss ? null : (fightNushi(nushi, rank, p, skill) ? nushi : null);
                    if (fish) nushiCaught = true;
                } else {
                    fish = cast(rank, p, skill, offer.spot.fish);
                }
                if (fish) {
                    const comboBonus = Math.min(combo, CFG.combo.maxStacks + type.combo) * CFG.combo.step;
                    const high = fish.id === offer.high ? CFG.highValueMult : 1;
                    earned += Math.floor(fish.price * high * mult * (1 + comboBonus));
                    combo++;
                } else {
                    combo = 0;
                }
            }
        }
        if (earned < target || !nushiCaught) return round - 1;

        const leftover = Math.min(supplyCount, st.bait[supply]);
        st.bait[supply] -= leftover;
        st.money += earned + Math.floor(target * CFG.clearBonusRate) + leftover * CFG.leftoverBaitBonus * round;

        // 釣り宿: 所持金の半分までを竿に（パワー効率の良い方を優先）、残りで割の良い餌を買う
        let budget = st.money * 0.5;
        for (;;) {
            const up = st.stars < 5 ? CFG.rodUpgradeCosts[st.rod][st.stars] : Infinity;
            const next = G.RODS[st.rod + 1];
            const buy = next ? CFG.rodPrices[st.rod + 1] * type.cost : Infinity;
            const upGain = G.RODS[st.rod].starPowerBonus / up;
            const buyGain = next ? (next.basePower - power() / type.power) / buy : 0;
            if (buyGain > upGain && buy <= budget && next.basePower * type.power > power()) {
                st.money -= buy; budget -= buy; st.rod++; st.stars = 0;
            } else if (up <= budget) {
                st.money -= up; budget -= up; st.stars++;
            } else if (buy <= budget && next && next.basePower * type.power > power()) {
                st.money -= buy; budget -= buy; st.rod++; st.stars = 0;
            } else break;
        }
        const p2 = power();
        const shop = CFG.baitShop
            .filter(b => b.fromRound <= round + 1)
            .map(b => ({ ...b, rank: rankOf(b.id), left: Math.max(1, b.stock + rules.stockDelta) }))
            .map(b => ({ ...b, value: expectedPerCast(b.rank, p2, skill) * b.quantity * valueMult(round + 1) / b.price }))
            .sort((a, b) => b.value - a.value);
        for (const o of shop) {
            while (o.left > 0 && o.value > 1.1 && st.money >= o.price) {
                st.money -= o.price; st.bait[o.rank] += o.quantity; o.left--;
            }
        }
    }
    return maxRound;
}

function report(title, valueMult, runs, rodTypeId = 'all', ascension = 0) {
    const rounds = CFG.finalRound;
    console.log(`\n${title}`);
    console.log('腕前    ' + Array.from({ length: rounds }, (_, i) => `R${i + 1}`.padStart(6)).join(''));
    Object.entries(SKILL).forEach(([name, skill]) => {
        const reached = Array(rounds + 1).fill(0);
        for (let i = 0; i < runs; i++) {
            const cleared = playRun(skill, valueMult, rounds, rodTypeId, ascension);
            for (let r = 1; r <= cleared; r++) reached[r]++;
        }
        const cells = reached.slice(1).map(c => `${Math.round(c / runs * 100)}%`.padStart(6)).join('');
        console.log(name.padEnd(5, '　') + cells);
    });
}

const runs = Number(process.argv[2]) || 1500;
const rodArg = process.argv[3] || 'all';
const ascArg = Number(process.argv[4]) || 0;
console.log(`各ラウンドをクリアできた釣り旅の割合（${runs}回ずつ、竿: ${rodArg}、荒波: ${ascArg}）`);
console.log(`目標額: ${CFG.targets.join(', ')}`);
report('■ スキルなし', () => 1, runs, rodArg, ascArg);
report('■ 標準ビルド（ラウンドごとに売値+10%と仮定）', r => 1 + 0.1 * (r - 1), runs, rodArg, ascArg);
if (process.argv[3] === undefined) {
    console.log('\n■ 竿のタイプ別（標準ビルド・標準の腕前）');
    Object.keys(ROD_TYPES).forEach(id => {
        let r10 = 0;
        let r5 = 0;
        for (let i = 0; i < runs; i++) {
            const c = playRun(SKILL['標準'], r => 1 + 0.1 * (r - 1), CFG.finalRound, id);
            if (c >= 5) r5++;
            if (c >= 10) r10++;
        }
        console.log(`${id.padEnd(7)} R5 ${Math.round(r5 / runs * 100)}%  R10 ${Math.round(r10 / runs * 100)}%`);
    });
}
