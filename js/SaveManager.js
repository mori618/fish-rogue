// セーブマネージャー
// localStorage に2種類のデータを保存する
//   - 航海データ: 進行中の航海（ラン）。ゲームオーバーで削除される
//   - メタデータ: 図鑑と最高記録。航海をまたいで残る

const SaveManager = {
    RUN_KEY: 'fish_rogue_run',
    META_KEY: 'fish_rogue_meta',
    VERSION: 2,

    // ========================================
    // 航海データ
    // ========================================
    save(gameState = GameState) {
        const data = {
            version: this.VERSION,
            saveDate: new Date().toISOString(),
            money: gameState.money,
            baitInventory: { ...gameState.baitInventory },
            baitType: gameState.baitType,
            run: gameState.run,
            rodRankIndex: gameState.rodRankIndex,
            rodStarLevels: { ...gameState.rodStarLevels },
            unlockedRods: [...gameState.unlockedRods],
            equippedSkills: [...gameState.equippedSkills],
            skillInventory: { ...gameState.skillInventory },
            selectedSky: gameState.selectedSky,
            totalFishCaught: gameState.totalFishCaught,
            caughtByRank: { ...gameState.caughtByRank },
            totalTreasure: gameState.totalTreasure,
            totalMoneyEarned: gameState.totalMoneyEarned,
            biggestFish: gameState.biggestFish,
            fever: { ...gameState.fever }
        };

        const savedRun = this._write(this.RUN_KEY, data);

        // 図鑑は釣るたびに増えるので、航海データと一緒にメタにも反映する
        const meta = this.loadMeta();
        meta.encyclopedia = { ...gameState.encyclopedia };
        return this._write(this.META_KEY, meta) && savedRun;
    },

    load() {
        const data = this._read(this.RUN_KEY);
        if (!data || data.version !== this.VERSION || !data.run) return null;
        return data;
    },

    hasSaveData() {
        return this.load() !== null;
    },

    deleteSave() {
        try {
            localStorage.removeItem(this.RUN_KEY);
        } catch (error) {
            console.error('❌ セーブデータの削除に失敗しました:', error);
        }
    },

    // ========================================
    // メタデータ（図鑑・最高記録）
    // ========================================
    loadMeta() {
        const meta = this._read(this.META_KEY) || {};
        return {
            encyclopedia: meta.encyclopedia || {},
            bestRound: meta.bestRound || 0,   // クリアした最大ラウンド
            totalRuns: meta.totalRuns || 0,
            clears: meta.clears || 0          // 航海達成（最終ラウンドクリア）回数
        };
    },

    // 航海の結果を記録する。最高記録を更新したら true
    recordRun(clearedRounds, isNewRun = false, isClear = false) {
        const meta = this.loadMeta();
        const isBest = clearedRounds > meta.bestRound;
        if (isBest) meta.bestRound = clearedRounds;
        if (isNewRun) meta.totalRuns++;
        if (isClear) meta.clears++;
        this._write(this.META_KEY, meta);
        return isBest;
    },

    // ========================================
    // localStorage の読み書き（失敗してもゲームは止めない）
    // ========================================
    _read(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error('❌ ロードに失敗しました:', key, error);
            return null;
        }
    },

    _write(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('❌ セーブに失敗しました:', key, error);
            return false;
        }
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.SaveManager = SaveManager;
}
