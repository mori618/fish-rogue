// 航海（ラン）マネージャー
// ラウンド進行・目標判定・ゲームオーバー・港での買い物といったローグライトのルールを管理する。
// 画面の描画は HarborUI / UIManager が担当し、ここは状態の更新だけを行う。

const RunManager = {
    get config() {
        return GAME_DATA.ROGUE_CONFIG;
    },

    get run() {
        return GameState.run;
    },

    // ========================================
    // 航海の開始・再開
    // ========================================
    startNewRun() {
        GameState.init(null);
        GameState.run = {
            round: 0,
            target: 0,
            earned: 0,
            phase: 'setup',    // 'setup'（最初の竿選び） | 'fishing' | 'harbor' | 'over'
            harbor: null,      // 港にいる間だけ持つ状態（報酬候補・品揃えなど）
            startRods: this.pickRodTypes(this.config.startRodChoices, ['all']), // 最初に選べる竿のタイプ
            area: 'offshore',  // 今いる海域
            reached: false,    // このラウンドの目標を達成したか（達成後は「帰港」で港へ）
            combo: 0,          // 連続成功数
            supply: null,      // このラウンドに支給された餌 { id, count }
            stats: { casts: 0, catches: 0, escapes: 0, escapedPower: 0, zones: { red: 0, green: 0, white: 0 } },
            previousBest: SaveManager.loadMeta().bestRound // 航海開始時点の最高記録
        };
        SaveManager.recordRun(0, true);
        SaveManager.save();
        HarborUI.showRodChoice();
    },

    // 最初の竿を選んで出発する
    chooseStartRod(typeId) {
        const run = this.run;
        if (!run || run.phase !== 'setup' || !run.startRods.includes(typeId)) return false;
        GameState.rodType = typeId;
        this.startNextRound('offshore');
        return true;
    },

    // 竿のタイプを重複なしで count 個選ぶ（include は必ず含める）
    pickRodTypes(count, include = []) {
        const pool = this.config.rodTypes.map(t => t.id).filter(id => !include.includes(id));
        const picked = [...include];
        while (picked.length < count && pool.length > 0) {
            picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        return picked;
    },

    // 中断した航海を再開する。再開できなければ false
    resumeRun() {
        const saveData = SaveManager.load();
        if (!saveData) return false;

        GameState.init(saveData);
        FishingGame.init();

        if (this.run.phase === 'setup') {
            UIManager.showScreen('start');
            HarborUI.showRodChoice();
        } else if (this.run.phase === 'harbor') {
            UIManager.showScreen('harbor');
        } else {
            UIManager.showScreen('fishing');
            this.checkRoundEnd();
        }
        return true;
    },

    // ========================================
    // ラウンド
    // ========================================
    getTarget(round, areaId = null) {
        const targets = this.config.targets;
        let raw;
        if (round <= targets.length) {
            raw = targets[round - 1];
        } else {
            // 最終ラウンド以降（エンドレス）は一定倍率で伸ばす
            raw = targets[targets.length - 1] * Math.pow(this.config.endlessGrowth, round - targets.length);
        }

        const area = areaId ? this.getArea(areaId) : null;
        if (area) raw *= area.targetMult;

        // キリのいい数字に丸める（1,000未満は10G単位、それ以上は100G単位）
        const unit = raw < 1000 ? 10 : 100;
        return Math.round(raw / unit) * unit;
    },

    getArea(areaId) {
        return this.config.areas.find(a => a.id === areaId) || null;
    },

    // そのラウンドで支給される餌のID
    getSupplyBait(round) {
        let id = this.config.supplyBait[0].id;
        this.config.supplyBait.forEach(entry => {
            if (round >= entry.from) id = entry.id;
        });
        return id;
    },
    canFish() {
        return !!this.run && this.run.phase === 'fishing';
    },

    // 次のラウンドへ出航する
    startNextRound(areaId = 'offshore') {
        const run = this.run;
        const area = this.getArea(areaId) || this.getArea('offshore');
        run.round++;
        run.area = area.id;
        run.target = this.getTarget(run.round, area.id);
        run.earned = 0;
        run.reached = false;
        run.combo = 0;
        run.phase = 'fishing';
        run.harbor = null;

        // 餌を支給（買った餌は持ち越し）。支給分は余るとクリア時にボーナスへ換金される
        const supplyId = this.getSupplyBait(run.round);
        // carried = 前のラウンドから持ち越した同じ餌の数（クリア時の換金で買った餌を減らさないため）
        run.supply = { id: supplyId, count: this.config.baitPerRound, carried: GameState.getBaitCount(supplyId) };
        GameState.addBait(supplyId, this.config.baitPerRound);
        GameState.baitType = supplyId;
        GameState.ensureUsableBait();

        // 海域「月夜の海」: 月のフィーバーゲージを途中から始める
        if (area.startFever && !GameState.fever.isActive) {
            GameState.fever.type = area.startFever.type;
            GameState.fever.value = Math.max(GameState.fever.value, area.startFever.value);
        }

        // 空の見た目: 海域の空、なければラウンドごとの空
        const skies = this.config.skyByRound;
        GameState.selectedSky = area.sky || skies[(run.round - 1) % skies.length];

        FishingGame.init();
        SaveManager.save();
        UIManager.showScreen('fishing');
        UIManager.updateFeverVisuals();
        const bait = GAME_DATA.BAITS.find(b => b.id === supplyId);
        UIManager.showNotification(`ROUND ${run.round} ・ ${area.name}`,
            `目標 ${run.target.toLocaleString()} G ／ ${bait.name}×${this.config.baitPerRound} 支給`, area.icon, 3000);
    },
    // 一投ごとに呼ばれる決着判定。ラウンドが終わったら true
    checkRoundEnd() {
        const run = this.run;
        if (!run || run.phase !== 'fishing') return true;

        // 目標達成: すぐには終わらず「帰港」を押すまで粘れる
        if (!run.reached && run.earned >= run.target) {
            run.reached = true;
            SoundManager.play('goal');
            SaveManager.save();
            UIManager.updateStatus();
            UIManager.showNotification('目標達成！',
                `いつでも帰港できます。${this.gradeHint()}`, 'flag', 3500);
        }

        if (GameState.getTotalBaitCount() <= 0) {
            if (run.reached) this.clearRound();
            else this.gameOver();
            return true;
        }
        return false;
    },

    // 現在の水揚げ額での評価
    getGrade(earned = this.run.earned, target = this.run.target) {
        return this.config.grades.find(g => earned >= target * g.rate) || null;
    },

    // 次の評価までの案内文
    gradeHint() {
        const run = this.run;
        const next = [...this.config.grades].reverse().find(g => run.earned < run.target * g.rate);
        if (!next) return '評価は最高の「金」です';
        const need = Math.ceil(run.target * next.rate - run.earned);
        return `あと ${need.toLocaleString()} G で評価「${next.name}」`;
    },

    // 目標達成後に自分から港へ戻る
    returnToHarbor() {
        const run = this.run;
        if (!run || run.phase !== 'fishing' || !run.reached) return false;
        if (FishingGame.state !== 'idle') return false;
        this.clearRound();
        return true;
    },
    clearRound() {
        const run = this.run;
        const cfg = this.config;
        const grade = this.getGrade();
        const area = this.getArea(run.area);

        // 余った支給餌はボーナスに換金（買った餌は持ち越す）。支給分から先に使った扱いにする
        const carried = run.supply.carried || 0;
        const leftover = Math.max(0, Math.min(run.supply.count, GameState.getBaitCount(run.supply.id) - carried));
        const leftoverBonus = leftover * cfg.leftoverBaitBonus * run.round;
        GameState.baitInventory[run.supply.id] -= leftover;
        const clearBonus = Math.floor(run.target * cfg.clearBonusRate);

        // 港フェーズに切り替えてから加算する（ボーナスは水揚げ額に数えない）
        run.phase = 'harbor';
        GameState.addMoney(clearBonus + leftoverBonus);

        const isFinalClear = run.round === cfg.finalRound;
        SaveManager.recordRun(run.round, false, isFinalClear);
        SoundManager.play('fanfare', { grade: grade.id });

        const rewardCount = Math.max(2, grade.rewardChoices + ((area && area.rewardChoicesDelta) || 0));
        run.harbor = {
            summary: { earned: run.earned, target: run.target, grade: grade.id, clearBonus, leftover, leftoverBonus, isFinalClear },
            rewardTaken: false,
            rewardOptions: this.pickSkills(rewardCount, run.round + 1, [], grade.tierUp),
            shopSkills: [],
            baitStock: {},
            rerolls: 0,
            freeRerolls: grade.freeRerolls,
            areaOffers: this.pickAreas(),
            // 次の素材の竿（最上位の竿なら並ばない）
            rodOffers: GAME_DATA.RODS[GameState.rodRankIndex + 1] ? this.pickRodTypes(cfg.rodOfferChoices) : []
        };
        this.restockSkills();
        cfg.baitShop.forEach(item => {
            if (item.fromRound <= run.round + 1) run.harbor.baitStock[item.id] = item.stock;
        });

        SaveManager.save();
        UIManager.showScreen('harbor');
    },

    // 次のラウンドの海域候補（重複なし）
    pickAreas() {
        const pool = [...this.config.areas];
        const offers = [];
        while (offers.length < this.config.areaChoices && pool.length > 0) {
            offers.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id);
        }
        return offers;
    },

    // ========================================
    // 記録（ゲームオーバー画面と、腕前の検証に使う）
    // ========================================
    _stats() {
        return this.run && this.run.stats;
    },

    recordZone(zone) {
        const stats = this._stats();
        if (stats) stats.zones[zone]++;
    },

    recordCatch() {
        const stats = this._stats();
        if (!stats) return;
        stats.casts++;
        stats.catches++;
        this.run.combo++;
    },

    recordEscape(fish) {
        const stats = this._stats();
        if (!stats) return;
        stats.casts++;
        stats.escapes++;
        stats.escapedPower += fish.power;
        this.breakCombo();
    },

    recordMiss() {
        const stats = this._stats();
        if (!stats) return;
        stats.casts++;
        this.breakCombo();
    },

    breakCombo() {
        if (this.run.combo >= 2) UIManager.showMessage(`コンボが途切れた（×${this.run.combo}）`, 1500);
        this.run.combo = 0;
    },
    gameOver() {
        const run = this.run;
        run.phase = 'over';
        SoundManager.play('gameover');

        // 図鑑をメタデータに反映してから航海データを消す
        SaveManager.save();
        SaveManager.deleteSave();
        // 最高記録はラウンドクリア時に記録済みなので、ここでは航海開始時点と比べる
        HarborUI.showGameOver(run.round - 1 > run.previousBest);
    },

    // 自分から航海をやめる
    retire() {
        if (!this.run || this.run.phase === 'over') return;
        FishingGame.abort();
        this.gameOver();
    },

    // ========================================
    // スキル抽選
    // ========================================
    // そのラウンドで有効なTier出現重みを返す
    getTierWeights(round) {
        let weights = this.config.tierWeights[0].weights;
        this.config.tierWeights.forEach(entry => {
            if (round >= entry.from) weights = entry.weights;
        });
        return weights;
    },

    // 出現させてよいスキルか（ローグライト版で機能しない効果を除外）
    isOfferable(skill) {
        return !this.config.excludedEffects.includes(skill.effect.type);
    },

    // スキルを1つ抽選する
    //   tier:    指定するとそのTierから選ぶ
    //   minTier: ラウンドの重みで抽選しつつ、このTier未満（特別スキル以外）を除く
    //   round:   重みの基準ラウンド（省略時は現在のラウンド）
    //   exclude: 選ばないスキルIDの配列
    //   tierUp:  抽選したTierを1段階上げる（評価「金」の報酬）
    pickSkill({ tier = null, minTier = null, round = null, exclude = [], tierUp = false } = {}) {
        let targetTier = tier;

        if (targetTier === null) {
            const weights = { ...this.getTierWeights(round || (this.run ? this.run.round : 1)) };
            if (minTier !== null) {
                Object.keys(weights).forEach(t => {
                    if (Number(t) !== 0 && Number(t) < minTier) delete weights[t];
                });
                if (Object.keys(weights).length === 0) weights[minTier] = 1;
            }

            const total = Object.values(weights).reduce((a, b) => a + b, 0);
            let roll = Math.random() * total;
            for (const t in weights) {
                roll -= weights[t];
                if (roll < 0) {
                    targetTier = Number(t);
                    break;
                }
            }
        }

        if (tierUp && targetTier >= 1 && targetTier <= 3) targetTier++;

        const pool = GAME_DATA.SKILLS.filter(s =>
            s.tier === targetTier && this.isOfferable(s) && !exclude.includes(s.id));
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    },

    // 重複なしで count 個のスキルIDを抽選する
    pickSkills(count, round, exclude = [], tierUp = false) {
        const ids = [];
        for (let i = 0; i < count; i++) {
            const skill = this.pickSkill({ round, exclude: [...exclude, ...ids], tierUp });
            if (skill) ids.push(skill.id);
        }
        return ids;
    },

    // ========================================
    // 港: 価格
    // ========================================
    getSkillPrice(skillId) {
        const skill = GameState.getSkillData(skillId);
        const base = this.config.skillPrices[skill.tier] || 0;
        return Math.floor(base * (1.0 - GameState.getShopDiscount()));
    },

    getSkillSellPrice(skillId) {
        const skill = GameState.getSkillData(skillId);
        return Math.floor((this.config.skillPrices[skill.tier] || 0) * this.config.skillSellRate);
    },

    getBaitPrice(item) {
        return Math.floor(item.price * (1.0 - GameState.getShopDiscount()));
    },

    getRerollCost() {
        if (this.run.harbor.freeRerolls > 0) return 0;
        const nextTarget = this.getTarget(this.run.round + 1);
        const raw = nextTarget * this.config.rerollBaseRate * Math.pow(this.config.rerollGrowth, this.run.harbor.rerolls);
        return Math.max(10, Math.round(raw / 10) * 10);
    },
    getRewardSkipBonus() {
        return Math.floor(this.run.target * this.config.rewardSkipRate);
    },

    // 港に並べる餌（次のラウンドで解禁されているもの）
    getBaitOffers() {
        const stock = this.run.harbor.baitStock;
        return this.config.baitShop
            .filter(item => stock[item.id] !== undefined)
            .map(item => ({ ...item, stock: stock[item.id], price: this.getBaitPrice(item) }));
    },

    // ========================================
    // 港: 操作（成功したら true。保存まで行う）
    // ========================================
    _inHarbor() {
        return !!this.run && this.run.phase === 'harbor' && !!this.run.harbor;
    },

    _commit() {
        SaveManager.save();
        return true;
    },

    restockSkills() {
        const harbor = this.run.harbor;
        const ids = this.pickSkills(this.config.shopSkillCount, this.run.round + 1, harbor.rewardOptions);
        harbor.shopSkills = ids.map(id => ({ id, sold: false }));
    },

    chooseReward(index) {
        if (!this._inHarbor() || this.run.harbor.rewardTaken) return false;
        const skillId = this.run.harbor.rewardOptions[index];
        if (!skillId) return false;

        GameState.addSkill(skillId);
        this.run.harbor.rewardTaken = true;
        return this._commit();
    },

    skipReward() {
        if (!this._inHarbor() || this.run.harbor.rewardTaken) return false;
        GameState.addMoney(this.getRewardSkipBonus());
        this.run.harbor.rewardTaken = true;
        return this._commit();
    },

    buySkill(index) {
        if (!this._inHarbor()) return false;
        const offer = this.run.harbor.shopSkills[index];
        if (!offer || offer.sold) return false;
        if (!GameState.spendMoney(this.getSkillPrice(offer.id))) return false;

        GameState.addSkill(offer.id);
        offer.sold = true;
        return this._commit();
    },

    rerollSkills() {
        if (!this._inHarbor()) return false;
        const harbor = this.run.harbor;
        if (harbor.freeRerolls > 0) {
            harbor.freeRerolls--;
        } else {
            if (!GameState.spendMoney(this.getRerollCost())) return false;
            harbor.rerolls++;
        }
        this.restockSkills();
        return this._commit();
    },
    buyBait(baitId) {
        if (!this._inHarbor()) return false;
        const item = this.getBaitOffers().find(offer => offer.id === baitId);
        if (!item || item.stock <= 0) return false;
        if (!GameState.spendMoney(item.price)) return false;

        GameState.addBait(baitId, item.quantity);
        this.run.harbor.baitStock[baitId]--;
        return this._commit();
    },

    upgradeRod() {
        if (!this._inHarbor() || !GameState.upgradeRod()) return false;
        return this._commit();
    },

    buyNextRod(index) {
        if (!this._inHarbor()) return false;
        const harbor = this.run.harbor;
        const typeId = harbor.rodOffers[index];
        if (!typeId || !GameState.buyNextRod(typeId)) return false;
        harbor.rodOffers = [];   // 棚の竿は1本だけ買える
        return this._commit();
    },
    // 装備 ⇔ 解除。結果は { can, reason } で返す
    toggleSkill(skillId, equip) {
        if (!this._inHarbor()) return { can: false, reason: '装備の変更は港でのみできます' };
        const result = equip ? GameState.equipSkill(skillId) : GameState.unequipSkill(skillId);
        if (result.can) this._commit();
        return result;
    },

    sellSkill(skillId) {
        if (!this._inHarbor()) return false;
        const price = this.getSkillSellPrice(skillId);
        if (!GameState.removeSkill(skillId)) return false;

        GameState.addMoney(price);
        return this._commit();
    },

    depart(areaId) {
        if (!this._inHarbor() || !this.run.harbor.rewardTaken) return false;
        if (!this.run.harbor.areaOffers.includes(areaId)) return false;
        this.startNextRound(areaId);
        return true;
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.RunManager = RunManager;
}
