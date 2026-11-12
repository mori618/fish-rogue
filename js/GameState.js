// ゲーム状態管理
// プレイヤーの現在の状態を一元管理

const GameState = {
    // ========================================
    // 基本ステータス
    // ========================================
    money: 0,
    baitInventory: {},
    baitType: 'bait_d',

    // ========================================
    // ランク (Rank)
    // ========================================
    rank: 1,
    exp: 0,
    rankUpDialogQueue: [], // ランクアップ表示待ち行列

    // ========================================
    // 釣り竿の状態
    // ========================================
    rodRankIndex: 0,
    rodStarLevels: {},  // インデックスごとの星数 { 0: 0, 1: 0 }
    equippedSkills: [],
    skillSets: [], // 保存されたスキルセット { name: string, skills: string[] }

    // Getter for backward compatibility (current rod's stars)
    get rodStars() {
        return this.rodStarLevels[this.rodRankIndex] || 0;
    },

    set rodStars(value) {
        // Setter for migration or simple assignment
        this.rodStarLevels[this.rodRankIndex] = value;
    },

    // ========================================
    // イベント状態
    // ========================================
    highTierGuaranteed: false, // 鳥イベント用：次回上位魚確定フラグ

    // ========================================
    // インベントリ（釣った魚）
    // ========================================
    inventory: [],

    // ========================================
    // 図鑑データ
    // ========================================
    encyclopedia: {},

    // ========================================
    // アンロック状態
    // ========================================
    unlockedRods: [0],
    unlockedSkins: ['skin_default'],
    selectedSkin: 'skin_default',
    skillInventory: {}, // IDごとの所持数 { "power_up_1": 3 }
    // unlockedSkills: [], // 廃止予定 (移行用コードで処理)
    unlockedSkies: ['sky_default'],
    selectedSky: 'sky_default',
    customSkills: {}, // 合成で作られたスキルの詳細データ { "hybrid_id": { name, effect: { effects: [...] } } }

    // ========================================
    // 統計情報
    // ========================================
    totalFishCaught: 0,
    caughtByRank: { 'D': 0, 'C': 0, 'B': 0, 'A': 0, 'S': 0, 'SS': 0 },
    totalTreasure: 0,
    totalSkills: 0,
    totalMoneyEarned: 0,
    totalCoinsEarned: 0, // 売却などで獲得した純粋な利益累計
    casinoTotalWin: 0,
    casinoTotalLoss: 0,
    gachaTickets: 0,
    currentMissionIndex: 0, // 現在のミッション番号 (廃止予定/互換用)
    missionProgress: 0,     // カウントが必要なミッションの進捗 (廃止予定/互換用)

    // 新しいミッション管理
    beginnerMissionCompleted: [], // 完了したミッションIDのリスト
    beginnerMissionProgress: {},  // ミッションIDごとの進捗 { "catch_3": 1 }

    // 動的ミッションデータ
    dynamicMissions: null,   // { A: {...}, B: {...}, C: {...} }
    dynamicMissionCompletedCount: 0, // 達成ミッション数（C枠の「ミッションをN個達成する」用）

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
    // 港（Port）状態
    // ========================================
    port: {
        ownedShipId: null,
        fuelMinutes: 0,
        stock: [],
        lastProcessTime: Date.now()
    },



    // ========================================
    // 初期化
    // ========================================
    init(saveData = null) {
        if (saveData) {
            // セーブデータから復元
            this.money = saveData.player.money;
            this.highTierGuaranteed = false; // ロード時はリセット
            // 互換性チェック: 古いデータの場合は移行
            if (saveData.player.baitInventory) {
                this.baitInventory = { ...saveData.player.baitInventory };
                // 強制的にDランクは無限(-1)にする（バグ修正・保護）
                this.baitInventory['bait_d'] = -1;
            } else {
                // 旧データからの移行: 持っていた餌を現在の餌タイプに追加
                this.baitInventory = {
                    'bait_d': -1, // -1は無限
                    'bait_c': 0,
                    'bait_b': 0,
                    'bait_a': 0,
                    'bait_s': 0
                };
                if (saveData.player.baitType && saveData.player.baitCount > 0) {
                    this.baitInventory[saveData.player.baitType] = saveData.player.baitCount;
                }
            }
            this.baitType = saveData.player.baitType || 'bait_d';

            this.rodRankIndex = saveData.rod.rankIndex;

            this.rank = saveData.player.rank || 1;
            this.exp = saveData.player.exp || 0;

            // ----------------新形式データ
            // 竿レベルの移行ロジック
            // ----------------------------------------
            if (saveData.rod.rodStarLevels) {
                // 新形式データ
                this.rodStarLevels = { ...saveData.rod.rodStarLevels };
            } else {
                // 旧形式からの移行:
                // 現在持っていた星の数を、現在アンロックされている全ての竿に適用（救済措置）
                const oldStars = saveData.rod.stars || 0;
                this.rodStarLevels = {};
                (saveData.unlocked.rods || [0]).forEach(rodId => {
                    this.rodStarLevels[rodId] = oldStars;
                });
                console.log(`🔄 竿レベル移行完了: 全アンロック竿に星${oldStars}個を適用`);
            }

            this.equippedSkills = [...saveData.rod.equippedSkills];

            // スキルセットの復元
            if (saveData.player && saveData.player.skillSets) {
                this.skillSets = [...saveData.player.skillSets];
            } else {
                this.skillSets = [];
            }

            this.inventory = [...saveData.inventory];

            this.unlockedRods = [...saveData.unlocked.rods];
            // データ不整合防止: unlockedRodsにあるものは確実に初期化
            this.unlockedRods.forEach(rodId => {
                if (typeof this.rodStarLevels[rodId] === 'undefined') {
                    this.rodStarLevels[rodId] = 0;
                }
            });

            // カスタムスキルの復元
            if (saveData.unlocked.customSkills) {
                this.customSkills = { ...saveData.unlocked.customSkills };
            } else {
                this.customSkills = {};
            }

            // スキルデータの移行
            if (saveData.unlocked.skillInventory) {
                this.skillInventory = { ...saveData.unlocked.skillInventory };
            } else if (saveData.unlocked.skills) {
                // 旧データからの移行: 持っていたスキルを各1個所持として登録
                this.skillInventory = {};
                saveData.unlocked.skills.forEach(skillId => {
                    this.skillInventory[skillId] = 1;
                });
            } else {
                this.skillInventory = {};
            }

            this.totalFishCaught = saveData.statistics.totalFishCaught || 0;
            this.caughtByRank = saveData.statistics.caughtByRank || { 'D': 0, 'C': 0, 'B': 0, 'A': 0, 'S': 0, 'SS': 0 };
            this.totalTreasure = saveData.statistics.totalTreasure || 0;
            this.totalSkills = saveData.statistics.totalSkills || 0;
            this.totalMoneyEarned = saveData.statistics.totalMoneyEarned || 0;
            this.totalCoinsEarned = saveData.statistics.totalCoinsEarned || 0;
            this.casinoTotalWin = saveData.statistics.casinoTotalWin || 0;
            this.casinoTotalLoss = saveData.statistics.casinoTotalLoss || 0;
            this.gachaTickets = saveData.statistics.gachaTickets || 0;
            // console.log('Load Mission Index:', saveData.statistics.currentMissionIndex);
            this.currentMissionIndex = saveData.statistics.currentMissionIndex ?? 0;

            // --- ミッションデータの移行と復元 ---
            this.currentMissionIndex = saveData.statistics.currentMissionIndex ?? 0; // 旧データ保持用

            // 新しいミッションデータ構造
            this.beginnerMissionCompleted = saveData.statistics.beginnerMissionCompleted || [];
            this.beginnerMissionProgress = saveData.statistics.beginnerMissionProgress || {};

            // 旧データからの移行: currentMissionIndex があり、かつ新データが空の場合
            if (this.currentMissionIndex > 0 && this.beginnerMissionCompleted.length === 0) {
                // MissionManagerがまだロードされていない可能性があるため、インデックスベースで仮IDを生成するか、
                // あるいは単純に数値で管理していたものをIDリストに変換する必要がある。
                // ここではMissionManager.MISSIONSのIDが ["help", "catch_1", "go_town", ...] であると仮定して処理するが、
                // GameState単体ではIDを知り得ないため、本来はMissionManager側でマイグレーションすべきかもしれない。
                // しかし、簡便のため、MissionManagerがロード済みであることを期待するか、
                // または後でMissionManager初期化時に修正する。
                // 
                // 安全策: ここでは空のままにしておき、MissionManager.migrate() のようなメソッドで後で処理するフックを用意するか、
                // 単純に定義済みのIDリストをハードコードして移行する。

                const legacyMissionIds = ['help', 'catch_1', 'go_town', 'buy_bait', 'catch_with_bait', 'equip_skill', 'catch_3'];

                // 完了済みミッションを追加
                for (let i = 0; i < this.currentMissionIndex; i++) {
                    if (i < legacyMissionIds.length) {
                        this.beginnerMissionCompleted.push(legacyMissionIds[i]);
                    }
                }

                // 現在進行中のミッションの進捗を移行
                if (this.currentMissionIndex < legacyMissionIds.length) {
                    const currentId = legacyMissionIds[this.currentMissionIndex];
                    if (saveData.statistics.missionProgress > 0) {
                        this.beginnerMissionProgress[currentId] = saveData.statistics.missionProgress;
                    }
                }

                console.log('🔄 ミッションデータを新形式に移行しました:', this.beginnerMissionCompleted, this.beginnerMissionProgress);
            }

            this.missionProgress = saveData.statistics.missionProgress ?? 0; // 旧互換用

            this.dynamicMissions = saveData.statistics.dynamicMissions ?? null;
            this.dynamicMissionCompletedCount = saveData.statistics.dynamicMissionCompletedCount ?? 0;
            this.biggestFish = saveData.statistics.biggestFish;

            // 図鑑データを復元
            this.encyclopedia = saveData.encyclopedia ? { ...saveData.encyclopedia } : {};

            // スキン状態の復元
            this.unlockedSkins = saveData.unlocked.skins || ['skin_default'];
            this.selectedSkin = saveData.player.selectedSkin || 'skin_default';
            this.unlockedSkies = saveData.unlocked.skies || ['sky_default'];
            this.selectedSky = saveData.player.selectedSky || 'sky_default';

            // 港データの復元
            if (saveData.port) {
                this.port = {
                    ownedShipId: saveData.port.ownedShipId || null,
                    fuelMinutes: saveData.port.fuelMinutes || 0,
                    stock: saveData.port.stock || [],
                    lastProcessTime: saveData.port.lastProcessTime || Date.now()
                };
            } else {
                // 既存データへの追加
                this.port = {
                    ownedShipId: null,
                    fuelMinutes: 0,
                    stock: [],
                    lastProcessTime: Date.now()
                };
            }
        } else {
            // 新規ゲーム
            const defaultData = SaveManager.getDefaultData();
            this.init(defaultData);

            // 初期在庫の設定
            this.baitInventory = {
                'bait_d': -1, // 無限
                'bait_c': 0,
                'bait_b': 0,
                'bait_a': 0,
                'bait_s': 0
            };
            this.baitType = 'bait_d';

            this.rank = 1;
            this.exp = 0;
            // 初期スキン
            this.unlockedSkins = ['skin_default'];
            this.selectedSkin = 'skin_default';
            this.unlockedSkies = ['sky_default'];
            this.selectedSky = 'sky_default';
            // 初期港データ
            this.port = {
                ownedShipId: null,
                fuelMinutes: 0,
                stock: [],
                lastProcessTime: Date.now()
            };
            this.customSkills = {};
        }


        console.log('🎮 ゲーム状態を初期化しました');
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

    // お金操作
    addMoney(amount) {
        this.money += amount;
        if (amount > 0) {
            this.totalMoneyEarned += amount;
            this.totalCoinsEarned += amount;
            // コイン獲得ミッション判定
            if (typeof MissionManager !== 'undefined') {
                MissionManager.checkMission('money_earned', { amount: amount });
            }
        }
    },

    // 借金状態の確認
    getDebt() {
        return this.money < 0 ? Math.abs(this.money) : 0;
    },

    hasDebt() {
        return this.money < 0;
    },

    getCurrentRod() {
        return GAME_DATA.RODS[this.rodRankIndex];
    },

    // ガチャチケットを獲得
    addGachaTickets(amount) {
        if (amount <= 0) return;
        this.gachaTickets += amount;
        if (typeof UIManager !== 'undefined' && UIManager.updateStatus) {
            UIManager.updateStatus();
        }
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
    // スキルスロット数（＝星の数）
    // ========================================
    getSkillSlots() {
        let slots = this.rodStars + 1;

        // スキルによる拡張
        const slotEffects = this.getEffectsByType('skill_slot_expansion');
        slotEffects.forEach(effect => {
            slots += effect.value;
        });

        return slots;
    },

    // ========================================
    // スキルセット操作
    // ========================================

    // 現在の装備をセットとして保存
    saveCurrentSkillSet(name) {
        if (!name) return false;

        // 同じ名前があれば上書き、なければ追加
        const existingIndex = this.skillSets.findIndex(set => set.name === name);
        const newSet = {
            name: name,
            skills: [...this.equippedSkills]
        };

        if (existingIndex >= 0) {
            this.skillSets[existingIndex] = newSet;
            console.log(`💾 スキルセット更新: ${name}`);
        } else {
            this.skillSets.push(newSet);
            console.log(`💾 新規スキルセット保存: ${name}`);
        }

        // 保存
        if (typeof SaveManager !== 'undefined') {
            SaveManager.save(this);
        }
        return true;
    },

    // スキルセットを装備可能かチェック
    canEquipSkillSet(skillsArray) {
        // 1. スロット数チェック
        const currentRod = this.getCurrentRod();
        // 基本スロット = (竿の星の数) + 1
        // ※ rodStarsはgetterで現在のrodRankIndexの星の数を返す
        let maxSlots = this.rodStars + 1;

        // セット内のスキルによる拡張分を加算
        // 「セットに含まれている」拡張スキルが有効になる前提で計算する
        for (const skillId of skillsArray) {
            const skill = GAME_DATA.SKILLS.find(s => s.id === skillId);
            if (skill && skill.effect.type === 'skill_slot_expansion') {
                maxSlots += skill.effect.value;
            }
        }

        if (skillsArray.length > maxSlots) {
            return {
                can: false,
                reason: `スロット数が足りません (必要: ${skillsArray.length}, 上限: ${maxSlots})`
            };
        }

        // 2. 所持数チェック
        // 必要なスキルの数を集計
        const needed = {};
        for (const id of skillsArray) {
            needed[id] = (needed[id] || 0) + 1;
        }

        // インベントリチェック
        const missingSkills = [];
        for (const [id, count] of Object.entries(needed)) {
            const owned = this.skillInventory[id] || 0;
            if (owned < count) {
                const skillName = GAME_DATA.SKILLS.find(s => s.id === id)?.name || id;
                const missingCount = count - owned;
                missingSkills.push(`「${skillName}」x${missingCount}`);
            }
        }

        if (missingSkills.length > 0) {
            return {
                can: false,
                reason: `以下のスキルが不足しています:\n${missingSkills.join('\n')}`
            };
        }

        return { can: true };
    },

    // スキルセットを適用
    applySkillSet(index) {
        if (index < 0 || index >= this.skillSets.length) {
            return { success: false, message: '指定されたスキルセットが存在しません' };
        }

        const targetSet = this.skillSets[index];
        const check = this.canEquipSkillSet(targetSet.skills);

        if (!check.can) {
            return { success: false, message: check.reason };
        }

        // 適用
        this.equippedSkills = [...targetSet.skills];
        console.log(`✨ スキルセット「${targetSet.name}」を装備しました`);

        // 保存
        if (typeof SaveManager !== 'undefined') {
            SaveManager.save(this);
        }

        return { success: true };
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
        return Math.min(chance, 1.0); // 最大100%
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

    // ========================================
    // ランク・経験値システム
    // ========================================

    // 次のランクまでの必要経験値を計算
    getNextRankExp() {
        // Base * (Growth ^ (Rank - 1))
        return Math.floor(GAME_DATA.RANK_SYSTEM.baseExp * Math.pow(GAME_DATA.RANK_SYSTEM.expGrowthRate, this.rank - 1));
    },

    // 経験値獲得倍率を取得 (Get XP Multiplier)
    getXPMultiplier() {
        let multiplier = 1.0;

        // XP Boost Skill
        this.getEffectsByType('xp_boost').forEach(effect => {
            multiplier += effect.value;
        });

        // Stoic Skill (Trade-off)
        this.getEffectsByType('stoic').forEach(effect => {
            if (effect.exp) multiplier += effect.exp;
        });

        // Fever Mode Bonus (x2)
        if (this.fever && this.fever.isActive) {
            multiplier *= 2.0;
        }

        return Math.max(0, multiplier);
    },

    // 経験値を獲得
    addExp(amount) {
        if (amount <= 0) return;

        // Apply Multiplier
        const finalAmount = Math.floor(amount * this.getXPMultiplier());

        this.exp += finalAmount;

        // ランクアップ判定
        this.checkRankUp();

        // UI更新通知 (現状UIManagerが直接参照するか、イベント投げるか)
        if (typeof UIManager !== 'undefined' && UIManager.updateRankInfo) {
            UIManager.updateRankInfo();
        }
    },

    // ランクアップチェック (再帰的に複数回アップ対応)
    checkRankUp() {
        const required = this.getNextRankExp();

        if (this.exp >= required) {
            this.exp -= required;
            this.rank++;
            console.log(`🆙 ランクアップ！ Lv.${this.rank}`);
            this.processRankUpReward();

            // まだ経験値が残っているかもしれないので再帰チェック
            this.checkRankUp();
        }
    },

    // ランクアップ報酬処理
    processRankUpReward() {
        let rewardMultiplier = 1.0;
        this.getEffectsByType('rank_reward_boost').forEach(effect => {
            rewardMultiplier += (effect.value - 1.0);
        });

        // Actually, simpler implementation: Multiplier starts at 1. Effect adds (value).
        // If 5x skill, value is 5.
        // If I use additive: 1 + 5 = 6? No.
        // If I use max: Math.max(1, ...values).
        // Let's check other skills. 
        // cosmic_blessing: value 5.0. 
        // Let's implement as additive of (value).
        // So if default is 1x.
        // Skill 5x means +400%? Or total 500%?
        // Let's assume total multiplier matches the sum of skill values if present, or 1 if not.

        // Re-evaluating:
        // If multiple skills, usually we sum the "bonus".
        // Bonus = (Value - 1).
        // Total = 1 + Sum(Bonuses).
        // Skill 5x -> Bonus 4. Total 5.
        // Skill 5x + 10x -> Bonus 4 + 9 = 13. Total 14x.



        // Coin Reward: Rank * 100 * Multiplier
        const coinReward = Math.floor(this.rank * 100 * rewardMultiplier);
        this.addMoney(coinReward);

        // Ticket Reward: Equal to Rank * Multiplier
        const ticketReward = Math.floor(this.rank * rewardMultiplier);
        this.addGachaTickets(ticketReward);

        // 報酬をユーザーに通知するためのキューに入れる
        if (typeof UIManager !== 'undefined') {
            UIManager.showRankUp(this.rank, coinReward, ticketReward);
        }
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

    // ランクによるミッション報酬倍率 (1.0 + (Rank-1)*0.1 etc)
    getRankRewardMultiplier() {
        // 例: ランク1につき+5%
        return 1.0 + ((this.rank - 1) * 0.05);
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
    // 港スキル補正 (Port Skill Modifiers)
    // ========================================

    // 漁獲間隔短縮率 (0.0 ~ 1.0)
    // 漁獲間隔短縮 multiplier (1.0 - reduction)
    getShipIntervalMultiplier() {
        let reduction = 0;
        this.getEffectsByType('ship_interval_down').forEach(effect => {
            reduction += effect.value;
        });
        return Math.max(1.0 - reduction, 0.1); // 最低10%は残す
    },

    // 漁獲量ボーナス (min, max加算値)
    // 漁獲量ボーナス (min, max加算値)
    getShipAmountBonus() {
        let bonus = { min: 0, max: 0 };
        this.getEffectsByType('ship_amount_up').forEach(effect => {
            bonus.min += effect.min;
            bonus.max += effect.max;
        });
        return bonus;
    },

    // 燃料消費回避確率
    // 燃料消費効率 (回避確率)
    getShipFuelEfficiency() {
        let chance = 0;
        this.getEffectsByType('ship_fuel_eco').forEach(effect => {
            chance += effect.value;
        });
        return Math.min(chance, 1.0);
    },

    // 燃料購入割引率
    getPortFuelDiscount() {
        let discount = 0;
        this.getEffectsByType('ship_fuel_discount').forEach(effect => {
            discount += effect.value;
        });
        return Math.min(discount, 0.9); // 最大90%OFF
    },

    // ========================================
    // 港管理メソッド
    // ========================================

    // 船を購入
    buyShip(shipId) {
        const ship = GAME_DATA.SHIPS.find(s => s.id === shipId);
        if (!ship) {
            console.error(`Ship not found: ${shipId}`);
            return false;
        }

        if (this.money < ship.price) {
            console.log('Not enough money to buy ship');
            return false;
        }

        this.addMoney(-ship.price);
        this.port.ownedShipId = shipId;
        console.log(`Ship purchased: ${ship.name}`);
        return true;
    },

    // 燃料を追加
    addFuel(fuelId) {
        const fuel = GAME_DATA.FUELS.find(f => f.id === fuelId);
        if (!fuel) {
            console.error(`Fuel not found: ${fuelId}`);
            return false;
        }

        // 割引適用
        const discount = this.getPortFuelDiscount();
        const finalPrice = Math.floor(fuel.price * (1.0 - discount));

        if (this.money < finalPrice) {
            console.log('Not enough money to buy fuel');
            return false;
        }

        this.addMoney(-finalPrice);
        this.port.fuelMinutes += fuel.recovery;
        console.log(`Fuel added: +${fuel.recovery} mins. Total: ${this.port.fuelMinutes} mins`);
        return true;
    },

    // 港の在庫を換金
    collectPortStock() {
        if (!this.port.stock || this.port.stock.length === 0) {
            return 0;
        }

        let totalValue = 0;
        const priceBonus = this.getPriceBonus(); // 例: 0.1 (+10%), -0.2 (-20%) etc
        const priceMultiplier = 1.0 + priceBonus;

        this.port.stock.forEach(fish => {
            // 基本売価 * (1 + 補正)
            let sellPrice = Math.floor(fish.price * priceMultiplier);
            if (sellPrice < 1) sellPrice = 1;
            totalValue += sellPrice;
        });

        this.addMoney(totalValue);
        console.log(`Port stock collected: ${this.port.stock.length} fish for ${totalValue} G`);

        // 在庫クリア
        this.port.stock = [];

        return totalValue;
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
        return Math.min(chance, 1.0);
    },

    // ========================================
    // トリプルキャッチ (3匹釣り) 確率を取得
    // ========================================
    getMultiCatch3Chance() {
        let chance = 0;
        this.getEffectsByType('multi_catch_3').forEach(effect => {
            chance += effect.value;
        });
        return Math.min(chance, 1.0);
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
    // ミッション目標数の修正値を取得
    // ========================================
    getMissionTargetModifier() {
        let modifier = 1.0;

        this.getEffectsByType('stoic').forEach(effect => {
            modifier *= effect.targetMult;
        });
        this.getEffectsByType('casual').forEach(effect => {
            modifier *= effect.targetMult;
        });

        return modifier;
    },

    // ========================================
    // ミッション報酬の修正値を取得
    // ========================================
    getMissionRewardModifier() {
        let modifier = 1.0;

        this.getEffectsByType('mission_reward').forEach(effect => {
            modifier *= effect.value;
        });
        this.getEffectsByType('mission_reward_up').forEach(effect => {
            modifier += effect.value;
        });
        this.getEffectsByType('stoic').forEach(effect => {
            modifier *= effect.rewardMult;
        });
        this.getEffectsByType('casual').forEach(effect => {
            modifier *= effect.rewardMult;
        });

        // 現在のパワーを反映 (パワー100につき+10%のボーナスと仮定)
        // インフレしすぎないように調整
        const totalPower = this.getTotalPower();
        const powerBonus = totalPower / 1000.0; // パワー1000で+1.0倍(2倍)

        modifier += powerBonus;

        return Math.max(modifier, 0.1);
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
    // 魚をインベントリに追加
    // ========================================
    addFish(fish) {
        const fishData = {
            id: fish.id,
            name: fish.name,
            price: fish.price,
            power: fish.power,
            rarity: fish.rarity,
            hasTitle: fish.hasTitle || false,
            caughtAt: new Date().toISOString()
        };

        this.inventory.push(fishData);

        // 図鑑データを更新
        if (!this.encyclopedia[fish.id]) {
            this.encyclopedia[fish.id] = { count: 0, hasSpecial: false, specialCount: 0 };
        }
        this.encyclopedia[fish.id].count++;

        if (fish.hasTitle) {
            this.encyclopedia[fish.id].hasSpecial = true;
            this.encyclopedia[fish.id].specialCount = (this.encyclopedia[fish.id].specialCount || 0) + 1;
        }

        this.totalFishCaught++;

        // ランク統計の更新
        if (this.caughtByRank[fish.rarity] !== undefined) {
            this.caughtByRank[fish.rarity]++;
        }

        // 最大の魚を更新
        if (!this.biggestFish || fish.power > this.biggestFish.power) {
            this.biggestFish = { name: fish.name, power: fish.power };
        }

        // オートセーブ
        SaveManager.save(this);
    },

    // ========================================
    // ガチャ結果の受け取り（コスト消費なしでスキル追加）
    // ========================================
    // ========================================
    // ガチャ結果の受け取り
    // ========================================
    gainGachaResult(item) {
        // IDのみ渡された場合の互換性維持 (文字列かどうか判定)
        const id = (typeof item === 'string') ? item : item.id;
        const category = item.category || 'skill';

        if (category === 'skill') {
            this.skillInventory[id] = (this.skillInventory[id] || 0) + 1;
            this.totalSkills++;
        } else if (category === 'skin') {
            if (!this.unlockedSkins.includes(id)) {
                this.unlockedSkins.push(id);
            }
        } else if (category === 'sky') {
            if (!this.unlockedSkies.includes(id)) {
                this.unlockedSkies.push(id);
            }
        }

        // オートセーブ
        SaveManager.save(this);
    },

    // ========================================
    // 所持魚をすべて売却
    // ========================================
    // ========================================
    // ガチャリソース管理
    // ========================================
    canDrawGacha(cost, count) {
        // チケットで足りるかチェック
        if (this.gachaTickets >= count) return { can: true, method: 'ticket' };
        // コインで足りるかチェック
        if (this.money >= cost) return { can: true, method: 'money' };
        return { can: false };
    },

    consumeGachaResources(cost, count) {
        if (this.gachaTickets >= count) {
            this.gachaTickets -= count;
            return 'ticket';
        } else {
            this.money -= cost;
            return 'money';
        }
    },

    sellAllFish() {
        const priceBonus = this.getPriceBonus();
        const count = this.inventory.length;
        let totalEarned = 0;

        for (const fish of this.inventory) {
            const finalPrice = Math.floor(fish.price * (1 + priceBonus));
            totalEarned += finalPrice;
        }

        this.money += totalEarned;
        this.totalMoneyEarned += totalEarned;
        this.totalCoinsEarned += totalEarned;
        this.totalCoinsEarned += totalEarned;
        this.inventory = [];

        // ミッション判定: 魚を売る
        if (typeof MissionManager !== 'undefined') {
            MissionManager.checkMission('sell_fish');
            // お金を稼ぐミッション用
            MissionManager.checkMission('money_earned', { amount: totalEarned });
        }

        // オートセーブ
        SaveManager.save(this);

        // 売却時チケットドロップ判定 (sell_ticket_chance)
        // 1回売却ごとの判定か、魚1匹ごとの判定か？
        // 文言「売却時に確率で」なら売却アクション1回につき、と読めるが、
        // 「大量に売るとお得」感を出すなら魚の数に依存させたい。
        // ここでは「魚1匹につきそれぞれ抽選」だと処理が重い＆大量獲得すぎる可能性。
        // -> 「一度の売却アクションで、(魚の数/10)回抽選」のようにスケールさせる、
        // または「売却総額に応じて抽選」などが良い。
        // シンプルに: 売却した魚の数だけループして判定（確率は低めに設定されている前提）

        let earnedTickets = 0;
        let ticketChance = 0;

        // スキルから確率取得 (Tier1: 1%, Tier2: ? ...)
        for (const skillId of this.equippedSkills) {
            const skill = GAME_DATA.SKILLS.find(s => s.id === skillId);
            if (skill && skill.effect.type === 'sell_ticket_chance') {
                ticketChance += skill.effect.value;
            }
        }

        if (ticketChance > 0) {
            // まとめて計算 (二項分布的近似、または個別に回す)
            // 個別に回す方が確実
            let attemptCount = count; // 売った数だけ抽選

            // パフォーマンス考慮: 数が多い場合は近似計算も検討だが、100匹程度ならループでOK
            for (let i = 0; i < attemptCount; i++) {
                if (Math.random() < ticketChance) {
                    earnedTickets++;
                }
            }

            if (earnedTickets > 0) {
                this.gachaTickets += earnedTickets;
                UIManager.showMessage(`🎫 売却ボーナス: チケット${earnedTickets}枚を獲得！`, 3000);
            }
        }

        return totalEarned;
    },

    // ========================================
    // 釣り竿の購入
    // ========================================
    buyRod(rodIndex) {
        const rod = GAME_DATA.RODS[rodIndex];
        if (!rod) return false;

        // 割引適用
        const discount = this.getShopDiscount();
        const finalPrice = Math.floor(rod.price * (1.0 - discount));

        if (this.money < finalPrice) {
            return false;
        }

        // 既にアンロック済みならスキップ
        if (this.unlockedRods.includes(rodIndex)) {
            return false;
        }

        this.money -= finalPrice;
        this.unlockedRods.push(rodIndex);

        // スキンをアンロック
        this.unlockSkinByRodId(rod.id);

        // オートセーブ
        SaveManager.save(this);

        return true;
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

        // ミッション判定: スキルを装備
        if (typeof MissionManager !== 'undefined') {
            MissionManager.checkMission('equip_skill');
        }

        // オートセーブ
        SaveManager.save(this);
        console.log(`⚔️ スキル装備: ${skillId}`);
        return { can: true };
    },

    // スキルを解除
    unequipSkill(skillId) {
        const index = this.equippedSkills.indexOf(skillId);
        if (index === -1) return { can: false, reason: '装備していません' };

        this.equippedSkills.splice(index, 1);
        // オートセーブ
        SaveManager.save(this);
        console.log(`🛡️ スキル解除: ${skillId}`);
        return { can: true };
    },

    // ========================================
    // 空（背景）の購入
    // ========================================
    buySky(skyId) {
        const sky = GAME_DATA.SKIES.find(s => s.id === skyId);
        if (!sky) return false;

        // 割引適用
        const discount = this.getShopDiscount();
        const finalPrice = Math.floor(sky.price * (1.0 - discount));

        if (this.money < finalPrice) {
            return false;
        }

        // 既にアンロック済みならスキップ
        if (this.unlockedSkies.includes(skyId)) {
            return false;
        }

        this.money -= finalPrice;
        this.unlockedSkies.push(skyId);

        // オートセーブ
        SaveManager.save(this);

        return true;
    },

    // ========================================
    // 空（背景）の装備
    // ========================================
    equipSky(skyId) {
        if (!this.unlockedSkies.includes(skyId)) {
            return false;
        }

        this.selectedSky = skyId;
        SaveManager.save(this);
        return true;
    },

    // ========================================
    // 釣り竿の装備切り替え
    // ========================================
    equipRod(rodIndex) {
        if (!this.unlockedRods.includes(rodIndex)) {
            return false;
        }

        this.rodRankIndex = rodIndex;

        // 星の数をリセット（竿ごとに星は別管理としない場合）
        // 仕様によってはここを調整

        // 装着スキルをスロット数に合わせて調整
        while (this.equippedSkills.length > this.rodStars) {
            this.equippedSkills.pop();
        }

        SaveManager.save(this);
        return true;
    },

    // ========================================
    // 釣り竿の強化（星を増やす）
    // ========================================
    upgradeRod() {
        if (this.rodStars >= 5) {
            return { success: false, message: '既に最大まで強化されています' };
        }

        const rod = this.getCurrentRod();
        const cost = rod.upgradeCosts[this.rodStars];

        if (this.money < cost) {
            return { success: false, message: 'お金が足りません' };
        }

        this.money -= cost;
        this.rodStars++;

        // オートセーブ
        SaveManager.save(this);

        return { success: true, newStars: this.rodStars };
    },

    // ========================================
    // 次の強化コストを取得
    // ========================================
    getUpgradeCost() {
        if (this.rodStars >= 5) return null;
        const rod = this.getCurrentRod();
        let baseCost = rod.upgradeCosts[this.rodStars];

        // スキルによる割引 (upgrade_discount)
        const modifier = this.getUpgradeCostModifier(); // 1.0 (等倍) 〜 0.X (割引)

        return Math.floor(baseCost * modifier);
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
    // スキル合成 (Synthesize)
    // ========================================
    synthesizeSkills(id1, id2) {
        const skill1 = this.getSkillData(id1);
        const skill2 = this.getSkillData(id2);

        if (!skill1 || !skill2) return { success: false, message: 'スキルが見つかりません' };

        // 所持チェック
        const owned1 = this.getSkillCount(id1);
        const owned2 = this.getSkillCount(id2);
        if (id1 === id2) {
            if (owned1 < 2) return { success: false, message: '合成には同じスキルが2つ必要です' };
        } else {
            if (owned1 < 1 || owned2 < 1) return { success: false, message: '素材が足りません' };
        }

        // Tier 4は素材不可
        if (skill1.tier >= 4 || skill2.tier >= 4) {
            return { success: false, message: 'Tier 4スキルは素材にできません' };
        }

        // ハイブリッドスキルは素材にできない
        if (skill1.effect.type === 'hybrid' || skill2.effect.type === 'hybrid') {
            return { success: false, message: '合成済みスキルは素材にできません' };
        }

        let resultId, resultSkill, cost;
        const base1 = id1.replace(/_\d$/, '');
        const base2 = id2.replace(/_\d$/, '');
        const tier = skill1.tier;

        // 優先順位: 1. 特殊合成 (レシピ一致) -> 2. ランクアップ (同名) -> 3. ハイブリッド (異名)
        const key1 = base1 + '+' + base2;
        const key2 = base2 + '+' + base1;
        const specialResultBase = (skill1.tier === skill2.tier && GAME_DATA.SPECIAL_RECIPES)
            ? (GAME_DATA.SPECIAL_RECIPES[key1] || GAME_DATA.SPECIAL_RECIPES[key2])
            : null;

        if (specialResultBase) {
            // 特殊合成 (Tier無し)
            resultId = specialResultBase;
            resultSkill = GAME_DATA.SKILLS.find(s => s.id === resultId);

            if (!resultSkill) {
                return { success: false, message: '特殊スキルのデータが見つかりません' };
            }

            const specialCosts = { 1: 3000, 2: 15000, 3: 60000 };
            cost = specialCosts[tier] || 100000;
        } else if (id1 === id2) {
            // 同名ランクアップ合成
            const nextTier = skill1.tier + 1;
            resultId = `${base1}_${nextTier}`;
            resultSkill = GAME_DATA.SKILLS.find(s => s.id === resultId);

            if (!resultSkill) {
                return { success: false, message: '次のランクのスキルが定義されていません' };
            }

            // ランクアップ費用
            const costs = { 1: 1000, 2: 5000, 3: 20000 };
            cost = costs[skill1.tier] || 50000;

            // 特殊スキルのランクアップは費用増
            if (GAME_DATA.SPECIAL_RECIPES && Object.values(GAME_DATA.SPECIAL_RECIPES).includes(base1)) {
                cost *= 2;
            }
        } else {
            // 通常ハイブリッド合成
            if (skill1.tier !== skill2.tier) {
                return { success: false, message: 'Tierが一致していません' };
            }

            resultId = `hybrid_${id1}_${id2}`;
            if (id1 > id2) resultId = `hybrid_${id2}_${id1}`;

            resultSkill = {
                id: resultId,
                name: `${skill1.name.split(' ')[0]}と${skill2.name.split(' ')[0]}の融合`,
                description: `${skill1.name}と${skill2.name}の効果を併せ持つ`,
                tier: tier,
                effect: {
                    type: 'hybrid',
                    effects: [skill1.effect, skill2.effect]
                },
                isHybrid: true
            };

            const hybridCosts = { 1: 1500, 2: 7500, 3: 30000 };
            cost = hybridCosts[tier] || 75000;
        }

        if (this.money < cost) {
            return { success: false, message: `お金が足りません (必要: ${cost} G)` };
        }

        // 消費
        this.addMoney(-cost);
        this.skillInventory[id1]--;
        this.skillInventory[id2]--;

        // 獲得
        if (resultSkill.isHybrid) {
            this.customSkills[resultId] = resultSkill;
        }
        this.skillInventory[resultId] = (this.skillInventory[resultId] || 0) + 1;
        this.totalSkills++;

        SaveManager.save(this);
        return { success: true, skill: resultSkill, cost: cost };
    }
    ,

    // ========================================
    // スキルの購入
    // ========================================
    buySkill(skillId) {
        const skill = GAME_DATA.SKILLS.find(s => s.id === skillId);
        if (!skill) return false;

        // 割引適用
        const discount = this.getShopDiscount();
        const finalPrice = Math.floor(skill.price * (1.0 - discount));

        if (this.money < finalPrice) {
            return false;
        }

        this.money -= finalPrice;

        // 所持数を加算
        this.skillInventory[skillId] = (this.skillInventory[skillId] || 0) + 1;
        this.totalSkills++;

        // オートセーブ
        SaveManager.save(this);

        return true;
    },

    // ========================================
    // スキルの追加
    // ========================================
    addSkill(skillId) {
        this.skillInventory[skillId] = (this.skillInventory[skillId] || 0) + 1;
        SaveManager.save(this);
    },

    // ========================================
    // スキル所持判定
    // ========================================
    hasSkill(skillId) {
        return (this.skillInventory[skillId] || 0) > 0;
    },



    // ========================================
    // 餌の購入
    // ========================================
    buyBait(baitId, quantity = null) {
        const bait = GAME_DATA.BAITS.find(b => b.id === baitId);
        if (!bait) return false;

        // 指定数量、またはデフォルト数量
        const amount = quantity || bait.quantity;
        // 価格計算（数量指定の場合は比例計算、デフォルトの場合は設定価格）
        // 注: 現在のGAME_DATAでは単価が定義されていないため、セット価格から算出する必要があるかもですが
        // 一旦、購入時は基本セット単位とします。
        // 要望により「個数を選べる」とあるので、単価計算ロジックが必要。
        // ここでは単純に bait.price は bait.quantity 個分の価格と仮定して、単価を算出します。
        const unitPrice = bait.quantity > 0 ? bait.price / bait.quantity : 0;
        const baseTotalCost = Math.ceil(unitPrice * amount);

        // 割引適用
        const discount = this.getShopDiscount();
        const finalCost = Math.floor(baseTotalCost * (1.0 - discount));

        if (this.money < finalCost) {
            return false;
        }

        this.money -= finalCost;

        // 餌を追加
        if (this.baitInventory[baitId] === -1) {
            // 無限の場合は増えない
        } else {
            this.baitInventory[baitId] = (this.baitInventory[baitId] || 0) + amount;
        }

        // 現在選択中の餌がこれなら切り替え不要、でなければ...自動で切り替えるかはUI次第だが
        // 購入した餌をすぐに使いたいケースが多いので切り替えても良い
        this.baitType = baitId;

        // オートセーブ
        SaveManager.save(this);

        return true;
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
    // 餌の追加（宝箱などから）
    // ========================================
    addBait(baitId, amount) {
        if (!amount || amount <= 0) return;

        // 餌を追加
        if (this.baitInventory[baitId] === -1) {
            // 無限の場合は増えない
        } else {
            this.baitInventory[baitId] = (this.baitInventory[baitId] || 0) + amount;
        }

        // オートセーブ
        SaveManager.save(this);
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
    // 現在の餌の所持数を取得
    // ========================================
    getCurrentBaitCount() {
        if (!this.baitType) return 0;
        return this.baitInventory[this.baitType] ?? 0;
    },

    // ========================================
    // 餌の切り替え
    // ========================================
    switchBait(direction) {
        const baits = GAME_DATA.BAITS;
        const currentIndex = baits.findIndex(b => b.id === this.baitType);
        if (currentIndex === -1) {
            this.baitType = baits[0].id;
            return;
        }

        let nextIndex = currentIndex + direction;
        if (nextIndex >= baits.length) {
            nextIndex = 0;
        } else if (nextIndex < 0) {
            nextIndex = baits.length - 1;
        }

        this.baitType = baits[nextIndex].id;
        SaveManager.save(this);
    },

    // ========================================
    // 餌を1つ消費
    // ========================================
    useBait(isSuccess = true) {
        if (!this.baitType) return false;

        const bait = GAME_DATA.BAITS.find(b => b.id === this.baitType);
        if (!bait) return false;

        const currentCount = this.baitInventory[this.baitType];
        if (currentCount === -1) return true;

        if ((bait.rank === 'C' || bait.rank === 'B') && !isSuccess) {
            return true;
        }

        if (currentCount <= 0) return false;

        if (isSuccess) {
            const saveChance = this.getBaitSaveChance();
            if (Math.random() < saveChance) {
                console.log('✨ 餌の達人発動！');
                return true;
            }
        }

        this.baitInventory[this.baitType]--;
        SaveManager.save(this);
        return true;
    },

    // ========================================
    // スキン関連
    // ========================================
    getCurrentSkin() {
        return GAME_DATA.SKINS.find(s => s.id === this.selectedSkin) || GAME_DATA.SKINS[0];
    },

    equipSkin(skinId) {
        if (!this.unlockedSkins.includes(skinId)) return false;
        this.selectedSkin = skinId;
        SaveManager.save(this);
        return true;
    },

    unlockSkinByRodId(rodId) {
        const skin = GAME_DATA.SKINS.find(s => s.rodId === rodId);
        if (skin && !this.unlockedSkins.includes(skin.id)) {
            this.unlockedSkins.push(skin.id);
            return true;
        }
        return false;
    },

    // ========================================
    // 達人の針（赤ゾーン確定）所持判定
    // ========================================
    hasPerfectMaster() {
        return this.getEffectsByType('master_needle').length > 0;
    },

    // ========================================
    // 永久機関（燃料消費なし）所持判定
    // ========================================
    hasPerpetualEngine() {
        return this.getEffectsByType('perpetual_engine').length > 0;
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
