// PortManager.js
// 港の自動漁獲システムを管理

const PortManager = {
    // 設定
    updateInterval: 1000, // 1秒ごとにupdateを呼ぶ想定
    fishingTimer: 0,      // 漁獲判定までのタイマー (ms)
    minutesTimer: 0,      // 燃料消費（1分）までのタイマー (ms)

    // 定数
    FISHING_INTERVAL: 300000, // 5分 (300,000ms)
    MINUTE_MS: 60000,         // 1分 (60,000ms)

    // ========================================
    // 初期化（オフライン補償処理）
    // ========================================
    init() {
        console.log('⚓ PortManager 初期化中...');

        if (!GameState.port) {
            console.warn('⚠️ GameState.port が存在しません。初期化をスキップします。');
            return;
        }

        // オフライン経過時間の計算
        const now = Date.now();
        const lastTime = GameState.port.lastProcessTime || now;
        let diffMs = now - lastTime;

        if (diffMs < 0) diffMs = 0; // 未来時刻のデータ修正

        console.log(`⏱ オフライン経過時間: ${(diffMs / 60000).toFixed(1)} 分`);

        // シミュレーション実行 (1分単位)
        let simulatedCatchCount = 0;
        let consumedFuel = 0;

        // 簡易シミュレーション: 1分ずつ処理
        // (diffMs が非常に大きい場合はパフォーマンス注意だが、ブラウザなら数万ループでも一瞬)

        let remainingDiff = diffMs;
        let currentFuel = GameState.port.fuelMinutes;

        // 漁獲タイマーの持ち越し分（前回保存してないので0スタートとするか、
        // あるいは `diffMs` をそのまま使う。ここでは `diffMs` 全体を処理する）
        // 厳密には前回 `fishingTimer` が途中だった情報を保存していないので、
        // 起動時は常に 0 からカウント開始とする（または `lastProcessTime` からの差分で判定）。

        // ここでは、1分刻みで燃料を減らし、5分刻みで漁獲判定を行う。
        // 単純化のため、ループで処理。

        let timeProcessed = 0;
        let fishTimer = 0; // 内部タイマー

        while (remainingDiff >= this.MINUTE_MS) {
            // 条件チェック
            const shipId = GameState.port.ownedShipId;
            const ship = shipId ? GAME_DATA.SHIPS.find(s => s.id === shipId) : null;
            const cap = ship ? ship.capacity : 0;
            const stockCount = GameState.port.stock.length;

            // 実行条件: 船あり、燃料あり(1以上)、容量空きあり
            if (ship && currentFuel >= 1 && stockCount < cap) {
                // 1分経過処理
                // 1分経過処理
                // エコ航行スキル判定 (getShipFuelEfficiency)
                const ecoEfficiency = GameState.getShipFuelEfficiency();
                if (GameState.hasPerpetualEngine && GameState.hasPerpetualEngine()) {
                    // 永久機関！消費なし
                } else if (Math.random() >= ecoEfficiency) {
                    // 船ごとの消費量を取得 (デフォルト1)
                    const consumption = ship.fuelConsumption || 1;
                    currentFuel -= consumption;
                    consumedFuel += consumption;
                } else {
                    // 燃料消費回避！
                }

                // 漁獲タイマー進行
                fishTimer += this.MINUTE_MS;

                // 5分経過？ 
                // 5分経過？ 
                // 漁獲間隔短縮スキル適用 (getShipIntervalMultiplier)
                const intervalMultiplier = GameState.getShipIntervalMultiplier();
                const currentInterval = this.FISHING_INTERVAL * intervalMultiplier;

                if (fishTimer >= currentInterval) {
                    fishTimer -= currentInterval;

                    // 漁獲実行
                    // stockCount はループ外の変数ではないので、シミュレーション用にローカル変数を増やすか、
                    // 実際に GameState に push する必要がある。
                    // ここでは実際に push してしまうのが確実。

                    const catchCount = this.simulateCatch(ship);
                    simulatedCatchCount += catchCount;

                    // 容量チェックはループ先頭で再度行われる
                }
            } else {
                // 稼働できない状態（燃料切れ or 満杯 or 船なし）
                // 時間だけ進める（何もしない）
                // ただし、もし「燃料切れで止まっていた」なら、燃料は減らない。
                // ここでは `remainingDiff` を減らすだけ。
            }

            remainingDiff -= this.MINUTE_MS;
            timeProcessed += this.MINUTE_MS;

            // 安全策: 無限ループ防止（念のため）
            if (timeProcessed > 31536000000) break; // 1年以上は無視
        }

        // 結果を適用 (0未満にならないよう補正)
        GameState.port.fuelMinutes = Math.max(0, currentFuel);

        // lastProcessTime を更新 (端数は切り捨てて現在時刻に合わせる、あるいは diffMs 分進める)
        // ここでは「現在時刻」に更新し、端数タイマーはリセット扱いにします（シンプル実装）。
        GameState.port.lastProcessTime = now;

        // ログ出力
        if (consumedFuel > 0 || simulatedCatchCount > 0) {
            console.log(`⚓ オフライン補償完了: 燃料消費 ${consumedFuel} (約${Math.ceil(consumedFuel / (ship ? (ship.fuelConsumption || 1) : 1))}分稼働), 漁獲 ${simulatedCatchCount}匹`);
            if (simulatedCatchCount > 0) {
                UIManager.showMessage(`おかえりなさい！\n漁船が ${simulatedCatchCount} 匹の魚を獲ってきました！`);
            }
        }
    },

    // ========================================
    // 定期更新 (毎秒呼び出し)
    // ========================================
    update() {
        if (!GameState.port) return;

        const now = Date.now();
        const lastTime = GameState.port.lastProcessTime;
        const diff = now - lastTime;

        // 1秒以上経過していたら処理 (通常は1000msごとに呼ばれるはず)
        if (diff >= 1000) {
            // 経過時間を加算
            this.fishingTimer += diff;
            this.minutesTimer += diff;

            // 処理済み時間を更新
            GameState.port.lastProcessTime = now;

            // 1分経過判定 (燃料消費)
            // 複数分経過している可能性も考慮して while
            while (this.minutesTimer >= this.MINUTE_MS) {
                this.minutesTimer -= this.MINUTE_MS;
                this.consumeFuelTick();
            }

            // 5分経過判定 (漁獲)
            // これは「燃料がある場合のみ」進むべきだが、
            // current implement sends tick regardless?
            // "燃料が1分以上あり...のみ実行" -> 
            // そのため、タイマーの加算自体を条件付きにするのが正しい。
            // しかし `lastProcessTime` は実時間管理なので、
            // 「稼働していた時間」だけタイマーを回す必要がある。

            // ロジック修正:
            // update() では `diff` を取得するが、
            // その `diff` を `fishingTimer` に加算するかどうかは稼働状態で決める。
            // `minutesTimer` (燃料タイマー) も同様。

            // ただし、「1分経過判定」自体が燃料消費のトリガーなので、卵が先か鶏が先か。
            // 仕様: 「1分経過するごとに fuelMinutes を1減らす」
            // これは「稼働しているなら1分ごとに減る」という意味。

            // 再考:
            // 1. 稼働条件チェック (船あり, 燃料>=1, 容量空き)
            // 2. OKなら `diff` を各タイマーに加算。
            // 3. タイマー発火したら処理。
        }
    },

    // 実際の実装 (修正版 update)
    // 外部から毎秒呼ばれる前提
    updateMetric(dt) { // dt: delta time in ms (e.g. 1000)
        const shipId = GameState.port.ownedShipId;
        const ship = shipId ? GAME_DATA.SHIPS.find(s => s.id === shipId) : null;
        const cap = ship ? ship.capacity : 0;
        const stockCount = GameState.port.stock.length;
        const hasFuel = GameState.port.fuelMinutes >= 1;

        // 稼働条件: 船あり && 燃料あり && 容量空きあり
        if (ship && hasFuel && stockCount < cap) {
            // タイマー進行
            this.fishingTimer += dt;
            this.minutesTimer += dt;

            // 1分経過: 燃料消費
            // エコ航行スキル判定 (getShipFuelEfficiency)
            const ecoEfficiency = GameState.getShipFuelEfficiency();

            while (this.minutesTimer >= this.MINUTE_MS) {
                this.minutesTimer -= this.MINUTE_MS;

                if (GameState.hasPerpetualEngine && GameState.hasPerpetualEngine()) {
                    // 永久機関
                } else if (Math.random() >= ecoEfficiency) {
                    // 船ごとの消費量
                    const consumption = ship.fuelConsumption || 1;
                    GameState.port.fuelMinutes -= consumption;
                }

                if (GameState.port.fuelMinutes <= 0) {
                    GameState.port.fuelMinutes = 0;
                    break;
                }
            }

            // 5分経過: 漁獲
            // 漁獲間隔短縮スキル適用 (getShipIntervalMultiplier)
            const intervalMultiplier = GameState.getShipIntervalMultiplier();
            const currentInterval = this.FISHING_INTERVAL * intervalMultiplier;

            while (this.fishingTimer >= currentInterval) {
                // 燃料切れチェック
                if (GameState.port.fuelMinutes <= 0) break;

                this.fishingTimer -= currentInterval;
                this.executeCatch(ship);

                // 容量チェック
                if (GameState.port.stock.length >= cap) break;
            }
        } else {
            // 稼働停止中はずっとタイマー停止
            // (次に燃料追加された時点から再開)
        }

        // lastProcessTime は常に現在時刻に更新しておく（オフライン判定用）
        GameState.port.lastProcessTime = Date.now();
    },

    // ========================================
    // 漁獲実行
    // ========================================
    executeCatch(ship) {
        const catchCount = this.simulateCatch(ship);
        if (catchCount > 0) {
            UIManager.showMessage(`漁船が ${catchCount} 匹の魚を獲ってきました！`);
            // UI更新通知が必要ならここで行う (UIManager.updatePortUI() など)
            if (UIManager.updatePortUI) UIManager.updatePortUI();
        }
    },

    // ========================================
    // 漁獲計算 (共通)
    // ========================================
    simulateCatch(ship) {
        if (GameState.port.stock.length >= ship.capacity) return 0;

        // 漁獲数決定 ([min, max])
        // 大型網スキル補正 (getShipAmountBonus)
        const catchBonus = GameState.getShipAmountBonus();
        const min = ship.catchAmountRange[0] + catchBonus.min;
        const max = ship.catchAmountRange[1] + catchBonus.max;
        let count = Math.floor(Math.random() * (max - min + 1)) + min;

        // 容量チェック (あふれる分は切り捨て)
        const space = ship.capacity - GameState.port.stock.length;
        if (count > space) count = space;

        if (count <= 0) return 0;

        // 対象魚の選定
        // 図鑑に登録済み && rarity <= maxRarity
        // rarity文字列比較のため、ランク値変換が必要
        // D, C, B, A, S, SS
        const rankValue = { 'D': 1, 'C': 2, 'B': 3, 'A': 4, 'S': 5, 'SS': 6 };
        const shipRankVal = rankValue[ship.maxRarity] || 1;

        // 候補リスト作成
        const candidates = GAME_DATA.FISH.filter(fish => {
            // 図鑑チェック
            const entry = GameState.encyclopedia[fish.id];
            if (!entry || !entry.caught) return false;

            // ランクチェック
            const fishRankVal = rankValue[fish.rarity] || 1;
            return fishRankVal <= shipRankVal;
        });

        if (candidates.length === 0) {
            // 候補がいない（まだ何も釣ってない、またはランク条件を満たす魚が図鑑にない）
            // 何も釣れない
            return 0;
        }

        // 重み付け抽選
        let caughtList = [];
        for (let i = 0; i < count; i++) {
            const fish = this.selectRandomFish(candidates);
            if (fish) {
                // GameState.port.stock に追加
                // stockにはオブジェクトそのものではなく、最低限の情報を入れる？
                // あるいは参照？ GameState.js の collectPortStock では fish.price を参照している。
                // 参照を入れればOK。
                GameState.port.stock.push(fish);
                caughtList.push(fish);
            }
        }

        return caughtList.length;
    },

    // リストから重み付けランダム選択
    selectRandomFish(candidates) {
        // 重み計算 (GAME_DATA.RARITY_WEIGHTS を使用)
        // さらに個別の weight があれば考慮するが、今回は RARITY_WEIGHTS 依存とする

        let totalWeight = 0;
        const weightedList = candidates.map(fish => {
            const w = GAME_DATA.RARITY_WEIGHTS[fish.rarity] || 1.0;
            totalWeight += w;
            return { fish, weight: totalWeight };
        });

        const r = Math.random() * totalWeight;
        const selected = weightedList.find(item => r < item.weight);
        return selected ? selected.fish : candidates[0];
    }
};

// グローバル公開
window.PortManager = PortManager;
