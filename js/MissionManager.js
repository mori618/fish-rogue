/**
 * MissionManager.js
 * 初心者ミッションおよび動的ミッションの管理を行う
 */

const MissionManager = {
    // ========================================
    // 初心者ミッションリストの定義
    // ========================================
    MISSIONS: [
        {
            id: 'help',
            text: 'ヘルプ（？）ボタンを押してみよう',
            rewardText: '報酬: 50G + 次のミッションへ',
            check: (type) => type === 'help_click',
            reward: () => { }
        },
        {
            id: 'catch_1',
            text: '魚を1匹釣ろう',
            rewardText: '報酬: 50G + 次のミッションへ',
            check: (type) => type === 'catch_success',
            reward: () => { }
        },
        {
            id: 'go_town',
            text: '街へ行こう',
            rewardText: '報酬: 50G + 次のミッションへ',
            check: (type) => type === 'go_town',
            reward: () => { }
        },
        {
            id: 'sell_fish',
            text: '魚を売ろう',
            rewardText: '報酬: 50G + 次のミッションへ',
            check: (type) => type === 'sell_fish',
            reward: () => { }
        },
        {
            id: 'buy_bait',
            text: '餌を買おう',
            rewardText: '報酬: 50G + 次のミッションへ',
            check: (type) => type === 'buy_bait',
            reward: () => { }
        },
        {
            id: 'catch_with_bait',
            text: '餌を変更して魚を釣ろう',
            rewardText: '報酬: 50G + スキル「釣りパワー増加I」',
            check: (type, data) => type === 'catch_success' && data.baitId !== 'bait_d',
            reward: () => {
                GameState.gainGachaResult('power_up_1');
            }
        },
        {
            id: 'equip_skill',
            text: 'スキルを装備しよう',
            rewardText: '報酬: 50G + 次のミッションへ',
            check: (type) => type === 'equip_skill',
            reward: () => { }
        },
        {
            id: 'catch_3',
            text: '魚を3匹釣ろう',
            rewardText: '最終報酬: 50G + ガチャチケット5枚',
            check: (type) => type === 'catch_success',
            requiredCount: 3,
            reward: () => {
                GameState.gachaTickets += 5;
                UIManager.updateStatus();
            }
        }
    ],

    // ========================================
    // 動的ミッションテンプレート
    // ========================================
    DYNAMIC_TEMPLATES: {
        A: [
            { id: 'fish_count', textFn: (t) => `魚を${t}匹釣る`, minTarget: 5, maxTarget: 10, baseReward: 500 }
        ],
        B: [
            { id: 'rank_fish', textFn: (t, p) => `${p}ランクの魚を${t}匹釣る`, minTarget: 5, maxTarget: 10, baseReward: 800, rankList: ['D', 'C', 'B', 'A', 'S'] },
            { id: 'freq_common', textFn: (t) => `たくさん釣れる魚を${t}匹釣る`, minTarget: 5, maxTarget: 10, baseReward: 600, freq: 'たくさん釣れる' },
            { id: 'freq_uncommon', textFn: (t) => `あまり釣れない魚を${t}匹釣る`, minTarget: 2, maxTarget: 5, baseReward: 1000, freq: 'あまり釣れない' },
            { id: 'freq_rare', textFn: (t) => `なかなか釣れない魚を${t}匹釣る`, minTarget: 1, maxTarget: 3, baseReward: 1500, freq: 'なかなか釣れない' }
        ],
        C: [
            { id: 'fever', textFn: () => 'フィーバーに入る', minTarget: 1, maxTarget: 1, baseReward: 1000 },
            { id: 'treasure', textFn: (t) => `宝箱を${t}回釣る`, minTarget: 1, maxTarget: 1, baseReward: 800 },
            { id: 'earn_money', textFn: (t) => `${t.toLocaleString()}コイン手に入れる`, minTarget: 500, maxTarget: 10000, baseReward: 500, valueOptions: [500, 1000, 2000, 5000, 10000] },
            { id: 'red_gauge', textFn: (t) => `赤ゲージで${t}回止める`, minTarget: 3, maxTarget: 5, baseReward: 700 },
            { id: 'use_bait', textFn: (t, p) => `${p}ランクの餌を${t}個使用する`, minTarget: 5, maxTarget: 10, baseReward: 600, rankList: ['D', 'C', 'B', 'A', 'S'] },
            { id: 'complete_missions', textFn: (t) => `ミッションを${t}個達成する`, minTarget: 3, maxTarget: 5, baseReward: 1200 }
        ]
    },

    // ========================================
    // アクティブな初心者ミッションを取得
    // ========================================
    getActiveBeginnerMissions() {
        const completed = GameState.beginnerMissionCompleted || [];
        // まだ完了していないミッションを抽出
        const incomplete = this.MISSIONS.filter(m => !completed.includes(m.id));
        // 最大3つまで返す
        return incomplete.slice(0, 3);
    },

    // ========================================
    // 初心者ミッションの進捗確認
    // ========================================
    checkMission(type, data = {}) {
        // アクティブなミッションがあるか確認
        const activeMissions = this.getActiveBeginnerMissions();

        if (activeMissions.length > 0) {
            let progressUpdated = false;

            activeMissions.forEach(mission => {
                if (mission.check(type, data)) {
                    // ミッション条件に合致
                    if (mission.requiredCount) {
                        // カウントが必要な場合
                        const current = GameState.beginnerMissionProgress[mission.id] || 0;
                        const next = current + 1;
                        GameState.beginnerMissionProgress[mission.id] = next;
                        progressUpdated = true;

                        if (next >= mission.requiredCount) {
                            this.completeMission(mission.id);
                        }
                    } else {
                        // 即完了の場合
                        this.completeMission(mission.id);
                    }
                }
            });

            if (progressUpdated) {
                UIManager.updateMissionUI();
                SaveManager.save(GameState);
            }
            // 動的ミッションと併行する可能性も考慮し、returnしない
        }

        // 動的ミッションの判定（初心者ミッション終了後）
        if (this.isDynamicMissionActive()) {
            this.checkDynamicMission(type, data);
        }
    },

    // 初心者ミッション達成処理
    completeMission(missionId) {
        const mission = this.MISSIONS.find(m => m.id === missionId);
        if (!mission) return;

        // 完了済みに追加
        if (!GameState.beginnerMissionCompleted.includes(missionId)) {
            GameState.beginnerMissionCompleted.push(missionId);
        }

        const rewards = [
            { icon: '💰', name: '50G' }
        ];

        // 共通報酬: 50G + 50XP
        GameState.addMoney(50);
        GameState.addExp(50);

        // ミッションごとの追加報酬を確認
        if (mission.rewardText.includes('スキル')) {
            rewards.push({ icon: '✨', name: 'スキル獲得' });
        } else if (mission.rewardText.includes('チケット')) {
            rewards.push({ icon: '🎫', name: 'ガチャチケット' });
        }

        mission.reward();

        // 以前のトースト表示を削除し、ポップアップを表示
        UIManager.showRewardPopup('ミッションクリア！', rewards, mission.text);
        // UIManager.showMessage(`ミッション達成！ ${mission.text} (+50G, +50XP)`);

        // ミッション進捗データのクリーンアップ（完了したので不要）
        delete GameState.beginnerMissionProgress[missionId];

        // 初心者ミッション全達成時、動的ミッションを初期化
        if (GameState.beginnerMissionCompleted.length >= this.MISSIONS.length) {
            // 念のため currentMissionIndex も最大にしておく（互換性やフラグとして）
            GameState.currentMissionIndex = this.MISSIONS.length;
            this.initDynamicMissions();
        }

        UIManager.updateMissionUI();
        SaveManager.save(GameState);
    },

    // 現在のミッションテキストリストを取得
    getCurrentMissionTexts() {
        const activeMissions = this.getActiveBeginnerMissions();

        if (activeMissions.length === 0) {
            return null; // 初心者ミッション完了
        }

        return activeMissions.map(mission => {
            let text = mission.text;
            if (mission.requiredCount) {
                const current = GameState.beginnerMissionProgress[mission.id] || 0;
                text += ` (${current}/${mission.requiredCount})`;
            }
            return text;
        });
    },

    // ========================================
    // 動的ミッションシステム
    // ========================================
    // ========================================
    // 動的ミッションシステム
    // ========================================
    isDynamicMissionActive() {
        // 全ての初心者ミッションが完了しているか
        const isBeginnerComplete = (GameState.beginnerMissionCompleted && GameState.beginnerMissionCompleted.length >= this.MISSIONS.length) || GameState.currentMissionIndex >= this.MISSIONS.length;

        return isBeginnerComplete && GameState.dynamicMissions !== null;
    },

    initDynamicMissions() {
        GameState.dynamicMissions = {
            A: this.generateMission('A'),
            B: this.generateMission('B'),
            C: this.generateMission('C')
        };
        UIManager.updateMissionUI();
        SaveManager.save(GameState);
    },

    generateMission(slot) {
        const templates = this.DYNAMIC_TEMPLATES[slot];
        const template = templates[Math.floor(Math.random() * templates.length)];

        let baseTarget;
        let param = null;

        // 特定のテンプレート用のパラメータ生成
        if (template.valueOptions) {
            baseTarget = template.valueOptions[Math.floor(Math.random() * template.valueOptions.length)];
        } else if (template.rankList) {
            param = template.rankList[Math.floor(Math.random() * template.rankList.length)];
            baseTarget = Math.floor(Math.random() * (template.maxTarget - template.minTarget + 1)) + template.minTarget;
        } else {
            baseTarget = Math.floor(Math.random() * (template.maxTarget - template.minTarget + 1)) + template.minTarget;
        }

        // パワースケーリング（竿パワーに応じて目標と報酬を増加）
        const playerPower = GameState.getTotalPower();
        const powerScale = Math.max(1, 1 + (playerPower - 10) / 50); // 初期パワー10基準

        // スキル効果を適用
        const targetModifier = GameState.getMissionTargetModifier();
        const rewardModifier = GameState.getMissionRewardModifier();

        // 最終目標数（パワー + スキル）
        let finalTarget = Math.max(1, Math.round(baseTarget * powerScale * targetModifier));

        // コイン系ミッションはパワースケールを強めに
        if (template.id === 'earn_money') {
            finalTarget = Math.round(baseTarget * powerScale * 1.5 * targetModifier);
        }

        const text = template.textFn(finalTarget, param);

        // 報酬計算（ランク依存）
        // 目標数はパワー依存(feasibility)、報酬はランク依存(User Request)
        const rankMultiplier = GameState.getRankRewardMultiplier();

        const isTicket = true;
        const baseRewardValue = template.baseReward * (finalTarget / template.minTarget);

        // コイン報酬には rankMultiplier を適用 (パワー倍率の代わりに)
        const scaledRewardValue = baseRewardValue * rankMultiplier * rewardModifier;

        const reward = isTicket
            ? { type: 'ticket', value: Math.max(1, Math.round(rewardModifier)) } // チケットはmodifierのみ
            : { type: 'money', value: Math.round(scaledRewardValue) };

        // 経験値報酬 (難易度/目標数に依存)
        const expReward = Math.floor(finalTarget * 10 * powerScale); // 簡易計算

        return {
            templateId: template.id,
            text: text,
            target: finalTarget,
            current: 0,
            param: param,
            reward: reward,
            exp: expReward
        };
    },

    checkDynamicMission(type, data = {}) {
        const missions = GameState.dynamicMissions;
        if (!missions) return;

        ['A', 'B', 'C'].forEach(slot => {
            const mission = missions[slot];
            if (!mission) return;

            let progress = 0;

            switch (mission.templateId) {
                case 'fish_count':
                    if (type === 'catch_success') progress = 1;
                    break;
                case 'rank_fish':
                    if (type === 'catch_success' && data.rarity === mission.param) progress = 1;
                    break;
                case 'freq_common':
                case 'freq_uncommon':
                case 'freq_rare':
                    if (type === 'catch_success' && data.frequency === this.DYNAMIC_TEMPLATES.B.find(t => t.id === mission.templateId)?.freq) progress = 1;
                    break;
                case 'fever':
                    if (type === 'fever_start') progress = 1;
                    break;
                case 'treasure':
                    if (type === 'treasure_caught') progress = 1;
                    break;
                case 'earn_money':
                    if (type === 'money_earned') progress = data.amount || 0;
                    break;
                case 'red_gauge':
                    if (type === 'red_gauge_stop') progress = 1;
                    break;
                case 'use_bait':
                    if (type === 'use_bait' && data.rank === mission.param) progress = 1;
                    break;
                case 'complete_missions':
                    if (type === 'mission_completed') progress = 1;
                    break;
            }

            if (progress > 0) {
                mission.current += progress;
                if (mission.current >= mission.target) {
                    this.completeDynamicMission(slot);
                } else {
                    UIManager.updateMissionUI();
                    SaveManager.save(GameState); // 進捗を保存
                }
            }
        });
    },

    completeDynamicMission(slot) {
        const mission = GameState.dynamicMissions[slot];
        if (!mission) return;

        const rewards = [];
        let rewardText = '';

        // 報酬付与
        if (mission.reward.type === 'ticket') {
            GameState.gachaTickets += mission.reward.value;
            rewards.push({ name: `${mission.reward.value} Tickets` });
            rewardText = `${mission.reward.value} Tickets`;
        } else {
            const money = Math.floor(mission.reward.value);
            GameState.money += money;
            rewards.push({ name: `${money.toLocaleString()} G` });
            rewardText = `${money.toLocaleString()} G`;
        }

        // 経験値付与
        if (mission.exp) {
            GameState.addExp(mission.exp);
            rewards.push({ name: `${mission.exp} XP` });
        }

        // 達成カウント増加
        GameState.dynamicMissionCompletedCount++;

        // 「ミッションをN個達成する」のチェック
        this.checkDynamicMission('mission_completed', {});

        // 次のミッション生成
        GameState.dynamicMissions[slot] = this.generateMission(slot);

        UIManager.updateStatus();
        UIManager.updateMissionUI();
        SaveManager.save(GameState);

        // 通知表示
        UIManager.showRewardPopup('MISSION COMPLETE!', rewards, mission.text);
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.MissionManager = MissionManager;
}
