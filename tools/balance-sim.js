#!/usr/bin/env node
// バランス試算スクリプト
// data/gameData.js の ROGUE_CONFIG を読み、自動プレイで「各ラウンドをクリアできた航海の割合」を出す。
//
//   node tools/balance-sim.js            # 1,500航海 × 腕前3段階
//   node tools/balance-sim.js 5000       # 航海数を指定
//
// 試算に入っているもの: 餌のランク別の出現、パワー判定、ゲージバトル（腕前で赤・緑・白に止める割合）、
//   S以上の2連戦、赤ゾーンの下限、コンボ、支給餌、港での竿・餌の購入、余り餌とクリアボーナス
// 入っていないもの: 宝箱、フィーバー、称号付き、イベント、海域（常に沖合）、個別のスキル効果
//   → スキルは「標準ビルド＝ラウンドごとに売値+10%」の仮定で別に試算する
// 目標達成したらすぐ帰港する（評価は常に銅）ので、実際より少し厳しめの数字になる。

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

function battle(baitRank, fish, power, skill) {
    const r = Math.random();
    if (r < skill.red) return Math.random() < redRate(baitRank, fish, power);
    if (fish.rarity === 'SS') return false;
    if (r < skill.red + skill.green) return Math.random() < 0.4 + Math.random() * 0.2;
    return Math.random() < 0.1 + Math.random() * 0.1;
}

// 1投の結果（釣れたら魚、だめなら null）
function cast(baitRank, power, skill) {
    const w = SPAWN[baitRank];
    const rank = pickWeighted(Object.keys(w), k => w[k]);
    const fish = pickWeighted(byRank[rank], f => f.weight);
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

// 1航海。クリアしたラウンド数を返す
function playRun(skill, valueMult, maxRound) {
    const st = { money: 0, rod: 0, stars: 0, bait: { D: 0, C: 0, B: 0, A: 0, S: 0 } };
    const power = () => G.RODS[st.rod].basePower + G.RODS[st.rod].starPowerBonus * st.stars;

    for (let round = 1; round <= maxRound; round++) {
        const target = targetFor(round);
        const supply = rankOf(supplyFor(round));
        st.bait[supply] += CFG.baitPerRound;
        let earned = 0;
        let combo = 0;
        const p = power();
        const mult = valueMult(round);

        // 安い餌から使う
        for (const rank of RANKS) {
            while (st.bait[rank] > 0 && earned < target) {
                st.bait[rank]--;
                const fish = cast(rank, p, skill);
                if (fish) {
                    const comboBonus = Math.min(combo, CFG.combo.maxStacks) * CFG.combo.step;
                    earned += Math.floor(fish.price * mult * (1 + comboBonus));
                    combo++;
                } else {
                    combo = 0;
                }
            }
        }
        if (earned < target) return round - 1;

        const leftover = Math.min(CFG.baitPerRound, st.bait[supply]);
        st.bait[supply] -= leftover;
        st.money += earned + Math.floor(target * CFG.clearBonusRate) + leftover * CFG.leftoverBaitBonus * round;

        // 港: 所持金の半分までを竿に（パワー効率の良い方を優先）、残りで割の良い餌を買う
        let budget = st.money * 0.5;
        for (;;) {
            const up = st.stars < 5 ? CFG.rodUpgradeCosts[st.rod][st.stars] : Infinity;
            const next = G.RODS[st.rod + 1];
            const buy = next ? CFG.rodPrices[st.rod + 1] : Infinity;
            const upGain = G.RODS[st.rod].starPowerBonus / up;
            const buyGain = next ? (next.basePower - power()) / buy : 0;
            if (buyGain > upGain && buy <= budget && next.basePower > power()) {
                st.money -= buy; budget -= buy; st.rod++; st.stars = 0;
            } else if (up <= budget) {
                st.money -= up; budget -= up; st.stars++;
            } else if (buy <= budget && next && next.basePower > power()) {
                st.money -= buy; budget -= buy; st.rod++; st.stars = 0;
            } else break;
        }
        const p2 = power();
        const offers = CFG.baitShop
            .filter(b => b.fromRound <= round + 1)
            .map(b => ({ ...b, rank: rankOf(b.id), left: b.stock }))
            .map(b => ({ ...b, value: expectedPerCast(b.rank, p2, skill) * b.quantity * valueMult(round + 1) / b.price }))
            .sort((a, b) => b.value - a.value);
        for (const o of offers) {
            while (o.left > 0 && o.value > 1.1 && st.money >= o.price) {
                st.money -= o.price; st.bait[o.rank] += o.quantity; o.left--;
            }
        }
    }
    return maxRound;
}

function report(title, valueMult, runs) {
    const rounds = CFG.finalRound;
    console.log(`\n${title}`);
    console.log('腕前    ' + Array.from({ length: rounds }, (_, i) => `R${i + 1}`.padStart(6)).join(''));
    Object.entries(SKILL).forEach(([name, skill]) => {
        const reached = Array(rounds + 1).fill(0);
        for (let i = 0; i < runs; i++) {
            const cleared = playRun(skill, valueMult, rounds);
            for (let r = 1; r <= cleared; r++) reached[r]++;
        }
        const cells = reached.slice(1).map(c => `${Math.round(c / runs * 100)}%`.padStart(6)).join('');
        console.log(name.padEnd(5, '　') + cells);
    });
}

const runs = Number(process.argv[2]) || 1500;
console.log(`各ラウンドをクリアできた航海の割合（${runs}航海ずつ）`);
console.log(`目標額: ${CFG.targets.join(', ')}`);
report('■ スキルなし', () => 1, runs);
report('■ 標準ビルド（ラウンドごとに売値+10%と仮定）', r => 1 + 0.1 * (r - 1), runs);
