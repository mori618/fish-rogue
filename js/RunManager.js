// 釣り旅（ラン）マネージャー
// ラウンド進行・目標判定・ゲームオーバー・釣り宿での買い物といったローグライトのルールを管理する。
// 画面の描画は HarborUI / UIManager が担当し、ここは状態の更新だけを行う。

const RunManager = {
    get config() {
        return GAME_DATA.ROGUE_CONFIG;
    },

    get run() {
        return GameState.run;
    },

    // ========================================
    // 釣り旅の開始・再開
    // ========================================
    startNewRun(ascension = 0) {
        GameState.init(null);
        const meta = SaveManager.loadMeta();
        GameState.run = {
            round: 0,
            target: 0,
            earned: 0,
            phase: 'setup',    // 'setup'（最初の竿選び） | 'fishing' | 'harbor' | 'over'
            harbor: null,      // 釣り宿にいる間だけ持つ状態（報酬候補・品揃えなど）
            ascension: 0,      // 荒波レベル（竿選びのときに決める）
            maxAscension: Math.min(this.config.ascension.length, meta.clears || 0),
            startRods: this.pickRodTypes(this.config.startRodChoices, ['all']), // 最初に選べる竿のタイプ
            nushi: null,       // このラウンドのヌシ { fishId, name, caught }
            chum: 0,           // まき餌の残り投数
            region: null,      // 今いる水域
            spot: null,        // 今いる釣り場
            weather: 'clear',  // 今の天候
            highValue: null,   // 本日の高値の魚のID
            reached: false,    // このラウンドの目標を達成したか（達成後は「宿へ戻る」で釣り宿へ）
            combo: 0,          // 連続成功数
            supply: null,      // このラウンドに支給された餌 { id, count }
            stats: { casts: 0, catches: 0, escapes: 0, escapedPower: 0, zones: { red: 0, green: 0, white: 0 } },
            previousBest: meta.bestRound, // 釣り旅開始時点の最高記録
            unlockedAtStart: this.unlockLabels(meta) // 終了時に「新しく解禁」を出すため
        };
        SaveManager.recordRun(0, true);
        SaveManager.save();
        HarborUI.showRodChoice();
    },

    // 最初の竿を選んで出発する
    chooseStartRod(typeId, ascension = 0) {
        const run = this.run;
        if (!run || run.phase !== 'setup' || !run.startRods.includes(typeId)) return false;
        GameState.rodType = typeId;
        run.ascension = Math.max(0, Math.min(ascension, run.maxAscension || 0));
        // 最初の釣り場は里の水辺からランダム（天候は晴れ）
        const offers = this.createSpotOffers(1);
        this.startNextRound({ ...offers[Math.floor(Math.random() * offers.length)], weather: 'clear' });
        return true;
    },

    // 竿のタイプを重複なしで count 個選ぶ（include は必ず含める）
    pickRodTypes(count, include = []) {
        const unlocked = this.getUnlocked();
        const pool = this.config.rodTypes.map(t => t.id)
            .filter(id => !include.includes(id) && unlocked.rods.includes(id));
        const picked = [...include];
        while (picked.length < count && pool.length > 0) {
            picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        return picked;
    },

    // 中断した釣り旅を再開する。再開できなければ false
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
    // 解禁（設計書5.8）と荒波レベル
    // ========================================
    // 解禁済みの竿のタイプと特殊餌。メタ（図鑑・最高ラウンド）から毎回計算する
    getUnlocked(meta = SaveManager.loadMeta()) {
        const fishCount = Object.values(meta.encyclopedia || {}).filter(e => e && e.count > 0).length;
        const rods = ['all', 'strong'];
        const baits = ['bait_neri'];
        this.config.unlocks.forEach(u => {
            if (!this.isUnlockMet(u, fishCount, meta.bestRound || 0)) return;
            (u.kind === 'rod' ? rods : baits).push(u.id);
        });
        return { rods, baits, fishCount };
    },

    // 解禁済みの項目名の一覧
    unlockLabels(meta = SaveManager.loadMeta()) {
        const u = this.getUnlocked(meta);
        return this.config.unlocks.filter(x => (x.kind === 'rod' ? u.rods : u.baits).includes(x.id)).map(x => x.label);
    },

    isUnlockMet(unlock, fishCount, bestRound) {
        if (unlock.need.fish && fishCount < unlock.need.fish) return false;
        if (unlock.need.round && bestRound < unlock.need.round) return false;
        return true;
    },

    // 解禁条件の説明「図鑑5種」「R3到達」
    unlockNeedText(unlock) {
        return unlock.need.fish ? `図鑑${unlock.need.fish}種` : `R${unlock.need.round}クリア`;
    },

    // 今の荒波レベルで有効な条件をまとめる
    getAscensionRules(level = this.run ? this.run.ascension || 0 : 0) {
        const rules = { targetMult: 1, supplyDelta: 0, stockDelta: 0, rewardDelta: 0 };
        this.config.ascension.filter(a => a.level <= level).forEach(a => {
            if (a.targetMult) rules.targetMult += a.targetMult;
            if (a.supplyDelta) rules.supplyDelta += a.supplyDelta;
            if (a.stockDelta) rules.stockDelta += a.stockDelta;
            if (a.rewardDelta) rules.rewardDelta += a.rewardDelta;
        });
        return rules;
    },

    // ========================================
    // ラウンド
    // ========================================
    getTarget(round, weatherId = null) {
        const targets = this.config.targets;
        let raw;
        if (round <= targets.length) {
            raw = targets[round - 1];
        } else {
            // 最終ラウンド以降（エンドレス）は一定倍率で伸ばす
            raw = targets[targets.length - 1] * Math.pow(this.config.endlessGrowth, round - targets.length);
        }

        const weather = weatherId ? this.getWeather(weatherId) : null;
        if (weather) raw *= weather.targetMult;
        raw *= this.getAscensionRules().targetMult;

        // キリのいい数字に丸める（1,000未満は10G単位、それ以上は100G単位）
        const unit = raw < 1000 ? 10 : 100;
        return Math.round(raw / unit) * unit;
    },
    getWeather(weatherId) {
        return this.config.weathers.find(w => w.id === weatherId) || this.config.weathers[0];
    },

    // そのラウンドの水域
    getRegion(round) {
        let region = this.config.regions[0];
        this.config.regions.forEach(r => {
            if (round >= r.from) region = r;
        });
        return region;
    },

    // 釣り宿に並べる釣り場（そのラウンドの水域の釣り場すべて。天候と本日の高値はランダム）
    createSpotOffers(round) {
        const weathers = this.config.weathers;
        return this.getRegion(round).spots.map(spot => ({
            spot: spot.id,
            weather: weathers[Math.floor(Math.random() * weathers.length)].id,
            highValue: spot.fish[Math.floor(Math.random() * spot.fish.length)]
        }));
    },

    // 釣り場の候補に、まだ図鑑に載っていない魚がいるか
    spotHasNewFish(round, spotId) {
        const spot = this.getRegion(round).spots.find(s => s.id === spotId);
        return !!spot && spot.fish.some(id => !GameState.encyclopedia[id] || GameState.encyclopedia[id].count === 0);
    },
    // そのラウンドで支給される餌のID
    getSupplyBait(round) {
        let id = this.config.supplyBait[0].id;
        this.config.supplyBait.forEach(entry => {
            if (round >= entry.from) id = entry.id;
        });
        return id;
    },
    isNushiRound(round) {
        return this.config.nushi.rounds.includes(round);
    },

    // ヌシに使う魚: 支給餌より1つ上のランクから選ぶ（称号付きとして扱う）
    pickNushi(round) {
        const order = ['D', 'C', 'B', 'A', 'S', 'SS'];
        const supply = GAME_DATA.BAITS.find(b => b.id === this.getSupplyBait(round));
        const rank = order[Math.min(order.indexOf(supply.rank) + 1, order.length - 2)];
        const pool = GAME_DATA.FISH.filter(f => f.rarity === rank && f.specialTitle);
        const fish = pool[Math.floor(Math.random() * pool.length)];
        // won: 勝った連戦の数（逃げられても残る＝ヌシの体力）
        return { fishId: fish.id, name: `${fish.specialTitle}${fish.name}`, caught: false, won: 0 };
    },

    // この一投でヌシがかかるか（6投目以降、まだ釣っていなければ毎回）
    shouldHookNushi() {
        const run = this.run;
        if (!run || !run.nushi || run.nushi.caught) return false;
        return (run.roundCasts || 0) + 1 >= this.config.nushi.fromCast;
    },

    makeNushiFish() {
        const nushi = this.run.nushi;
        const base = GAME_DATA.FISH.find(f => f.id === nushi.fishId);
        return {
            ...base,
            name: nushi.name,
            hasTitle: true,
            isNushi: true,
            power: Math.round(base.power * this.config.nushi.powerMult),
            price: Math.floor(base.price * this.config.nushi.priceMult)
        };
    },

    onNushiCaught() {
        if (!this.run.nushi) return;
        this.run.nushi.caught = true;
        SoundManager.play('goal');
        UIManager.showNotification('ヌシを釣り上げた！', `${this.run.nushi.name}。釣り宿で特別スキルを1つ選べます`, 'emoji_events', 3000);
    },

    canFish() {
        return !!this.run && this.run.phase === 'fishing';
    },

    // 次のラウンドへ出発する
    // offer = { spot, weather, highValue }（釣り宿で選んだ釣り場）
    startNextRound(offer) {
        const run = this.run;
        run.round++;
        const region = this.getRegion(run.round);
        const spot = region.spots.find(s => s.id === offer.spot) || region.spots[0];
        const weather = this.getWeather(offer.weather);
        run.region = region.id;
        run.spot = spot.id;
        run.weather = weather.id;
        run.highValue = offer.highValue || spot.fish[0];
        run.target = this.getTarget(run.round, weather.id);
        run.earned = 0;
        run.reached = false;
        run.combo = 0;
        run.chum = 0;
        run.roundCasts = 0;
        run.phase = 'fishing';
        run.harbor = null;
        run.nushi = this.isNushiRound(run.round) ? this.pickNushi(run.round) : null;

        // 餌を支給（買った餌は持ち越し）。支給分は余るとクリア時にボーナスへ換金される
        const supplyId = this.getSupplyBait(run.round);
        // carried = 前のラウンドから持ち越した同じ餌の数（クリア時の換金で買った餌を減らさないため）
        const supplyCount = Math.max(1, this.config.baitPerRound + this.getAscensionRules().supplyDelta);
        run.supply = { id: supplyId, count: supplyCount, carried: GameState.getBaitCount(supplyId) };
        GameState.addBait(supplyId, supplyCount);
        GameState.baitType = supplyId;
        GameState.ensureUsableBait();

        // 天候「月夜」: 月のフィーバーゲージを途中から始める
        if (weather.startFever && !GameState.fever.isActive) {
            GameState.fever.type = weather.startFever.type;
            GameState.fever.value = Math.max(GameState.fever.value, weather.startFever.value);
        }

        // 天体2つ: ラウンド開始時にフィーバーゲージ+2
        if (!GameState.fever.isActive) {
            GameState.getEffectsByType('family_fever_start').forEach(e => {
                GameState.fever.value = Math.min(GameState.fever.value + e.value, 5);
            });
        }

        // 空の見た目: 天候の空、なければラウンドごとの空
        const skies = this.config.skyByRound;
        GameState.selectedSky = weather.sky || skies[(run.round - 1) % skies.length];

        FishingGame.init();
        SaveManager.save();
        UIManager.showScreen('fishing');
        UIManager.updateFeverVisuals();
        UIManager.showRoundIntro();
    },
    // 一投ごとに呼ばれる決着判定。ラウンドが終わったら true
    checkRoundEnd() {
        const run = this.run;
        if (!run || run.phase !== 'fishing') return true;

        // 目標達成: すぐには終わらず「宿へ戻る」を押すまで粘れる（ヌシのラウンドはヌシも必要）
        const nushiDone = !run.nushi || run.nushi.caught;
        if (!run.reached && run.earned >= run.target && nushiDone) {
            run.reached = true;
            SoundManager.play('goal');
            SaveManager.save();
            UIManager.updateStatus();
            UIManager.celebrateGoal();
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

    // 目標達成後に自分から釣り宿へ戻る
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
        const weather = this.getWeather(run.weather);

        // 余った支給餌はボーナスに換金（買った餌は持ち越す）。支給分から先に使った扱いにする
        const carried = run.supply.carried || 0;
        const leftover = Math.max(0, Math.min(run.supply.count, GameState.getBaitCount(run.supply.id) - carried));
        const leftoverBonus = leftover * cfg.leftoverBaitBonus * run.round;
        GameState.baitInventory[run.supply.id] -= leftover;
        const clearBonus = Math.floor(run.target * cfg.clearBonusRate);

        // 釣り宿フェーズに切り替えてから加算する（ボーナスは水揚げ額に数えない）
        run.phase = 'harbor';
        GameState.addMoney(clearBonus + leftoverBonus);
        run.lastGrade = grade.id;

        const isFinalClear = run.round === cfg.finalRound;
        SaveManager.recordRun(run.round, false, isFinalClear);
        SoundManager.play('fanfare', { grade: grade.id });

        const rules = this.getAscensionRules();
        const rewardCount = Math.max(2, grade.rewardChoices + (weather.rewardChoicesDelta || 0) + rules.rewardDelta);
        // 商売4つ: 入れ替えが毎回1回無料
        const familyRerolls = GameState.getEffectsByType('family_free_reroll').reduce((a, e) => a + e.value, 0);
        run.harbor = {
            summary: { earned: run.earned, target: run.target, grade: grade.id, clearBonus, leftover, leftoverBonus, isFinalClear },
            rewardTaken: false,
            rewardOptions: this.pickSkills(rewardCount, run.round + 1, [], grade.tierUp),
            shopSkills: [],
            baitStock: {},
            rerolls: 0,
            freeRerolls: grade.freeRerolls + familyRerolls,
            // ヌシを釣ったラウンドは特別スキルの3択
            nushiOptions: run.nushi && run.nushi.caught ? this.pickSkills(this.config.nushi.rewardChoices, run.round + 1, [], false, 0) : [],
            nushiTaken: false,
            specialBait: this.pickSpecialBait(run.round + 1),
            spotOffers: this.createSpotOffers(run.round + 1),
            // 次の素材の竿（最上位の竿なら並ばない）
            rodOffers: GAME_DATA.RODS[GameState.rodRankIndex + 1] ? this.pickRodTypes(cfg.rodOfferChoices) : []
        };
        this.restockSkills();
        cfg.baitShop.forEach(item => {
            if (item.fromRound <= run.round + 1) run.harbor.baitStock[item.id] = Math.max(1, item.stock + rules.stockDelta);
        });

        SaveManager.save();
        UIManager.showScreen('harbor');
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
        this.run.roundCasts = (this.run.roundCasts || 0) + 1;
        stats.catches++;
        this.run.combo++;
    },

    recordEscape(fish) {
        const stats = this._stats();
        if (!stats) return;
        stats.casts++;
        this.run.roundCasts = (this.run.roundCasts || 0) + 1;
        stats.escapes++;
        stats.escapedPower += fish.power;
        this.breakCombo();
    },

    recordMiss() {
        const stats = this._stats();
        if (!stats) return;
        stats.casts++;
        this.run.roundCasts = (this.run.roundCasts || 0) + 1;
        this.breakCombo();
    },

    breakCombo() {
        UIManager.breakCombo(this.run.combo);
        this.run.combo = 0;
    },
    gameOver() {
        const run = this.run;
        run.phase = 'over';
        SoundManager.play('gameover');

        // 図鑑をメタデータに反映してから釣り旅データを消す
        SaveManager.save();
        SaveManager.deleteSave();
        SaveManager.setLastRun({ round: run.round, cleared: run.round - 1, earned: GameState.totalMoneyEarned });
        const before = run.unlockedAtStart || [];
        const newUnlocks = this.unlockLabels().filter(label => !before.includes(label));
        // 最高記録はラウンドクリア時に記録済みなので、ここでは釣り旅開始時点と比べる
        HarborUI.showGameOver(run.round - 1 > run.previousBest, newUnlocks);
    },

    // 自分から釣り旅をやめる
    retire() {
        if (!this.run || this.run.phase === 'over') return;
        FishingGame.abort();
        this.run.retired = true;
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
    pickSkills(count, round, exclude = [], tierUp = false, tier = null) {
        const ids = [];
        for (let i = 0; i < count; i++) {
            const skill = this.pickSkill({ round, exclude: [...exclude, ...ids], tierUp, tier });
            if (skill) ids.push(skill.id);
        }
        return ids;
    },

    // ========================================
    // 釣り宿: 価格
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

    // 釣り宿に並べる餌（次のラウンドで解禁されているもの）
    getBaitOffers() {
        const stock = this.run.harbor.baitStock;
        return this.config.baitShop
            .filter(item => stock[item.id] !== undefined)
            .map(item => ({ ...item, stock: stock[item.id], price: this.getBaitPrice(item) }));
    },

    // 釣り宿に並べる特殊餌（解禁済みから1種）
    pickSpecialBait(round) {
        const unlocked = this.getUnlocked().baits;
        const pool = this.config.specialBaits.filter(b => unlocked.includes(b.id));
        if (pool.length === 0) return null;
        const item = pool[Math.floor(Math.random() * pool.length)];
        const price = Math.max(20, Math.round(this.getTarget(round) * item.priceRate / 10) * 10);
        return { id: item.id, quantity: item.quantity, price, sold: false };
    },

    getSpecialBaitPrice() {
        const offer = this.run.harbor.specialBait;
        return offer ? Math.floor(offer.price * (1.0 - GameState.getShopDiscount())) : 0;
    },

    // ========================================
    // 釣り宿: 操作（成功したら true。保存まで行う）
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

    chooseNushiReward(index) {
        if (!this._inHarbor()) return false;
        const harbor = this.run.harbor;
        if (harbor.nushiTaken || !harbor.nushiOptions[index]) return false;
        GameState.addSkill(harbor.nushiOptions[index]);
        harbor.nushiTaken = true;
        return this._commit();
    },

    buySpecialBait() {
        if (!this._inHarbor()) return false;
        const offer = this.run.harbor.specialBait;
        if (!offer || offer.sold) return false;
        if (!GameState.spendMoney(this.getSpecialBaitPrice())) return false;
        GameState.addBait(offer.id, offer.quantity);
        offer.sold = true;
        return this._commit();
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
        if (!this._inHarbor()) return { can: false, reason: '装備の変更は釣り宿でのみできます' };
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

    depart(index) {
        const harbor = this.run && this.run.harbor;
        if (!this._inHarbor() || !harbor.rewardTaken) return false;
        if (harbor.nushiOptions && harbor.nushiOptions.length && !harbor.nushiTaken) return false;
        const offer = harbor.spotOffers[index];
        if (!offer) return false;
        this.startNextRound(offer);
        return true;
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.RunManager = RunManager;
}
