// 釣りゲームのメインロジック
// 釣りサイクル、パワー判定、ゲージバトルを管理

const FishingGame = {
    // ========================================
    // ゲーム状態
    // ========================================
    state: 'idle',  // idle, casting, waiting, nibble, hit, gaugeBattle, result
    currentFish: null,
    gaugePosition: 0,
    gaugeDirection: 1,
    gaugeSpeed: 0,
    gaugeAnimationId: null,
    waitTimer: null,
    nibbleTimer: null,
    hitTimer: null,
    isGachaMode: false,
    gachaResults: [],

    // 餌のランクごとの、釣れる魚のランクの重み
    SPAWN_WEIGHTS: {
        'D': { D: 0.9, C: 0.1, S: 0.01 },
        'C': { C: 0.8, D: 0.2, B: 0.1 },
        'B': { B: 0.8, C: 0.2, D: 0.1, A: 0.05 },
        'A': { A: 0.6, B: 0.4, C: 0.2, S: 0.05 },
        'S': { A: 0.6, S: 0.2, B: 0.2, SS: 0.033 }
    },
    RANK_INDEX: { 'D': 0, 'C': 1, 'B': 2, 'A': 3, 'S': 4, 'SS': 5 },

    // ========================================
    // 初期化
    // ========================================
    init() {
        this.state = 'idle';
        this.currentFish = null;
        this.isGachaMode = false;
        this.battlePhase = 1; // 1 or 2
        console.log('🎣 釣りゲームを初期化しました');

        this.battlePhase = 1; // 1 or 2
        console.log('🎣 釣りゲームを初期化しました');

        // ランダムイベントループは廃止 (釣り終了時に判定)
    },

    // ========================================
    // 魚の抽選
    // ========================================
    selectFish() {
        if (this.isGachaMode) {
            // ガチャモード時はダミーの「宝箱」のような魚データを返す
            return {
                id: 'gacha_chest',
                name: '謎の宝箱',
                rarity: 'S', // 演出用
                power: 100,
                price: 0,
                icon: 'inventory_2' // 宝箱アイコン
            };
        }

        // ========================================
        // フィーバーモード (太陽) の場合: 宝箱確定
        // ========================================
        if (GameState.fever.isActive && GameState.fever.type === 'sun') {
            console.log('🔥 太陽フィーバー: 宝箱確定！');
            // 宝箱ロジックを再利用するが、100%出現させる
            // ただし、タイプ抽選は通常通り行う
            // 必要あればフィーバー用ボーナスを加算しても良い

            const weights = { WOOD: 0.6, SILVER: 0.3, GOLD: 0.1 };
            let random = Math.random();
            let selectedType = 'WOOD';

            if (random < weights.WOOD) {
                selectedType = 'WOOD';
            } else if (random < weights.WOOD + weights.SILVER) {
                selectedType = 'SILVER';
            } else {
                selectedType = 'GOLD';
            }

            const chestData = GAME_DATA.TREASURE_CONFIG.chestData[selectedType];

            return {
                id: `treasure_${selectedType.toLowerCase()}`,
                name: chestData.name,
                rarity: chestData.rarity,
                power: chestData.power,
                price: 0,
                icon: chestData.icon,
                description: chestData.description,
                isTreasure: true,
                treasureType: selectedType
            };
        }

        // ========================================
        // 宝箱の抽選 (通常)
        // ========================================
        const treasureChance = GAME_DATA.TREASURE_CONFIG.baseChance + GameState.getTreasureChanceBonus();
        // ... (既存の宝箱ログ削除)

        if (Math.random() < treasureChance) {
            // ... (既存の宝箱処理と同じ)
            const weights = { ...GAME_DATA.TREASURE_CONFIG.rarityWeights };

            // マグネットスキル判定 (木の宝箱を除外)
            if (GameState.getEffectsByType('magnet').length > 0) {
                weights.WOOD = 0;
            }

            let totalW = Object.values(weights).reduce((a, b) => a + b, 0);
            let random = Math.random() * totalW;
            let selectedType = 'WOOD';

            if (random < weights.WOOD) {
                selectedType = 'WOOD';
            } else if (random < weights.WOOD + weights.SILVER) {
                selectedType = 'SILVER';
            } else {
                selectedType = 'GOLD';
            }

            const chestData = GAME_DATA.TREASURE_CONFIG.chestData[selectedType];

            return {
                id: `treasure_${selectedType.toLowerCase()}`,
                name: chestData.name,
                rarity: chestData.rarity,
                power: chestData.power,
                price: 0,
                icon: chestData.icon,
                description: chestData.description,
                isTreasure: true,
                treasureType: selectedType
            };
        }

        const bait = GAME_DATA.BAITS.find(b => b.id === GameState.baitType) || GAME_DATA.BAITS[0]; // デフォルトD

        // 餌ごとのランク出現重み設定 (ユーザー要望に基づく)
        // ... (既存コメント)

        // ========================================
        // 上位魚確定イベント (鳥)
        // ========================================
        if (GameState.highTierGuaranteed) {
            console.log('🦅 鳥イベント効果: 上位魚確定で抽選！');

            // フラグ消費
            GameState.setHighTierGuaranteed(false);

            // 現在の餌ランクより一つ上のランクを計算
            const rankOrder = ['D', 'C', 'B', 'A', 'S', 'SS'];
            const currentRankIndex = rankOrder.indexOf(bait.rank);
            let targetRank = 'S'; // デフォルト

            if (currentRankIndex !== -1 && currentRankIndex < rankOrder.length - 1) {
                targetRank = rankOrder[currentRankIndex + 1];
            } else if (currentRankIndex === rankOrder.length - 1) {
                // 既に最高ランク(SS)の場合はSS維持（またはS以上など）
                // ここではSS維持とする
                targetRank = 'SS';
            } else {
                // 餌ランクが不明(D扱い)ならCへ
                targetRank = 'C';
            }

            console.log(`🦅 ランクアップ: ${bait.rank} -> ${targetRank} 確定`);

            // ターゲットランクの魚を抽出
            const targetPool = GAME_DATA.FISH.filter(f => f.rarity === targetRank);

            if (targetPool.length > 0) {
                // ランダムに選択 (重み考慮)
                let totalHWeight = 0;
                targetPool.forEach(f => totalHWeight += f.weight);
                let r = Math.random() * totalHWeight;

                for (const fish of targetPool) {
                    r -= fish.weight;
                    if (r < 0) {
                        return { ...fish };
                    }
                }
                return { ...targetPool[0] };
            }
        }
        // 餌ごとの出現確率DCBAS（定数を書き換えないようコピーして使う）
        let currentWeights = { ...(this.SPAWN_WEIGHTS[bait.rank] || this.SPAWN_WEIGHTS['D']) };

        // ========================================
        // フィーバーモード (月) の場合: 指定されたランク出現率を適用
        // ========================================
        if (GameState.fever.isActive && GameState.fever.type === 'moon') {
            console.log('🔥 月フィーバー: 餌ごとの刷新されたランク出現率を適用！');

            const feverWeights = {
                'D': { D: 10, C: 85, B: 1, A: 2, S: 2 },
                'C': { C: 24, B: 76 },
                'B': { B: 30, A: 70 },
                'A': { A: 70, S: 30 },
                'S': { A: 40, S: 50, SS: 10 }
            };

            currentWeights = { ...(feverWeights[bait.rank] || feverWeights['D']) };
        }

        // 海域「群れの潮」: 餌より上のランクは出ない
        const area = GameState.getCurrentArea();
        if (area && area.noUpperRank) {
            Object.keys(currentWeights).forEach(rank => {
                if (this.RANK_INDEX[rank] > this.RANK_INDEX[bait.rank]) delete currentWeights[rank];
            });
            if (Object.keys(currentWeights).length === 0) currentWeights[bait.rank] = 1;
        }


        // ========================================
        // 愛好家 (Collector) スキル補正
        // ========================================
        const collectorEffects = GameState.getEffectsByType('rank_collector');
        collectorEffects.forEach(eff => {
            if (currentWeights[eff.targetRarity] !== undefined) {
                currentWeights[eff.targetRarity] *= 10.0; // 出現率10倍
            }
        });

        // 重みに基づいてランクを抽選
        let totalWeight = 0;
        for (const r in currentWeights) {
            totalWeight += currentWeights[r];
        }

        let random = Math.random() * totalWeight;
        let selectedRarity = 'D'; // デフォルト

        for (const r in currentWeights) {
            random -= currentWeights[r];
            if (random < 0) {
                selectedRarity = r;
                break;
            }
        }

        // ========================================
        // 特殊ランクスナイパー (Rank Sniper Fixed) 判定
        // ========================================
        const sniperFixed = GameState.getEffectsByType('rank_sniper_fixed');
        if (sniperFixed.length > 0) {
            selectedRarity = sniperFixed[0].rank;
            console.log(`🎯 特殊ランクスナイパー発動: ${selectedRarity}確定`);
        }

        console.log(`🎲 ランク抽選: 餌=${bait.rank} -> 結果=${selectedRarity} (Weights: ${JSON.stringify(currentWeights)})`);

        // 選択されたランクの魚プールを作成
        const fishPool = GAME_DATA.FISH.filter(f => f.rarity === selectedRarity);

        // 万が一プールが空ならDランクから再抽選 (フェイルセーフ)
        if (fishPool.length === 0) {
            console.warn(`⚠ ランク ${selectedRarity} の魚が見つかりませんでした。Dランクから抽選します。`);
            return GAME_DATA.FISH[0];
        }

        // ========================================
        // ランクスナイパー (Rank Sniper) 判定
        // ========================================
        const penaltyStatus = GameState.getPenaltyStatus();
        if (penaltyStatus.rankSniper) {
            // ランクの強さ定義
            const rankValue = { 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5, 'SS': 6, 'GOD': 7 };
            const currentRankVal = rankValue[selectedRarity] || 0;
            const targetRankVal = rankValue[penaltyStatus.rankSniper] || 0;

            if (currentRankVal < targetRankVal) {
                console.log(`⛔ Rank Sniper: ${selectedRarity}ランクは対象外 (Min: ${penaltyStatus.rankSniper}) -> 再抽選`);
                // 条件を満たさない場合、プール内から条件を満たす魚を探すか、強制的に対象ランク以上の魚を抽選し直す
                // 簡易実装: 無理やり対象ランクの魚を抽選する
                // もしフィーバーや他の要素でランクが決まっていたとしても、スナイパーはそれを上書きする（強力な制約）

                // 対象ランク以上の魚を全候補から抽出
                const validFish = GAME_DATA.FISH.filter(f => (rankValue[f.rarity] || 0) >= targetRankVal);

                if (validFish.length > 0) {
                    // ランダムに1匹選出
                    const fallbackFish = validFish[Math.floor(Math.random() * validFish.length)];
                    return { ...fallbackFish };
                }
            }
        }

        // 同ランク内での抽選 (個別のweightを考慮)
        // レア魚出現率UPスキルの適用: 頻度が低い(weight < 15)魚の出現率を底上げ
        const rareBonus = GameState.getRareBonus();

        // プールの各魚に重みを適用
        const weightedPool = fishPool.map(f => {
            let effectiveWeight = f.weight;
            // weight < 15 は「あまり釣れない」以下 (頻度プロパティ連携)
            if (rareBonus > 0 && f.weight < 15) {
                // ボーナスを適用 (効果を実感しやすくするため係数を2.0とする)
                // 例: bonus 0.2 (+20%) -> weight * 1.4 
                effectiveWeight = f.weight * (1 + rareBonus * 2.0);
            }

            // 未登録魚ボーナス (New Fish Finder)
            const newFishBonus = GameState.getNewFishBonus();
            const isUnknown = !GameState.encyclopedia[f.id] || GameState.encyclopedia[f.id].count === 0;
            if (newFishBonus > 1.0 && isUnknown) {
                effectiveWeight *= newFishBonus;
                // console.log(`🔍 未登録ボーナス適用: ${f.name} (x${newFishBonus})`);
            }
            return { fish: f, weight: effectiveWeight };
        });

        // 総重量を計算
        let poolTotalWeight = 0;
        weightedPool.forEach(item => poolTotalWeight += item.weight);

        random = Math.random() * poolTotalWeight;
        let selectedFish = weightedPool[0].fish;

        for (const item of weightedPool) {
            random -= item.weight;
            if (random < 0) {
                selectedFish = { ...item.fish }; // コピーを作成
                break;
            }
        }

        // 称号付きの抽選
        let titleChanceMult = GameState.getTitleChanceMultiplier();

        // ユーザー要望の「特定条件下での称号確率アップ」
        if ((bait.rank === 'B' && selectedRarity === 'D') ||
            (bait.rank === 'A' && selectedRarity === 'C') ||
            (bait.rank === 'S' && selectedRarity === 'B')) {
            console.log('✨ 特定条件ボーナス: 称号確率アップ適用！');
            titleChanceMult *= 3.0; // 3倍に設定（調整可能）
        }

        // ========================================
        // フィーバーモード (月) の場合: 称号出現率超アップ
        // ========================================
        if (GameState.fever.isActive && GameState.fever.type === 'moon') {
            console.log('🔥 月フィーバー: 称号出現率超アップ！');
            titleChanceMult *= 5.0; // さらに5倍 (合計最大15倍以上)
        }

        if (Math.random() < GAME_DATA.TITLE_CONFIG.chance * titleChanceMult) {
            selectedFish.hasTitle = true;
            selectedFish.name = `${selectedFish.specialTitle}${selectedFish.name}`;
            selectedFish.price = Math.floor(selectedFish.price * GAME_DATA.TITLE_CONFIG.priceMultiplier);
            // 称号説明文があれば追加
            if (selectedFish.titleDescription) {
                selectedFish.originalDescription = selectedFish.description;
                // selectedFish.description = selectedFish.titleDescription; // 必要なら説明文も置き換え
            }
            console.log(`✨ 称号付き出現！: ${selectedFish.name} (倍率: ${titleChanceMult})`);
        }

        return selectedFish;
    },

    // ========================================
    // キャスト（ウキを投げる）
    // ========================================
    cast() {
        if (this.state !== 'idle') return false;

        // 釣りができるのはラウンド中だけ
        if (!RunManager.canFish()) return false;

        // 選択中の餌が尽きていたら残っている餌に持ち替える。全部尽きていたらラウンド終了判定へ
        if (!GameState.ensureUsableBait()) {
            RunManager.checkRoundEnd();
            return false;
        }
        UIManager.updateBaitInfo();

        this.state = 'casting';
        UIManager.showCasting();

        // ガチャモードならメッセージ上書き
        if (this.isGachaMode) {
            const area = document.getElementById('fishing-area');
            if (area) area.querySelector('.instruction').textContent = 'ガチャ実行中...';
        }

        // 魚を抽選
        this.currentFish = this.selectFish();
        console.log('🐟 抽選された魚:', this.currentFish.name);

        // 待機時間を計算
        let waitTime;
        if (this.isGachaMode) {
            waitTime = 1500; // ガチャは短め
        } else {
            // 餌を使用している場合は時間短縮
            let waitTimeReduction = 0;
            if (GameState.baitType) {
                const bait = GAME_DATA.BAITS.find(b => b.id === GameState.baitType);
                if (bait && bait.hitTimeReduction) {
                    waitTimeReduction = bait.hitTimeReduction;
                }
            }

            const baseWaitTime = GAME_DATA.FISHING_CONFIG.waitTimeMin +
                Math.random() * (GAME_DATA.FISHING_CONFIG.waitTimeMax - GAME_DATA.FISHING_CONFIG.waitTimeMin);

            // 忍耐力スキルの反映
            const patienceReduction = GameState.getWaitTimeReduction();
            waitTime = baseWaitTime * (1 - waitTimeReduction) * (1 - patienceReduction);
        }

        // キャストアニメーション後に待機状態へ
        setTimeout(() => {
            this.state = 'waiting';
            UIManager.showWaiting();

            // 待機後に予兆（ウキ揺れ）が始まる
            this.waitTimer = setTimeout(() => {
                this.nibble();
            }, waitTime);
        }, 500);

        return true;
    },

    // ========================================
    // 予兆（ウキが揺れる）
    // ========================================
    nibble(currentCount = 0, targetCount = null) {
        if (targetCount === null) {
            this.state = 'nibble';

            // ----------------------------------------
            // 波紋のサイズ計算
            // ----------------------------------------
            let rippleScale = 1.0;

            if (this.currentFish) {
                // 宝箱は小さく
                if (this.currentFish.isTreasure) {
                    rippleScale = 0.8;
                }
                // 魚の場合、ランク比較
                else {
                    const baitId = GameState.baitType;
                    const bait = GAME_DATA.BAITS.find(b => b.id === baitId);

                    const rankIndices = { 'D': 0, 'C': 1, 'B': 2, 'A': 3, 'S': 4, 'SS': 5, 'GOD': 6 };
                    const fishRankVal = rankIndices[this.currentFish.rarity] || 0;
                    const baitRankVal = bait ? (rankIndices[bait.rank] || 0) : 0; // 餌なしは最低ランク扱い

                    const rankDiff = fishRankVal - baitRankVal;

                    // ランク差に応じた係数
                    if (rankDiff >= 3) {
                        rippleScale = 2.3;
                    } else if (rankDiff === 2) {
                        rippleScale = 1.8;
                    } else if (rankDiff === 1) {
                        rippleScale = 1.5;
                    } else {
                        rippleScale = 1.0;
                    }
                }
            }

            UIManager.showNibble(rippleScale);

            if (this.isGachaMode) {
                // ガチャは2回固定
                targetCount = 2;
            } else {
                // 揺れ回数を決定
                const fixedCount = GameState.getNibbleFixCount();
                targetCount = fixedCount !== null ? fixedCount :
                    GAME_DATA.FISHING_CONFIG.nibbleCountMin +
                    Math.floor(Math.random() * (GAME_DATA.FISHING_CONFIG.nibbleCountMax - GAME_DATA.FISHING_CONFIG.nibbleCountMin + 1));
            }

            console.log(`🎣 予兆開始: 合計 ${targetCount} 回揺れます (Scale: ${rippleScale})`);
        }

        // ========================================
        // 自動ヒット (Auto Hit) 判定
        // ========================================
        // 予兆中かつ、まだヒットしていないタイミングで判定
        if (!this.isGachaMode && this.state === 'nibble') {
            const autoHitInfo = GameState.hasAutoHit();
            if (autoHitInfo.hasIt) {
                // 毎回判定すると確率が高くなりすぎるので、
                // 「最後の揺れ（＝ヒット直前）」のタイミングでのみ判定するか、
                // あるいは「揺れるたびに低確率で即ヒット」させるか。
                // Lv2: 30%, Lv3: 50% と確率が高いので、
                // 「ウキが沈む（Hit移行）」のタイミングを自動化するのが自然。
                // ここでは `hit()` を呼ぶ直前、つまり `currentCount >= targetCount` になる最後のループで判定する手もあるが、
                // "ウキ沈下時に自動ヒット" という文言からは「プレイヤーが反応しなくても勝手にHit扱いになる」と読める。
                // したがって、nibbleループが終わって hit() が呼ばれた直後に自動で catchSuccess に飛ばすのが良いかもしれない。
                // しかし、釣り味としては「ウキが沈んだ瞬間に自動クリック」が気持ちいい。
                // 
                // 実装方針: `hit()` 内で自動ヒット処理を行う。
            }
        }

        if (currentCount < targetCount) {
            // ウキを1回揺らす
            UIManager.triggerBobberShake(GAME_DATA.FISHING_CONFIG.nibbleShakeDuration);

            // ガチャなら間隔短め
            const interval = this.isGachaMode ? 400 : GAME_DATA.FISHING_CONFIG.nibbleIntervalMin +
                Math.floor(Math.random() * (GAME_DATA.FISHING_CONFIG.nibbleIntervalMax - GAME_DATA.FISHING_CONFIG.nibbleIntervalMin));

            this.nibbleTimer = setTimeout(() => {
                this.nibble(currentCount + 1, targetCount);
            }, interval);
        } else {
            // 全ての揺れが終了後にヒットタイミングへ
            this.hit();
        }
    },

    // ========================================
    // ヒット（ウキが沈む）
    // ========================================
    hit() {
        this.state = 'hit';
        UIManager.showHit();

        if (this.isGachaMode) {
            // ガチャは即座に成功
            setTimeout(() => {
                this.catchSuccess();
            }, 500);
            return;
        }

        // ========================================
        // 自動ヒット (Auto Hit) 発動判定
        // ========================================
        const autoHitInfo = GameState.hasAutoHit();
        if (autoHitInfo.hasIt) {
            if (Math.random() < autoHitInfo.chance) {
                console.log('🤖 Auto Hit 発動！');
                UIManager.showMessage('🤖 Auto Hit!', 1000);
                setTimeout(() => {
                    this.onClick(); // クリックした扱いにする
                }, 200); // 少し遅延させて人間味（？）を出す
                // returnはしない（タイマーセット後にクリックでクリアされる流れを維持）
            }
        }

        // ヒット判定可能時間を設定 (レア度とスキルによる倍率を反映)
        const config = GAME_DATA.FISHING_CONFIG;
        const rarityBase = config.hitWindowByRarity[this.currentFish.rarity] || config.hitWindowTime;
        const multiplier = GameState.getHitWindowMultiplier();
        const finalHitWindow = rarityBase * multiplier;

        console.log(`⏱ ヒット窓口: レア度ベース ${rarityBase}ms × 倍率 ${multiplier} = ${finalHitWindow}ms`);

        this.hitTimer = setTimeout(() => {
            console.log('⏰ ヒット窓口終了: 反応が遅かった');
            // 時間切れで逃げられた
            this.state = 'result';
            RunManager.recordMiss();
            UIManager.showMissed('反応が遅かった！魚に逃げられた...');

            // 餌を消費（ヒットを逃した＝失敗）
            if (GameState.baitType) {
                GameState.useBait(false);
                UIManager.updateBaitInfo();
            }

            // フィーバー中は失敗でもゲージが溜まる
            if (GameState.fever.isActive) {
                const feverResult = GameState.progressFever(true);
                UIManager.updateFeverVisuals();
                if (feverResult.message === 'end') {
                    UIManager.showMessage('💨 フィーバー終了...', 3000);
                }
            }

            // ========================================
            // 失敗ペナルティ (Timeout)
            // ========================================
            this.applyFailurePenalty();

            // 少し待ってから次の一投へ
            setTimeout(() => this.endTurn(), 1200);

        }, finalHitWindow);
    },

    // ========================================
    // クリック処理（メイン入力）
    // ========================================
    onClick() {
        if (this.isProcessing) return;
        // ガチャ中はクリック無効
        if (this.isGachaMode) return;

        switch (this.state) {
            case 'idle':
                // キャスト開始
                this.cast();
                break;

            case 'casting':
            case 'result':
                // キャスト中・結果表示中は無視
                break;

            case 'waiting':
            case 'nibble':
                // 早すぎるクリック - 失敗扱いにする
                this.cleanupTimers();
                UIManager.updateRodView('strike');
                this.earlyClickFailed();
                break;

            case 'hit':
                // ヒット成功
                if (this.hitTimer) {
                    clearTimeout(this.hitTimer);
                    this.hitTimer = null;
                }

                // バトルが発生するか先に判定
                const playerPower = GameState.getTotalPower();
                const fishPower = this.currentFish ? this.currentFish.power : 0;
                const isForcedBattle = ['A', 'S', 'SS'].includes(this.currentFish.rarity);
                const willBattle = !(playerPower >= fishPower && !isForcedBattle);

                if (willBattle) {
                    // ゲージバトルの場合は即座に開始（以前の挙動）
                    this.checkPower();
                } else {
                    // 即時釣り上げの場合は「合わせ（振り上げ）」を実行して成功へ
                    UIManager.updateRodView('strike');
                    this.checkPower();
                }
                break;

            case 'gaugeBattle':
                // ゲージバトル中のクリック
                this.resolveCatch();
                break;
        }
    },

    // ========================================
    // パワー判定
    // ========================================
    checkPower() {
        if (this.isGachaMode) {
            this.catchSuccess();
            return;
        }

        const playerPower = GameState.getTotalPower();
        const fishPower = this.currentFish ? this.currentFish.power : 0;

        if (!this.currentFish) {
            console.error('❌ currentFish is null in checkPower!');
            this.state = 'idle';
            UIManager.showIdle();
            return;
        }

        console.log(`⚡ パワー判定: プレイヤー ${playerPower} vs 魚 ${fishPower} (${this.currentFish.name})`);

        // Aランク以上は強制的にバトル発生
        const isForcedBattle = ['A', 'S', 'SS'].includes(this.currentFish.rarity);

        if (playerPower >= fishPower && !isForcedBattle) {
            // 即座に釣り上げ成功
            this.catchSuccess();
        } else {
            // ゲージバトルへ移行
            this.battlePhase = 1;
            this.startGaugeBattle(playerPower, fishPower);
        }
    },

    // ========================================
    // ゲージバトル開始
    // ========================================
    startGaugeBattle(playerPower, fishPower) {
        this.state = 'gaugeBattle';

        // パワー差に基づいてゲージ設定を計算
        // 強制バトルの場合、プレイヤーの方が強い(1.0以上)可能性があるため、最大1.0に制限
        const rawRatio = playerPower / fishPower;
        const powerRatio = Math.min(0.99, rawRatio);

        // 速度：パワー差が小さいほど遅い
        const config = GAME_DATA.GAUGE_CONFIG;
        const speedMultiplier = config.speedMultiplierMax -
            (powerRatio * (config.speedMultiplierMax - config.speedMultiplierMin));

        // スキルによる減速
        const slowBonus = GameState.getGaugeSlowBonus();
        this.gaugeSpeed = config.baseSpeed * speedMultiplier * (1 - slowBonus);

        // 赤ゾーンの幅：パワー差が小さいほど広い
        let redZoneWidth = config.redZoneWidthMin +
            (powerRatio * (config.redZoneWidthMax - config.redZoneWidthMin));

        // テクニシャンスキルの反映
        const redZoneBonus = GameState.getRedZoneBonus();
        redZoneWidth *= (1 + redZoneBonus);
        redZoneWidth = Math.min(redZoneWidth, 40); // 最大幅を制限

        // UIにゲージを表示
        const phases = ['S', 'SS'].includes(this.currentFish.rarity) ? 2 : 1;
        UIManager.showGaugeBattle(this.currentFish, redZoneWidth, {
            power: playerPower,
            matchup: this.getMatchup(this.currentFish, playerPower),
            rates: this.getZoneRates(this.currentFish, playerPower),
            phase: this.battlePhase,
            phases
        });

        // ゲージアニメーション開始
        this.gaugePosition = 0;
        this.gaugeDirection = 1;
        this.animateGauge();
    },

    // ========================================
    // ゲージアニメーション
    // ========================================
    animateGauge() {
        this.gaugePosition += this.gaugeSpeed * this.gaugeDirection;

        // 端で反転
        if (this.gaugePosition >= 100) {
            this.gaugePosition = 100;
            this.gaugeDirection = -1;
        } else if (this.gaugePosition <= 0) {
            this.gaugePosition = 0;
            this.gaugeDirection = 1;
        }

        // UIを更新
        UIManager.updateGaugePosition(this.gaugePosition);

        // 次のフレーム
        this.gaugeAnimationId = requestAnimationFrame(() => this.animateGauge());
    },

    // ========================================
    // 捕獲率の計算（ゲージ表示・港の目安・判定で共通）
    // ========================================
    // 対戦の格付け: 余裕 / 互角 / 格上 / 無謀
    getMatchup(fish, power = GameState.getTotalPower()) {
        const ratio = power / Math.max(1, fish.power);
        if (ratio >= 1.0) return { id: 'easy', label: '余裕' };
        if (ratio >= 0.7) return { id: 'even', label: '互角' };
        if (ratio >= 0.4) return { id: 'hard', label: '格上' };
        return { id: 'reckless', label: '無謀' };
    },

    // ゾーンごとの捕獲率（緑・白は範囲の平均値）
    getZoneRates(fish, power = GameState.getTotalPower(), baitId = GameState.baitType) {
        const zones = GAME_DATA.GAUGE_CONFIG.zones;
        const bonus = GameState.getCatchBonus();
        const avg = z => (z.catchRate.min + z.catchRate.max) / 2;
        const clamp = v => Math.max(0, Math.min(1, v));

        // 赤: 餌と魚のランク差とパワー差で決まる。緑+10ポイントを下限にする
        const bait = GAME_DATA.BAITS.find(b => b.id === baitId) || GAME_DATA.BAITS[0];
        const rankDiff = (this.RANK_INDEX[fish.rarity] || 0) - (this.RANK_INDEX[bait.rank] || 0);
        let base = 0.9;
        if (rankDiff === 1) base = 0.8;
        else if (rankDiff === 2) base = 0.6;
        else if (rankDiff >= 3) base = 0.4;
        const powerPenalty = Math.max(0, fish.power - power) / Math.max(1, power) * 0.5;
        let red = Math.max(base - powerPenalty, GAME_DATA.ROGUE_CONFIG.redZoneFloor);
        if (GameState.hasPerfectMaster && GameState.hasPerfectMaster()) red = 1.0;

        const isSS = fish.rarity === 'SS';  // SSは赤ゾーン以外では釣れない
        return {
            red: clamp(red + bonus),
            green: isSS ? 0 : clamp(avg(zones.green) + bonus),
            white: isSS ? 0 : clamp(avg(zones.white) + bonus)
        };
    },

    // 魚1匹を釣り上げられる確率の目安（標準的な腕前: 赤45% / 緑35% / 白20% に止める）
    estimateCatchChance(fish, power, baitId) {
        const forced = ['A', 'S', 'SS'].includes(fish.rarity);
        if (power >= fish.power && !forced) return 1;
        const r = this.getZoneRates(fish, power, baitId);
        const one = 0.45 * r.red + 0.35 * r.green + 0.2 * r.white;
        return ['S', 'SS'].includes(fish.rarity) ? one * one : one;  // S以上は2連戦
    },

    // 餌1つで1匹釣れる確率の目安（港の表示用）
    estimateBaitSuccess(baitId, power = GameState.getTotalPower()) {
        const bait = GAME_DATA.BAITS.find(b => b.id === baitId);
        const weights = this.SPAWN_WEIGHTS[bait.rank];
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let chance = 0;
        Object.entries(weights).forEach(([rank, w]) => {
            const pool = GAME_DATA.FISH.filter(f => f.rarity === rank);
            const poolWeight = pool.reduce((a, f) => a + f.weight, 0);
            pool.forEach(fish => {
                chance += (w / total) * (fish.weight / poolWeight) * this.estimateCatchChance(fish, power, baitId);
            });
        });
        return chance;
    },

    // ========================================
    // ゲージバトル解決
    // ========================================
    resolveCatch() {
        // 二重クリック防止
        this.isProcessing = true;
        cancelAnimationFrame(this.gaugeAnimationId);

        let zone = UIManager.getGaugeZone(this.gaugePosition);
        RunManager.recordZone(zone);

        // 起死回生スキル: 白ゾーンを緑扱いにすることがある
        if (zone === 'white' && Math.random() < GameState.getSecondChanceRate()) {
            zone = 'green';
            UIManager.showMessage('⚡ 起死回生！', 1000);
        }

        const power = GameState.getTotalPower();
        const rates = this.getZoneRates(this.currentFish, power);
        let catchRate = rates[zone];
        if (zone !== 'red') {
            // 緑・白は範囲内でばらつく
            const z = GAME_DATA.GAUGE_CONFIG.zones[zone];
            catchRate = Math.min(1, z.catchRate.min + Math.random() * (z.catchRate.max - z.catchRate.min) + GameState.getCatchBonus());
            if (this.currentFish.rarity === 'SS') catchRate = 0;
        }

        // 逃げられたときに表示する理由
        let reason = '';
        if (zone === 'white') reason = '白ゾーンで止めた';
        else if (zone === 'green') reason = '緑ゾーンで止めた';
        else if (power < this.currentFish.power) reason = `パワー不足（${power} 対 ${this.currentFish.power}）`;
        else reason = 'あと一歩だった';

        // 少し停止して見せてから結果を表示
        setTimeout(() => {
            this.isProcessing = false;
            UIManager.updateRodView('strike');

            if (Math.random() < catchRate) {
                // S, SSランクは2連戦
                if (['S', 'SS'].includes(this.currentFish.rarity) && this.battlePhase === 1) {
                    this.battlePhase = 2;
                    UIManager.showMessage('まだまだ！', 1000);
                    setTimeout(() => {
                        this.startGaugeBattle(GameState.getTotalPower(), this.currentFish.power);
                    }, 1000);
                } else {
                    this.catchSuccess();
                }
            } else {
                // 赤ゾーンで止めた場合はペナルティ免除（成功率の壁で逃げられただけなので）
                this.catchFailed(zone === 'red', reason);
            }
        }, 1000);
    },
    // ========================================
    // 釣り上げ成功
    // ========================================
    catchSuccess() {
        this.state = 'result';

        if (!this.currentFish) {
            console.error('❌ currentFish is null in catchSuccess!');
            this.endTurn();
            return;
        }

        const fish = this.currentFish;

        // 竿を立てて、魚（宝箱）が水面から跳ねる
        UIManager.updateRodView('success', { rarity: fish.rarity, treasure: !!fish.isTreasure });

        // 餌を消費
        GameState.useBait(true);
        UIManager.updateBaitInfo();

        // フィーバー進行
        const feverResult = GameState.progressFever();
        UIManager.updateFeverVisuals();
        if (feverResult.message === 'start') {
            UIManager.showMessage(`🔥 ${feverResult.type === 'sun' ? 'おたから' : 'おさかな'}フィーバー開始！`, 3000);
        } else if (feverResult.message === 'end') {
            UIManager.showMessage('💨 フィーバー終了...', 3000);
        }

        // 宝箱の場合
        if (fish.isTreasure) {
            GameState.totalTreasure++;
            this.processTreasureChest(fish);
            return;
        }

        // ----------------------------------------
        // 釣果数（マルチキャッチ）
        // ----------------------------------------
        let catchCount = 1;
        if (Math.random() < GameState.getMultiCatch3Chance()) {
            catchCount = 3;
        } else if (Math.random() < GameState.getMultiCatch2Chance()) {
            catchCount = 2;
        }

        // 複数釣り発動時のみ有効な追加ボーナス
        if (catchCount > 1) {
            catchCount += GameState.getMultiCatchBonusNum();
        }

        // 太公望スキル: 釣果が常に2倍
        if (GameState.getEffectsByType('master_angler_special').length > 0) {
            catchCount *= 2;
        }

        for (let i = 0; i < catchCount; i++) {
            GameState.recordCatch(fish);
        }

        // ----------------------------------------
        // その場で売却して水揚げ額に加算（コンボ補正はこの一投までの連続数で計算）
        // ----------------------------------------
        const comboBonus = GameState.getComboBonus();
        const earned = GameState.getSalePrice(fish) * catchCount;
        GameState.addMoney(earned);
        RunManager.recordCatch();

        // 称号付き: ボーナスとしてTier2以上のスキルを1つ
        const drops = [];
        if (fish.hasTitle) {
            const bonusSkill = RunManager.pickSkill({ minTier: 2 });
            if (bonusSkill) {
                GameState.addSkill(bonusSkill.id);
                drops.push({ type: 'skill', count: 1, name: bonusSkill.name });
            }
        }

        UIManager.updateStatus();
        // 称号付き・スキル獲得のときだけタップ待ち、それ以外は自動で閉じる
        const holdOpen = fish.hasTitle || drops.length > 0;
        UIManager.showCatchSuccess(fish, () => this.endTurn(true), catchCount, drops, earned, { comboBonus, autoClose: !holdOpen });

        console.log(`🎉 ${fish.name}を釣り上げた！ (x${catchCount}) +${earned}G`);
    },
    // ========================================
    // 早すぎるクリックで失敗
    // ========================================
    earlyClickFailed() {
        this.state = 'result';

        // 餌を消費
        GameState.useBait(false);
        UIManager.updateBaitInfo();

        // フィーバー中は失敗でもゲージが進む
        if (GameState.fever.isActive) {
            const feverResult = GameState.progressFever(true);
            UIManager.updateFeverVisuals();
            if (feverResult.message === 'end') {
                UIManager.showMessage('💨 フィーバー終了...', 3000);
            }
        }

        this.applyFailurePenalty();

        RunManager.recordMiss();
        UIManager.showMissed('タイミングが早すぎた！');
        console.log('💔 タイミングが早すぎた！');

        // 少し待ってから次の一投へ
        setTimeout(() => this.endTurn(), 1500);
    },
    // ========================================
    // 釣り上げ失敗
    // ========================================
    catchFailed(skipPenalty = false, reason = '') {
        // すべてのタイマーとアニメーションをクリア
        this.cleanupTimers();

        this.state = 'result';

        // 餌を消費
        GameState.useBait(false);
        UIManager.updateBaitInfo();

        // 失敗時は確定でフィーバーゲージ+1
        const feverResult = GameState.progressFever(true);
        UIManager.updateFeverVisuals();
        if (feverResult.message === 'start') {
            UIManager.showMessage(`🔥 ${feverResult.type === 'sun' ? 'おたから' : 'おさかな'}フィーバー開始！`, 3000);
        }

        if (!skipPenalty) {
            this.applyFailurePenalty();
        }

        if (this.currentFish) {
            RunManager.recordEscape(this.currentFish);
            // ユーザーが閉じたら次の一投へ
            UIManager.showCatchFailed(this.currentFish, () => this.endTurn(), reason);
            console.log(`💔 ${this.currentFish.name}に逃げられた...`);
        } else {
            RunManager.recordMiss();
            UIManager.showMissed('魚に逃げられた...');
            setTimeout(() => this.endTurn(), 1500);
        }
    },

    // ========================================
    // 一投の後始末
    // ラウンドの決着（目標達成・餌切れ）を判定し、続行なら待機状態に戻る
    // ========================================
    endTurn(allowEvent = false) {
        this.state = 'idle';
        this.currentFish = null;
        GameState.ensureUsableBait(); // 使い切った餌を選んだままにしない
        UIManager.showIdle();
        UIManager.updateStatus();
        SaveManager.save();

        if (RunManager.checkRoundEnd()) return;

        if (allowEvent) this.triggerRandomEvent();
    },
    // ========================================
    // タイマー・アニメーションのクリーンアップ
    // ========================================
    cleanupTimers() {
        clearTimeout(this.waitTimer);
        clearTimeout(this.nibbleTimer);
        clearTimeout(this.hitTimer);
        cancelAnimationFrame(this.gaugeAnimationId);
        this.waitTimer = null;
        this.nibbleTimer = null;
        this.hitTimer = null;
        this.gaugeAnimationId = null;
        this.gaugeAnimationId = null;
        this.isProcessing = false;

        // イベントループは止めない（釣り中もイベントは起きるかもしれないが、
        // 画面切り替え時などに止める必要があるなら別途stopメソッドが必要）
        // 今回はcleanupTimersは「釣りサイクルの一連の流れ」のクリアなので、
        // グローバルなイベントループはここでは止めないでおくが、
        // 念のためプロパティは定義しておく
    },

    // ========================================
    // 釣りを中断（ショップ画面に移動など）
    // ========================================
    // ========================================
    // 宝箱の中身決定と処理
    // ========================================
    processTreasureChest(chest) {
        const type = chest.treasureType;
        const lootTable = GAME_DATA.TREASURE_CONFIG.lootTables[type];
        const results = [];

        // スキル効果を取得
        let quantityMult = GameState.getTreasureQuantityMultiplier();
        let qualityMult = GameState.getTreasureQualityMultiplier();

        // 太陽フィーバーボーナス
        if (GameState.fever.isActive && GameState.fever.type === 'sun') {
            quantityMult *= 1.5;
            qualityMult *= 2.0; // スキル出現率UP
            console.log('🔥 太陽フィーバー: 報酬量・質 2倍！');
        }

        console.log(`🎁 宝箱開封: ${type}, Quantity x${quantityMult.toFixed(2)}, Quality x${qualityMult.toFixed(2)}`);

        // 永遠の熱狂 (Eternal Fever) 報酬倍率
        const feverMult = GameState.getFeverRewardMultiplier();

        // 1. お金 (量と質の両方が乗る)
        // お金はラウンドの目標額に比例させる（序盤に1個で目標達成、終盤に誤差、を防ぐ）
        const [minRate, maxRate] = GAME_DATA.ROGUE_CONFIG.treasureMoneyRate[type];
        const target = GameState.run ? GameState.run.target : 100;
        const baseMoney = Math.floor(target * (minRate + Math.random() * (maxRate - minRate)));
        const finalMoney = Math.floor(baseMoney * quantityMult * qualityMult * feverMult);

        GameState.addMoney(finalMoney);
        results.push({ type: 'money', value: finalMoney, name: `${finalMoney.toLocaleString()} G` });

        // 2. 餌
        // 2. 餌
        if (lootTable.baits && lootTable.baits.length > 0) {
            let selectedBaitConfig = null;

            // --- 優先排出ロジック ---
            const currentBaitId = GameState.baitType;
            const currentBaitData = GAME_DATA.BAITS.find(b => b.id === currentBaitId);
            const rankOrder = { 'D': 0, 'C': 1, 'B': 2, 'A': 3, 'S': 4 };
            const currentRank = currentBaitData ? (rankOrder[currentBaitData.rank] ?? -1) : -1;

            // 候補リスト作成（ランク情報を付与）
            const candidates = lootTable.baits.map(b => {
                const d = GAME_DATA.BAITS.find(db => db.id === b.id);
                return { ...b, rankValue: d ? (rankOrder[d.rank] ?? 0) : 0 };
            });

            // 上位ランクの餌のみを抽出
            const betterBaits = candidates.filter(b => b.rankValue > currentRank);

            // 上位餌があれば優先、なければ全候補
            const targetList = (betterBaits.length > 0) ? betterBaits : candidates;

            if (betterBaits.length > 0) {
                console.log(`✨ 宝箱: 装備(Rank ${currentBaitData?.rank})より上位の餌を優先します`);
            }

            // 重み計算 (質の高い餌の重みを qualityMult で増やす)
            const weightedBaits = targetList.map((b, index) => {
                let w = b.weight;
                // インデックスが大きい(=恐らくリストの下の方にある良い餌)ほどブースト
                if (index > 0) w *= qualityMult;
                return { ...b, effectiveWeight: w };
            });

            let accumulatedWeight = 0;
            weightedBaits.forEach(b => accumulatedWeight += b.effectiveWeight);

            let randomVal = Math.random() * accumulatedWeight;

            for (const b of weightedBaits) {
                randomVal -= b.effectiveWeight;
                if (randomVal < 0) {
                    selectedBaitConfig = b;
                    break;
                }
            }
            if (!selectedBaitConfig) selectedBaitConfig = weightedBaits[0];

            // 個数 (量ボーナス)
            const baseCount = selectedBaitConfig.min + Math.floor(Math.random() * (selectedBaitConfig.max - selectedBaitConfig.min + 1));
            const finalCount = Math.max(1, Math.floor(baseCount * quantityMult)); // 最低1個

            const baitData = GAME_DATA.BAITS.find(b => b.id === selectedBaitConfig.id);

            if (baitData && finalCount > 0) {
                GameState.addBait(selectedBaitConfig.id, finalCount);
                results.push({ type: 'bait', id: selectedBaitConfig.id, count: finalCount, name: baitData.name });
            }
        }

        // 3. スキル (確率)
        if (lootTable.skills && lootTable.skills.length > 0) {
            // 抽選回数 (量ボーナス)
            // quantityMult が 1.5 なら、1回確定 + 50%で2回目
            // ベースは1回抽選
            const baseRolls = 1;
            const effectiveRolls = baseRolls * quantityMult;
            const guaranteedRolls = Math.floor(effectiveRolls);
            const extraChance = effectiveRolls - guaranteedRolls;

            let totalRolls = guaranteedRolls;
            if (Math.random() < extraChance) {
                totalRolls++;
            }

            console.log(`🎁 スキル抽選回数: ${totalRolls}`);

            for (let i = 0; i < totalRolls; i++) {
                // 各ロールごとに独立して抽選
                for (const skillConfig of lootTable.skills) {
                    // 確率 (質ボーナス)
                    const effectiveChance = skillConfig.chance * qualityMult;

                    if (Math.random() < effectiveChance) {
                        // 指定Tierのスキルからランダムに1つ
                        const newSkill = RunManager.pickSkill({ tier: skillConfig.tier });
                        if (newSkill) {
                            GameState.addSkill(newSkill.id);
                            results.push({ type: 'skill', id: newSkill.id, name: newSkill.name });
                        }
                    }
                } // end loop
            } // end loop
        } // end if (lootTable.skills)

        // スロット拡張スキル抽選 (各チェストに応じたTierのものを5%で排出)
        const expansionSkillMap = {
            'WOOD': 'slot_expansion_1',
            'SILVER': 'slot_expansion_2',
            'GOLD': 'slot_expansion_3'
        };

        const expansionSkillId = expansionSkillMap[chest.treasureType];
        if (expansionSkillId) {
            // 5%の確率
            if (Math.random() < 0.05) {
                const skillData = GAME_DATA.SKILLS.find(s => s.id === expansionSkillId);
                if (skillData) {
                    // 既に持っているかチェックはGameState.addSkillで行うが、
                    // スロット拡張は重複所持意味ないので、既に持ってたらスキップするか、
                    // 予備として持たせるか（現状のシステムでは持ってるだけなら無害）
                    console.log(`✨ スロット拡張モジュール当選！: ${skillData.name}`);
                    GameState.addSkill(skillData.id);
                    results.push({ type: 'skill', id: skillData.id, name: `${skillData.name} (Rare!)` });
                }
            }
        }

        // 限定スキル抽選 (宝箱からのみ、低確率1%)
        if (Math.random() < 0.01) {
            const limitedSkillIds = [
                'nibble_fix_1',
                'nibble_fix_2',
                'nibble_fix_3',
                'nibble_fix_4',
                'sun_blessing_1',
                'sun_blessing_2',
                'sun_blessing_3',
                'sun_blessing_4',
                'moon_blessing_1',
                'moon_blessing_2',
                'moon_blessing_3',
                'moon_blessing_4',
                'perfect_master_1',
                'perfect_master_2',
                'perfect_master_3',
                'perfect_master_4'
            ];
            const targetId = limitedSkillIds[Math.floor(Math.random() * limitedSkillIds.length)];
            const skillData = GAME_DATA.SKILLS.find(s => s.id === targetId);

            if (skillData) {
                console.log(`✨ 限定スキル当選！: ${skillData.name}`);
                GameState.addSkill(skillData.id);
                results.push({ type: 'skill', id: skillData.id, name: `${skillData.name} (限定!)` });
            }
        }

        console.log('🎁 宝箱の中身:', results);

        // UI表示
        UIManager.updateStatus();
        UIManager.showTreasureResult(chest, results, () => this.endTurn());
    },

    // ========================================
    // ランダムイベント判定 (釣りが終わるたびに呼ばれる)
    // ========================================
    /*
    startRandomEventLoop() 廃止
    */

    // ========================================
    // イベント発生判定
    // ========================================
    triggerRandomEvent() {
        // 釣り画面以外ではイベントを起こさない
        if (UIManager.currentScreen !== 'fishing') return;

        const rand = Math.random();

        // 基本確率
        const baseBoatChance = 0.05;
        const baseBirdChance = 0.05;

        // スキル補正
        const boatBonus = GameState.getBoatEventBonus();
        const birdBonus = GameState.getBirdEventBonus();

        // 実際の確率
        const boatThreshold = baseBoatChance + boatBonus;
        // 鳥の判定はボートの判定の後に行うため、閾値をずらす
        const birdThreshold = boatThreshold + baseBirdChance + birdBonus;

        console.log(`🎲 イベント抽選: rand=${rand.toFixed(4)} (Boat < ${boatThreshold.toFixed(4)}, Bird < ${birdThreshold.toFixed(4)})`);

        // 確率判定
        if (rand < boatThreshold) {
            // ボートイベント
            console.log('🚢 イベント: 漁船通過');
            UIManager.showBoatEvent();

            // 効果発動
            if (GameState.fever.isActive) {
                // フィーバー中: 継続確定 (6に戻す)
                GameState.fever.value = 6;
                console.log('🔥 漁船効果: フィーバーリセット');
            } else {
                // 通常時: ゲージ+1
                const result = GameState.progressFever(true); // 確定進行
                UIManager.updateFeverVisuals();
                console.log('⚡ 漁船効果: フィーバーチャージ');

                if (result.message === 'start') {
                    UIManager.showMessage(`🔥 ${result.type === 'sun' ? 'おたから' : 'おさかな'}フィーバー開始！`, 3000);
                }
            }

        } else if (rand < birdThreshold) {
            // 鳥イベント
            console.log('🦅 イベント: 海鳥飛来');
            UIManager.showBirdEvent();

            // 効果発動: 次回上位確定
            GameState.setHighTierGuaranteed(true);
            console.log('✨ 海鳥効果: 次回上位確定');
        } else {
            console.log('🍃 イベントなし');
        }
    },

    abort() {
        this.cleanupTimers();
        this.state = 'idle';
        this.currentFish = null;
        this.isGachaMode = false; // ガチャモードも解除
    },

    // ========================================
    // 共通の失敗ペナルティ処理
    // ========================================
    applyFailurePenalty() {
        // 闇取引: 失敗するとそのラウンドの水揚げが減る（所持金からも同額を引く）
        let rate = 0;
        GameState.getEffectsByType('high_risk_sell').forEach(effect => {
            rate = Math.max(rate, effect.penaltyRate || 0);
        });
        const run = GameState.run;
        if (rate <= 0 || !run || run.phase !== 'fishing') return;

        const loss = Math.min(Math.floor(run.earned * rate), GameState.money);
        if (loss > 0) {
            run.earned -= loss;
            GameState.money -= loss;
            UIManager.showMessage(`💸 闇取引のペナルティ: -${loss.toLocaleString()} G`, 2500);
            UIManager.updateStatus();
        }
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.FishingGame = FishingGame;
}
