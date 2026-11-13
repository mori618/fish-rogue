// ゲーム状態管理
// 1回の釣り旅（ラン）中のプレイヤー状態を一元管理する。
// ラウンド進行そのものは RunManager が担当する。

const GameState = {
    // ========================================
    // 基本ステータス
    // ========================================
    money: 0,
    baitInventory: {},   // { bait_d: 10, bait_c: 3, ... } すべて有限
    baitType: 'bait_d',

    // ランク（旧仕様の互換用。ローグライト版では常に1）
    rank: 1,

    // ========================================
    // 釣り旅（ラン）の進行状況
    // ========================================
    run: null,  // { round, target, earned, phase, offers, ... } 詳細は RunManager.createRun

    // ========================================
    // 釣り竿の状態
    // ========================================
    rodRankIndex: 0,      // 竿の素材（RODS のインデックス）
    rodType: 'all',       // 竿のタイプ（ROGUE_CONFIG.rodTypes の id）
    rodStarLevels: {},  // 竿インデックスごとの星数 { 0: 2, 1: 0 }
    unlockedRods: [0],
    equippedSkills: [],
    skillInventory: {}, // IDごとの所持数 { "power_up_1": 2 }
    customSkills: {},   // 互換用（合成スキル。ローグライト版では未使用）

    get rodStars() {
        return this.rodStarLevels[this.rodRankIndex] || 0;
    },

    set rodStars(value) {
        this.rodStarLevels[this.rodRankIndex] = value;
    },

    // ========================================
    // イベント・見た目
    // ========================================
    highTierGuaranteed: false, // 鳥イベント用：次回上位魚確定フラグ
    selectedSky: 'sky_default',

    // 旧仕様の互換用（所持魚・チケットに依存するスキル計算が参照する）
    inventory: [],
    gachaTickets: 0,

    // ========================================
    // 図鑑（釣り旅をまたいで引き継ぐ）
    // ========================================
    encyclopedia: {},

    // ========================================
    // この釣り旅の統計
    // ========================================
    totalFishCaught: 0,
    caughtByRank: { 'D': 0, 'C': 0, 'B': 0, 'A': 0, 'S': 0, 'SS': 0 },
    totalTreasure: 0,
    totalMoneyEarned: 0,
    biggestFish: null,

    // ========================================
    // フィーバー状態
    // ========================================
    fever: {
        isActive: false,   // フィーバー中かどうか (gauge >= 6)
        value: 0,          // 現在のゲージ値 (0-12)
        type: null         // 'sun' (太陽) or 'moon' (月)
    },

    // ========================================
    // 初期化
    // saveData があれば中断した釣り旅を復元、なければ新しい釣り旅用にリセット
    // ========================================
    init(saveData = null) {
        const s = saveData || {};

        this.money = s.money || 0;
        this.baitInventory = { bait_d: 0, bait_c: 0, bait_b: 0, bait_a: 0, bait_s: 0, ...(s.baitInventory || {}) };
        this.baitType = s.baitType || 'bait_d';
        this.rank = 1;
        this.run = s.run ? JSON.parse(JSON.stringify(s.run)) : null;

        this.rodRankIndex = s.rodRankIndex || 0;
        this.rodType = s.rodType || 'all';
        this.rodStarLevels = { 0: 0, ...(s.rodStarLevels || {}) };
        this.unlockedRods = [...(s.unlockedRods || [0])];
        this.equippedSkills = [...(s.equippedSkills || [])];
        this.skillInventory = { ...(s.skillInventory || {}) };
        this.customSkills = {};

        this.highTierGuaranteed = false;
        this.selectedSky = s.selectedSky || 'sky_default';
        this.inventory = [];
        this.gachaTickets = 0;

        // 図鑑は釣り旅をまたぐメタデータから読む
        this.encyclopedia = { ...SaveManager.loadMeta().encyclopedia };

        this.totalFishCaught = s.totalFishCaught || 0;
        this.caughtByRank = { 'D': 0, 'C': 0, 'B': 0, 'A': 0, 'S': 0, 'SS': 0, ...(s.caughtByRank || {}) };
        this.totalTreasure = s.totalTreasure || 0;
        this.totalMoneyEarned = s.totalMoneyEarned || 0;
        this.biggestFish = s.biggestFish || null;

        this.fever = { isActive: false, value: 0, type: null, ...(s.fever || {}) };
    },

    // ========================================
    // お金
    // 釣り中に得たお金はすべてラウンドの水揚げ額にも加算される
    // ========================================
    addMoney(amount) {
        this.money += amount;
        if (amount > 0) {
            this.totalMoneyEarned += amount;
            if (this.run && this.run.phase === 'fishing') {
                this.run.earned += amount;
            }
        }
    },

    spendMoney(amount) {
        if (this.money < amount) return false;
        this.money -= amount;
        return true;
    },

    // ========================================
    // スキルスロット数
    // 基本値 + 竿の購入・星強化の累計 + 拡張スキル
    // ========================================
    getSkillSlots() {
        const cfg = GAME_DATA.ROGUE_CONFIG;
        let slots = cfg.baseSkillSlots + (this.unlockedRods.length - 1);
        Object.values(this.rodStarLevels).forEach(stars => slots += stars);

        this.getEffectsByType('skill_slot_expansion').forEach(effect => {
            slots += effect.value;
        });

        return Math.min(slots, cfg.maxSkillSlots);
    },

    // ========================================
    // 魚を釣り上げた記録（図鑑・統計）
    // 売却は自動なのでインベントリには入れない
    // ========================================
    recordCatch(fish) {
        if (!this.encyclopedia[fish.id]) {
            this.encyclopedia[fish.id] = { count: 0, hasSpecial: false, specialCount: 0 };
        }
        const entry = this.encyclopedia[fish.id];
        entry.count++;
        if (fish.hasTitle) {
            entry.hasSpecial = true;
            entry.specialCount = (entry.specialCount || 0) + 1;
        }

        this.totalFishCaught++;
        if (this.caughtByRank[fish.rarity] !== undefined) {
            this.caughtByRank[fish.rarity]++;
        }
        if (!this.biggestFish || fish.power > this.biggestFish.power) {
            this.biggestFish = { name: fish.name, power: fish.power };
        }
    },

    // 魚1匹あたりの売値（スキル・天候・コンボ・本日の高値の補正込み）
    getSalePrice(fish) {
        // 本日の高値の魚は売値が上がる
        const highValue = this.run && this.run.highValue === fish.id ? GAME_DATA.ROGUE_CONFIG.highValueMult : 1;
        return Math.floor(fish.price * highValue * (1 + this.getPriceBonus()) * (1 + this.getComboBonus()));
    },

    // 連続成功コンボによる売値ボーナス（0.1 = +10%）
    getComboBonus() {
        if (!this.run) return 0;
        const cfg = GAME_DATA.ROGUE_CONFIG.combo;
        return Math.min(this.run.combo || 0, this.getComboMaxStacks()) * cfg.step;
    },

    // コンボの上限（早竿で増える）
    getComboMaxStacks() {
        return GAME_DATA.ROGUE_CONFIG.combo.maxStacks + (this.getRodType().comboStacks || 0);
    },

    // ========================================
    // 竿のタイプ
    // ========================================
    getRodType(typeId = this.rodType) {
        const types = GAME_DATA.ROGUE_CONFIG.rodTypes;
        return types.find(t => t.id === typeId) || types[0];
    },

    // 「竹の剛竿」のような表示名
    getRodDisplayName(rodIndex = this.rodRankIndex, typeId = this.rodType) {
        return `${GAME_DATA.ROGUE_CONFIG.rodMaterials[rodIndex]}の${this.getRodType(typeId).name}`;
    },

    // ========================================
    // 水域・釣り場・天候（ラウンド中のみ）
    // ========================================
    getCurrentRegion() {
        if (!this.run || !this.run.region) return null;
        return GAME_DATA.ROGUE_CONFIG.regions.find(r => r.id === this.run.region) || null;
    },

    getCurrentSpot() {
        const region = this.getCurrentRegion();
        if (!region) return null;
        return region.spots.find(s => s.id === this.run.spot) || null;
    },

    getCurrentWeather() {
        if (!this.run || !this.run.weather) return null;
        return GAME_DATA.ROGUE_CONFIG.weathers.find(w => w.id === this.run.weather) || null;
    },

    // 「嵐の堤防」のような釣り場の表示名
    getSpotDisplayName(spot = this.getCurrentSpot(), weather = this.getCurrentWeather()) {
        if (!spot) return '';
        return `${weather ? weather.prefix : ''}${spot.name}`;
    },

    // ========================================
    // 餌
    // ========================================
    getBaitCount(baitId) {
        return this.baitInventory[baitId] || 0;
    },

    getTotalBaitCount() {
        return Object.values(this.baitInventory).reduce((sum, n) => sum + Math.max(0, n), 0);
    },

    addBait(baitId, amount) {
        if (!amount || amount <= 0) return;
        this.baitInventory[baitId] = this.getBaitCount(baitId) + amount;
    },

    // 所持している餌の中で切り替える（direction: +1 / -1）
    switchBait(direction) {
        const owned = GAME_DATA.BAITS.filter(b => this.getBaitCount(b.id) > 0 || b.id === this.baitType);
        if (owned.length <= 1) return;
        const index = owned.findIndex(b => b.id === this.baitType);
        this.baitType = owned[(index + direction + owned.length) % owned.length].id;
    },

    // 選択中の餌が尽きていたら、残っている一番下のランクの餌に持ち替える
    // 持ち替え先が無ければ false
    ensureUsableBait() {
        if (this.getBaitCount(this.baitType) > 0) return true;
        const next = GAME_DATA.BAITS.find(b => this.getBaitCount(b.id) > 0);
        if (!next) return false;
        this.baitType = next.id;
        return true;
    },

    // 餌を1つ消費する。成功時のみ「餌の達人」で消費を免れることがある
    useBait(isSuccess = true) {
        if (this.getBaitCount(this.baitType) <= 0) return false;

        if (isSuccess && Math.random() < this.getBaitSaveChance()) {
            console.log('✨ 餌の達人発動！');
            return true;
        }

        this.baitInventory[this.baitType]--;
        return true;
    },

    // ========================================
    // 釣り竿（購入・強化）
    // 価格は ROGUE_CONFIG.rodPrices / rodUpgradeCosts
    // ========================================
    getRodPrice(rodIndex, typeId = 'all') {
        const base = GAME_DATA.ROGUE_CONFIG.rodPrices[rodIndex] * this.getRodType(typeId).priceMult;
        return Math.floor(base * (1.0 - this.getShopDiscount()));
    },

    // 次の竿に買い替える（買ったらそのまま持ち替える）
    buyNextRod(typeId) {
        const nextIndex = this.rodRankIndex + 1;
        if (!GAME_DATA.RODS[nextIndex]) return false;
        if (!this.spendMoney(this.getRodPrice(nextIndex, typeId))) return false;

        this.unlockedRods.push(nextIndex);
        this.rodStarLevels[nextIndex] = 0;
        this.rodRankIndex = nextIndex;
        this.rodType = typeId;
        return true;
    },

    getUpgradeCost() {
        if (this.rodStars >= 5) return null;
        const base = GAME_DATA.ROGUE_CONFIG.rodUpgradeCosts[this.rodRankIndex][this.rodStars];
        return Math.floor(base * this.getUpgradeCostModifier());
    },

    upgradeRod() {
        const cost = this.getUpgradeCost();
        if (cost === null || !this.spendMoney(cost)) return false;
        this.rodStars++;
        return true;
    },

    // 竿の見た目（装備中の竿に対応するスキン）
    getCurrentSkin() {
        const rodId = this.getCurrentRod().id;
        return GAME_DATA.SKINS.find(skin => skin.rodId === rodId) || GAME_DATA.SKINS[0];
    },

    // ========================================
    // スキルの入手・売却
    // ========================================
    // スキルを入手する。スロットが空いていれば自動で装備する
    addSkill(skillId) {
        this.skillInventory[skillId] = (this.skillInventory[skillId] || 0) + 1;
        if (this.equippedSkills.length < this.getSkillSlots()) {
            this.equippedSkills.push(skillId);
        }
    },

    // スキルを1つ手放す（装備していない分から優先して減らす）
    removeSkill(skillId) {
        const owned = this.getSkillCount(skillId);
        if (owned <= 0) return false;

        if (this.getEquippedSkillCount(skillId) >= owned) {
            this.equippedSkills.splice(this.equippedSkills.indexOf(skillId), 1);
        }
        if (owned === 1) delete this.skillInventory[skillId];
        else this.skillInventory[skillId] = owned - 1;

        this.trimEquippedSkills();
        return true;
    },

    // スロット数を超えた装備を後ろから外す（拡張スキルを外した時など）
    trimEquippedSkills() {
        while (this.equippedSkills.length > this.getSkillSlots()) {
            this.equippedSkills.pop();
        }
    },

    // ========================================
    // 上位魚確定フラグの設定
    // ========================================
    setHighTierGuaranteed(value) {
        this.highTierGuaranteed = value;
        console.log(`🦅 上位魚確定フラグ: ${value}`);
    },

    // ========================================
    // 現在の釣り竿データを取得
    // ========================================
    getCurrentRod() {
        return GAME_DATA.RODS[this.rodRankIndex] || GAME_DATA.RODS[0];
    },


    // 現在の総合パワーを計算
    // ========================================
    getTotalPower() {
        const rod = this.getCurrentRod();
        const stars = this.rodStars; // Getterを使用
        let power = rod.basePower + (rod.starPowerBonus * stars);

        // スキルボーナスを加算 (固定値)
        const powerEffects = this.getEffectsByType('power_boost');
        powerEffects.forEach(effect => {
            power += effect.value;
        });

        // 動的ボーナスを加算 (所持スキル数依存など)
        power += this.getDynamicPowerBonus();

        // 倍率補正 (Overdrive, Ultimate Risk等)
        let multiplier = 1.0;

        // ランクボーナス (Rank Bonus) - 加算倍率
        multiplier += this.getRankPowerBonus();
        const overdriveEffects = this.getEffectsByType('overdrive');
        overdriveEffects.forEach(effect => {
            multiplier += effect.power;
        });

        const ultimateRiskEffects = this.getEffectsByType('ultimate_risk');
        ultimateRiskEffects.forEach(effect => {
            multiplier += effect.power;
        });

        // 神の力 (Godly Power) - 加算ボーナスと倍率
        const godlyEffects = this.getEffectsByType('godly_power');
        godlyEffects.forEach(effect => {
            power += effect.power;
            if (effect.multiplier) multiplier *= effect.multiplier;
        });

        // 特殊スキルの倍率補正
        const masterAnglerSpecial = this.getEffectsByType('master_angler_special').length > 0;
        const goodFeel = this.getEffectsByType('good_feel').length > 0;
        const hardMode = this.getEffectsByType('hard_mode').length > 0;

        if (masterAnglerSpecial) multiplier *= 2.0;
        if (goodFeel) multiplier *= 2.0;
        if (hardMode) multiplier *= 5.0;

        power = Math.floor(power * multiplier);

        // ========================================
        // フィーバーボーナス (月: お魚フィーバー)
        // ========================================
        if (this.fever.isActive && this.fever.type === 'moon') {
            const feverBonus = 2.0; // 2.0倍 (100% UP)
            power = Math.floor(power * feverBonus);
            console.log(`🔥 お魚フィーバー効果: パワー 2.0倍! -> ${power}`);
        }

        return power;
    },

    // ========================================
    // 動的パワーボーナス (所持数依存)
    // ========================================
    getDynamicPowerBonus() {
        let bonus = 0;
        // スキル所持数を計算 (全ての所持スキルの個数)
        let totalOwnedSkills = 0;
        if (this.skillInventory) {
            totalOwnedSkills = Object.values(this.skillInventory).reduce((sum, count) => sum + count, 0);
        }

        for (const skillId of this.equippedSkills) {
            const skillData = this.getSkillData(skillId);
            if (!skillData) continue;

            this.getEffectsByType('count_skill_power').forEach(effect => {
                bonus += totalOwnedSkills * effect.value;
            });
        }
        return Math.floor(bonus);
    },

    // ========================================
    // 動的称号出現率補正 (所持魚依存)
    // ========================================
    getDynamicTitleChance() {
        let multiplierAdd = 0; // 加算する倍率
        // 図鑑の登録魚種数、または魚の総所持数
        // ここでは「所持魚数（図鑑の合計数）」とします
        let totalFishCount = 0;
        if (this.encyclopedia) {
            totalFishCount = Object.values(this.encyclopedia).reduce((sum, entry) => sum + (entry.count || 0), 0);
        }

        for (const skillId of this.equippedSkills) {
            const skill = GAME_DATA.SKILLS.find(s => s.id === skillId);
            if (skill && skill.effect.type === 'count_fish_title') {
                // 例: 0.01% * 100匹 = +1% (倍率ではなく確率加算の可能性もあるが、仕様上は「称号付き出現率UP」なので倍率加算と仮定)
                // 既存の TitleChanceMultiplier は +1.0 などを返しているため、ここでも加算値を返す
                multiplierAdd += totalFishCount * skill.effect.value;
            }
        }
        return multiplierAdd;
    },

    // ========================================
    // 動的売却倍率補正 (チケット数依存)
    // ========================================
    getDynamicSellMultiplier() {
        let multiplierAdd = 0;
        const ticketCount = this.gachaTickets || 0;

        for (const skillId of this.equippedSkills) {
            const skill = GAME_DATA.SKILLS.find(s => s.id === skillId);
            if (skill && skill.effect.type === 'count_gacha_sell') {
                // 例: ticket 10枚 * 0.01 = +0.1 (10%)
                multiplierAdd += ticketCount * skill.effect.value;
            }
        }
        return multiplierAdd;
    },

    // ========================================
    // パワーのスキル補正を取得
    // ========================================
    getPowerBonus() {
        let bonus = 0;
        for (const skillId of this.equippedSkills) {
            const skill = GAME_DATA.SKILLS.find(s => s.id === skillId);
            if (skill && skill.effect.type === 'power_boost') {
                bonus += skill.effect.value;
            }
        }
        return bonus;
    },

    // ========================================
    // ゲージ速度のスキル補正を取得
    // ========================================
    getGaugeSlowBonus() {
        let slowBonus = 0;

        this.getEffectsByType('gauge_slow').forEach(effect => {
            slowBonus += effect.value;
        });

        this.getEffectsByType('overdrive').forEach(effect => {
            slowBonus -= effect.speed;
        });

        // Master Angler - 低速化
        this.getEffectsByType('master_angler').forEach(effect => {
            if (effect.slow) slowBonus += effect.slow;
        });

        return slowBonus;
    },

    // ========================================
    // 売却価格のスキル補正を取得
    // ========================================
    getPriceBonus() {
        let bonus = 0;
        let multiplier = 1.0;

        this.getEffectsByType('price_boost').forEach(effect => {
            bonus += effect.value;
        });
        this.getEffectsByType('high_risk_sell').forEach(effect => {
            bonus += (effect.priceMult - 1.0);
        });
        this.getEffectsByType('quick_hit_penalty').forEach(effect => {
            bonus -= effect.priceReduc;
        });

        // 黄金の指先 (Golden Touch)
        this.getEffectsByType('golden_touch').forEach(effect => {
            bonus += effect.boost;
            if (effect.multiplier) multiplier *= effect.multiplier;
        });

        // 動的補正を加算
        bonus += this.getDynamicSellMultiplier();

        // ハードモード補正 (売値8倍)
        if (this.getEffectsByType('hard_mode').length > 0) {
            multiplier *= 8.0;
        }

        // 互換性のために倍率をボーナスに統合して返す
        const totalBonus = Math.max(bonus, -0.9);
        return (1 + totalBonus) * multiplier - 1;
    },

    // ========================================
    // 捕獲率のスキル補正を取得
    // ========================================
    getCatchBonus() {
        let bonus = 0;
        this.getEffectsByType('catch_boost').forEach(effect => {
            bonus += effect.value;
        });
        // Master Angler - 捕獲率
        this.getEffectsByType('master_angler').forEach(effect => {
            bonus += effect.catch;
        });
        return bonus;
    },

    // ========================================
    // フィーバー蓄積ボーナス
    // ========================================
    getFeverChargeBonus() {
        let bonus = 0;
        this.getEffectsByType('fever_charge_boost').forEach(eff => bonus += eff.value);
        // 永遠の熱狂 (Eternal Fever) - 蓄積
        this.getEffectsByType('eternal_fever').forEach(eff => bonus += eff.charge);
        return bonus;
    },

    // ========================================
    // レア魚出現率のスキル補正を取得
    // ========================================
    getRareBonus() {
        let bonus = 0;

        this.getEffectsByType('rare_boost').forEach(effect => {
            bonus += effect.value;
        });
        this.getEffectsByType('moon_rare_up').forEach(effect => {
            if (this.hasMoonBlessing()) { // Helperを使用
                const cosmicMult = this.getCosmicBlessingMultiplier();
                bonus += effect.value * cosmicMult;
            }
        });

        // 餌の補正も加算
        if (this.baitType) {
            const bait = GAME_DATA.BAITS.find(b => b.id === this.baitType);
            if (bait) {
                bonus += (bait.rareBoost || 0);
            }
        }

        return bonus;
    },

    // ========================================
    // 揺れ回数固定スキルを取得
    // ========================================
    getNibbleFixCount() {
        const effects = this.getEffectsByType('nibble_fix');
        if (effects.length > 0) {
            return effects[0].value;
        }
        return null;
    },

    // ========================================
    // HIT受付時間のスキル補正（倍率）を取得
    // ========================================
    getHitWindowMultiplier() {
        let totalMultiplier = 1.0;
        this.getEffectsByType('hit_window_mult').forEach(effect => {
            totalMultiplier += (effect.value - 1.0);
        });
        return totalMultiplier;
    },

    // ========================================
    // 待ち時間短縮のスキル補正を取得
    // ========================================
    getWaitTimeReduction() {
        let reduction = 0;
        this.getEffectsByType('wait_time_reduction').forEach(effect => {
            reduction += effect.value;
        });
        this.getEffectsByType('quick_hit_penalty').forEach(effect => {
            reduction += effect.waitReduc;
        });
        this.getEffectsByType('new_fish_finder').forEach(effect => {
            reduction -= effect.waitIncrease;
        });
        // 最大100%カット（念のためキャップ）
        return Math.min(reduction, 0.95); // 95%まで
    },

    // ========================================
    // 餌の消費回避確率を取得
    // ========================================
    getBaitSaveChance() {
        // 無限餌スキル
        if (this.getEffectsByType('infinite_bait').length > 0) {
            return 1.0;
        }

        let chance = 0;
        this.getEffectsByType('bait_save').forEach(effect => {
            chance += effect.value;
        });
        return Math.min(chance, GAME_DATA.ROGUE_CONFIG.caps.baitSave);
    },

    // ========================================
    // フィーバー継続時間ボーナス
    // ========================================
    getFeverLongBonus() {
        let reduction = 0;
        this.getEffectsByType('fever_long_boost').forEach(eff => reduction += eff.value);
        // 永遠の熱狂 (Eternal Fever) - 継続
        this.getEffectsByType('eternal_fever').forEach(eff => reduction += eff.sustain);
        return Math.min(reduction, 1.0);
    },

    // ========================================
    // 赤ゾーン拡大のスキル補正を取得
    // ========================================
    getRedZoneBonus() {
        let bonus = 0;
        this.getEffectsByType('red_zone_boost').forEach(effect => {
            bonus += effect.value;
        });
        // Master Angler - 赤ゾーン
        this.getEffectsByType('master_angler').forEach(effect => {
            bonus += effect.redZone;
        });
        return bonus;
    },

    // ========================================
    // 起死回生（白を緑に）の確率を取得
    // ========================================
    getSecondChanceRate() {
        let rate = 0;
        this.getEffectsByType('second_chance').forEach(effect => {
            rate += effect.value;
        });
        return Math.min(rate, 1.0);
    },

    // ========================================
    // 称号出現率の倍率を取得
    // ========================================
    getTitleChanceMultiplier() {
        let totalMultiplier = 1.0;
        this.getEffectsByType('title_boost').forEach(effect => {
            totalMultiplier += (effect.value - 1.0);
        });

        // 動的補正を加算
        totalMultiplier += this.getDynamicTitleChance();

        return totalMultiplier;
    },

    // ランクによるパワーボーナスを取得 (倍率)
    getRankPowerBonus() {
        let bonusRate = (this.rank - 1) * GAME_DATA.RANK_SYSTEM.powerBonusPerRank;

        // ランクパワーボーナス強化 (Rank Power Boost Skill)
        let multiplier = 1.0;
        this.getEffectsByType('rank_power_boost').forEach(effect => {
            multiplier += effect.value;
        });

        // 例: Rank 10 (9% base) * Skill 1.5 (+50%) = 13.5% (0.135)
        return bonusRate * multiplier;
    },

    // ========================================
    // 大物出現率のスキル補正を取得
    // ========================================
    getBigGameBonus() {
        let totalBonus = 1.0;
        this.getEffectsByType('big_game_boost').forEach(effect => {
            totalBonus += (effect.value - 1.0);
        });
        return totalBonus;
    },

    // ========================================
    // ショップ割引率を取得
    // ========================================
    getShopDiscount() {
        let discount = 0;
        this.getEffectsByType('shop_discount').forEach(effect => {
            discount += effect.value;
        });
        return Math.min(discount, 0.9); // 最大90%オフ
    },

    // ========================================
    // 強化費用軽減率を取得
    // ========================================
    getUpgradeCostModifier() {
        let reduction = 0;
        this.getEffectsByType('upgrade_discount').forEach(effect => {
            reduction += effect.value;
        });
        return Math.max(0, 1.0 - reduction); // 倍率を返す (0.9 = 10% off)
    },

    // ========================================
    // 自動ヒット (Auto Hit) の確認
    // ========================================
    hasAutoHit() {
        let bestChance = 0;
        let hasIt = false;
        this.getEffectsByType('auto_hit').forEach(effect => {
            hasIt = true;
            if (effect.chance > bestChance) {
                bestChance = effect.chance;
            }
        });
        return { hasIt, chance: bestChance };
    },

    // ========================================
    // ペナルティ・リスク状態の確認
    // ========================================
    getPenaltyStatus() {
        const ultimateRisk = this.getEffectsByType('ultimate_risk').length > 0;
        const highRiskSell = this.getEffectsByType('high_risk_sell').length > 0;

        // ペナルティ回避率の計算
        let ultimateSafety = 0;
        this.getEffectsByType('godly_power').forEach(eff => {
            ultimateSafety = Math.max(ultimateSafety, eff.safety || 0);
        });

        let highRiskSafety = 0;
        this.getEffectsByType('golden_touch').forEach(eff => {
            highRiskSafety = Math.max(highRiskSafety, eff.safety || 0);
        });

        // ランクスナイパー (上位ランク魚出現率)
        let rankSniper = null;
        this.getEffectsByType('rank_sniper').forEach(effect => {
            const rankValue = { 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5 };
            if (!rankSniper || rankValue[effect.minRarity] > rankValue[rankSniper]) {
                rankSniper = effect.minRarity;
            }
        });

        // 安全率が1.0(100%)ならフラグ自体を折る
        return {
            ultimateRisk: ultimateRisk && (ultimateSafety < 1.0),
            highRiskSell: highRiskSell && (highRiskSafety < 1.0),
            rankSniper: rankSniper,
            ultimateSafety: ultimateSafety,
            highRiskSafety: highRiskSafety
        };
    },

    // ========================================
    // 宝箱出現確率のスキル補正を取得 (加算)
    // ========================================
    getTreasureChanceBonus() {
        let bonus = 0;
        this.getEffectsByType('treasure_boost').forEach(effect => {
            bonus += effect.value;
        });

        this.getEffectsByType('sun_chest_up').forEach(effect => {
            if (this.hasSunBlessing()) { // Helperを使用
                const cosmicMult = this.getCosmicBlessingMultiplier();
                bonus += effect.value * cosmicMult;
            }
        });
        return bonus;
    },

    // ========================================
    // 宝箱報酬量の倍率を取得 (1.0 + ボーナス)
    // ========================================
    getTreasureQuantityMultiplier() {
        let multiplier = 1.0;
        this.getEffectsByType('treasure_quantity').forEach(effect => {
            multiplier += effect.value;
        });

        this.getEffectsByType('fever_treasure_boost').forEach(effect => {
            if (this.fever.isActive) {
                multiplier += effect.value;
            }
        });
        return multiplier;
    },

    // ========================================
    // 宝箱報酬質の倍率を取得 (乗算)
    // ========================================
    getTreasureQualityMultiplier() {
        let multiplier = 1.0;
        this.getEffectsByType('treasure_quality').forEach(effect => {
            multiplier *= effect.value;
        });
        return multiplier;
    },

    // ========================================
    // 未登録魚出現率のスキル補正を取得 (倍率)
    // ========================================
    getNewFishBonus() {
        let bonus = 1.0;
        this.getEffectsByType('new_fish_finder').forEach(effect => {
            bonus *= effect.value;
        });
        return bonus;
    },

    // ========================================
    // フィーバー中の出現魚種バイアス
    // ========================================
    getFeverBiasBonus(type) {
        let bonus = 0;
        this.getEffectsByType('fever_bias').forEach(eff => {
            if (eff.feverType === type) bonus += eff.value;
        });
        return bonus;
    },

    // ========================================
    // 加護（Blessing）ヘルパー
    // ========================================
    hasSunBlessing() {
        return this.getEffectsByType('sun_blessing').length > 0 ||
            this.getEffectsByType('cosmic_blessing').length > 0;
    },
    hasMoonBlessing() {
        return this.getEffectsByType('moon_blessing').length > 0 ||
            this.getEffectsByType('cosmic_blessing').length > 0;
    },
    getCosmicBlessingMultiplier() {
        let mult = 1.0;
        this.getEffectsByType('cosmic_blessing').forEach(eff => {
            if (eff.value > mult) mult = eff.value;
        });
        return mult;
    },

    // ========================================
    // ダブルキャッチ (2匹釣り) 確率を取得
    // ========================================
    getMultiCatch2Chance() {
        let chance = 0;
        this.getEffectsByType('multi_catch_2').forEach(effect => {
            chance += effect.value;
        });
        this.getEffectsByType('multi_catch_prob').forEach(effect => {
            chance += effect.value;
        });
        return Math.min(chance, GAME_DATA.ROGUE_CONFIG.caps.multiCatch2);
    },

    // ========================================
    // トリプルキャッチ (3匹釣り) 確率を取得
    // ========================================
    getMultiCatch3Chance() {
        let chance = 0;
        this.getEffectsByType('multi_catch_3').forEach(effect => {
            chance += effect.value;
        });
        return Math.min(chance, GAME_DATA.ROGUE_CONFIG.caps.multiCatch3);
    },

    // ========================================
    // マルチキャッチ時の追加匹数
    // ========================================
    getMultiCatchBonusNum() {
        let num = 0;
        // 動的計算: 所持スキル数依存など
        let totalOwnedSkills = 0;
        if (this.skillInventory) {
            totalOwnedSkills = Object.values(this.skillInventory).reduce((sum, count) => sum + count, 0);
        }

        for (const skillId of this.equippedSkills) {
            const skill = GAME_DATA.SKILLS.find(s => s.id === skillId);
            if (!skill) continue;

            this.getEffectsByType('multi_catch_num').forEach(effect => {
                num += effect.value;
            });

            this.getEffectsByType('count_skill_multi').forEach(effect => {
                num += Math.floor(totalOwnedSkills * effect.value);
            });
        }
        return num;
    },

    // ========================================
    // スキル増幅率を取得（増幅の心得）
    // ========================================
    getSkillAmplifier() {
        let amplifier = 1.0;
        this.getEffectsByType('skill_amplifier').forEach(effect => {
            amplifier += effect.value;
        });
        return amplifier;
    },

    // ========================================
    // 現在の空（背景）を取得
    // ========================================
    getCurrentSky() {
        if (!this.selectedSky) return GAME_DATA.SKIES[0];
        return GAME_DATA.SKIES.find(s => s.id === this.selectedSky) || GAME_DATA.SKIES[0];
    },

    // ========================================
    // スキル管理
    // ========================================
    // 指定したスキルを所持数分カウントして返す (オーバーロード的利用)
    getSkillCount(skillId) {
        return this.skillInventory[skillId] || 0;
    },

    // 指定したスキルの装備数を返す
    getEquippedSkillCount(skillId) {
        return this.equippedSkills.filter(id => id === skillId).length;
    },

    // スキルが装備可能かチェック
    canEquipSkill(skillId) {
        // 1. 所持しているか？ (装備中の数 < 所持数)
        const owned = this.getSkillCount(skillId);
        const equipped = this.getEquippedSkillCount(skillId);
        if (owned <= equipped) return { can: false, reason: '所持数が足りません' };

        // 2. スロットに空きがあるか？
        const maxSlots = this.getSkillSlots();
        if (this.equippedSkills.length >= maxSlots) return { can: false, reason: 'スロットが一杯です' };

        return { can: true };
    },

    // スキルを装備
    equipSkill(skillId) {
        const check = this.canEquipSkill(skillId);
        if (!check.can) return check;

        this.equippedSkills.push(skillId);


        return { can: true };
    },

    // スキルを解除
    unequipSkill(skillId) {
        const index = this.equippedSkills.indexOf(skillId);
        if (index === -1) return { can: false, reason: '装備していません' };

        this.equippedSkills.splice(index, 1);
        this.trimEquippedSkills();
        return { can: true };
    },

    // ========================================
    // スキルデータ取得（ハイブリッド対応）
    // ========================================
    getSkillData(skillId) {
        // 通常のスキル
        let skill = GAME_DATA.SKILLS.find(s => s.id === skillId);
        if (skill) return skill;

        // 合成スキル（カスタムスキル）
        if (this.customSkills[skillId]) {
            return this.customSkills[skillId];
        }

        return null;
    },

    // ========================================
    // エフェクト取得（ハイブリッド対応）
    // ========================================
    // 指定したタイプの効果値をすべて合計（またはリスト）で取得する
    getEffectsByType(type) {
        const effects = [];
        for (const skillId of this.equippedSkills) {
            const skill = this.getSkillData(skillId);
            if (!skill) continue;

            this._collectEffects(skill.effect, type, effects);
        }
        // 竿のタイプの効果は「その竿を持っている間だけ装備される見えないスキル」として混ぜる
        this.getRodType().effects.forEach(effect => this._collectEffects(effect, type, effects));

        // 天候の効果は「その天候の間だけ装備される見えないスキル」として混ぜる
        const weather = this.getCurrentWeather();
        if (weather) {
            weather.effects.forEach(effect => this._collectEffects(effect, type, effects));
        }
        return effects;
    },

    // 再帰的にエフェクトを収集
    _collectEffects(effect, type, results) {
        if (!effect) return;

        if (effect.type === 'hybrid' && effect.effects) {
            for (const subEffect of effect.effects) {
                this._collectEffects(subEffect, type, results);
            }
        } else if (effect.type === type) {
            results.push(effect);
        }
    },

    // ========================================
    // スキル所持判定
    // ========================================
    hasSkill(skillId) {
        return (this.skillInventory[skillId] || 0) > 0;
    },

    // ========================================
    // フィーバー報酬倍率（永遠の熱狂）
    // ========================================
    getFeverRewardMultiplier() {
        let mult = 1.0;
        if (this.fever.isActive) {
            this.getEffectsByType('eternal_fever').forEach(eff => {
                if (eff.multiplier) mult = Math.max(mult, eff.multiplier);
            });
        }
        return mult;
    },

    // ========================================
    // 成長速度（Cosmic Blessing用）
    // ========================================
    getFeverChargeBaseChance() {
        let chance = 0.2;
        this.getEffectsByType('cosmic_blessing').forEach(eff => {
            if (eff.speed) chance *= eff.speed;
        });
        return Math.min(chance, 1.0);
    },

    // ========================================
    // ボートイベント出現率のスキル補正を取得
    // ========================================
    getBoatEventBonus() {
        let bonus = 0;
        this.getEffectsByType('boat_event_boost').forEach(eff => bonus += eff.value);
        return bonus;
    },

    // ========================================
    // 鳥イベント出現率のスキル補正を取得
    // ========================================
    getBirdEventBonus() {
        let bonus = 0;
        this.getEffectsByType('bird_event_boost').forEach(eff => bonus += eff.value);
        return bonus;
    },


    // ========================================
    // 達人の針（赤ゾーン確定）所持判定
    // ========================================
    hasPerfectMaster() {
        return this.getEffectsByType('master_needle').length > 0;
    },

    // ========================================
    // フィーバーの進行
    // ========================================
    progressFever(isGuaranteed = false) {
        // ========================================
        // フィーバー中の処理 (Lv6〜)
        // ========================================
        if (this.fever.isActive) {
            const roll = Math.random() * 100;
            const longBonus = this.getFeverLongBonus();

            if (isGuaranteed) {
                this.fever.value++;
            } else if (roll < (75 * (1.0 - longBonus * 0.5))) {
                this.fever.value++;
            } else if (this.getEffectsByType('cosmic_blessing').length > 0 && Math.random() < 0.3) {
                // 宇宙の加護: 30%の確率でLv6にリセット（延長）
                this.fever.value = 6;
                console.log('✨ 宇宙の加護発動！フィーバーゲージをリセットしました');
                return { message: 'active' };
            } else if (longBonus >= 1.0) {
                // 維持
            } else if (roll < 85) {
                // 維持 (10%)
            } else if (roll < 95) {
                // 後退 (10%)
                this.fever.value--;
                if (this.fever.value < 6) this.fever.value = 6;
            } else {
                // リセット (5%)
                this.fever.value = 6;
                return { message: 'reset' };
            }

            if (this.fever.value > 12) {
                this.fever.isActive = false;
                // 永遠の熱狂: フィーバー終了時にゲージが4溜まった状態になる
                if (this.getEffectsByType('eternal_mania').length > 0) {
                    this.fever.value = 4;
                    console.log('✨ 永遠の熱狂期待！ゲージ4からリスタート');
                } else {
                    this.fever.value = 0;
                }
                this.fever.type = null;
                return { message: 'end' };
            }
            return { message: 'active' };
        }
        // ========================================
        // ゲージ蓄積中の処理 (〜Lv6)
        // ========================================
        else {
            const chargeChance = this.getFeverChargeBaseChance();
            const chargeBonus = 0; // 必要なら getFeverChargeBonus をここで使う

            if (isGuaranteed || Math.random() < chargeChance) {
                this.fever.value++;

                if (this.fever.value >= 1 && !this.fever.type) {
                    const sunBonus = this.getFeverBiasBonus('sun');
                    const moonBonus = this.getFeverBiasBonus('moon');
                    const sunChance = 0.5 + sunBonus - moonBonus;
                    this.fever.type = Math.random() < sunChance ? 'sun' : 'moon';
                }

                if (this.fever.value >= 6) {
                    this.fever.isActive = true;
                    this.fever.value = 6;
                    return { message: 'start', type: this.fever.type };
                }
                return { message: 'charging' };
            }
            return { message: 'none' };
        }
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.GameState = GameState;
}
