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
            phase: 'harbor',   // 'fishing' | 'harbor' | 'over'
            harbor: null,      // 港にいる間だけ持つ状態（報酬候補・品揃えなど）
            previousBest: SaveManager.loadMeta().bestRound // 航海開始時点の最高記録
        };
        SaveManager.recordRun(0, true);
        this.startNextRound();
    },

    // 中断した航海を再開する。再開できなければ false
    resumeRun() {
        const saveData = SaveManager.load();
        if (!saveData) return false;

        GameState.init(saveData);
        FishingGame.init();

        if (this.run.phase === 'harbor') {
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
    getTarget(round) {
        const targets = this.config.targets;
        if (round <= targets.length) return targets[round - 1];

        // 最終ラウンド以降（エンドレス）は一定倍率で伸ばし、キリのいい数字に丸める
        const raw = targets[targets.length - 1] * Math.pow(this.config.endlessGrowth, round - targets.length);
        return Math.round(raw / 1000) * 1000;
    },

    canFish() {
        return !!this.run && this.run.phase === 'fishing';
    },

    // 次のラウンドへ出航する
    startNextRound() {
        const run = this.run;
        run.round++;
        run.target = this.getTarget(run.round);
        run.earned = 0;
        run.phase = 'fishing';
        run.harbor = null;

        // 基本の餌を支給（買った餌は持ち越し）
        GameState.addBait('bait_d', this.config.baitPerRound);
        GameState.ensureUsableBait();

        // ラウンドごとに空の見た目を変える
        const skies = this.config.skyByRound;
        GameState.selectedSky = skies[(run.round - 1) % skies.length];

        FishingGame.init();
        SaveManager.save();
        UIManager.showScreen('fishing');
        UIManager.updateFeverVisuals();
        UIManager.showNotification(`ROUND ${run.round}`, `目標 ${run.target.toLocaleString()} G ／ 餌 ${GameState.getTotalBaitCount()}個`, 'sailing', 3000);
    },

    // 一投ごとに呼ばれる決着判定。ラウンドが終わったら true
    checkRoundEnd() {
        const run = this.run;
        if (!run || run.phase !== 'fishing') return true;

        if (run.earned >= run.target) {
            this.clearRound();
            return true;
        }
        if (GameState.getTotalBaitCount() <= 0) {
            this.gameOver();
            return true;
        }
        return false;
    },

    clearRound() {
        const run = this.run;
        const cfg = this.config;

        // 余った基本の餌はボーナスに換金（買った餌は持ち越す）
        const leftover = GameState.getBaitCount('bait_d');
        const leftoverBonus = leftover * cfg.leftoverBaitBonus * run.round;
        const clearBonus = Math.floor(run.target * cfg.clearBonusRate);
        GameState.baitInventory.bait_d = 0;

        // 港フェーズに切り替えてから加算する（ボーナスは水揚げ額に数えない）
        run.phase = 'harbor';
        GameState.addMoney(clearBonus + leftoverBonus);

        const isFinalClear = run.round === cfg.finalRound;
        SaveManager.recordRun(run.round, false, isFinalClear);

        run.harbor = {
            summary: { earned: run.earned, target: run.target, clearBonus, leftover, leftoverBonus, isFinalClear },
            rewardTaken: false,
            rewardOptions: [],
            shopSkills: [],
            baitStock: {},
            rerolls: 0
        };
        run.harbor.rewardOptions = this.pickSkills(cfg.rewardChoices, run.round + 1);
        this.restockSkills();
        cfg.baitShop.forEach(item => {
            if (item.fromRound <= run.round + 1) run.harbor.baitStock[item.id] = item.stock;
        });

        SaveManager.save();
        UIManager.showScreen('harbor');
    },

    gameOver() {
        const run = this.run;
        run.phase = 'over';

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
    pickSkill({ tier = null, minTier = null, round = null, exclude = [] } = {}) {
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

        const pool = GAME_DATA.SKILLS.filter(s =>
            s.tier === targetTier && this.isOfferable(s) && !exclude.includes(s.id));
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    },

    // 重複なしで count 個のスキルIDを抽選する
    pickSkills(count, round, exclude = []) {
        const ids = [];
        for (let i = 0; i < count; i++) {
            const skill = this.pickSkill({ round, exclude: [...exclude, ...ids] });
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
        if (!GameState.spendMoney(this.getRerollCost())) return false;

        this.run.harbor.rerolls++;
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

    buyNextRod() {
        if (!this._inHarbor() || !GameState.buyNextRod()) return false;
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

    depart() {
        if (!this._inHarbor() || !this.run.harbor.rewardTaken) return false;
        this.startNextRound();
        return true;
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.RunManager = RunManager;
}
