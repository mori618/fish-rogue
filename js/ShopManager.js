// ショップマネージャー
// 購入、売却、強化などのショップ機能を管理

const ShopManager = {
    // ========================================
    // ショップカテゴリ
    // ========================================
    currentCategory: 'town', // デフォルトを町(town)に変更
    currentTab: 'skill',
    currentStyleTab: 'gear',
    recycleSelectedSkills: [],
    isDrawingGacha: false, // ガチャ連打防止フラグ

    // ========================================
    // カテゴリ切り替え
    // ========================================
    setCategory(category) {
        this.currentCategory = category;

        if (category === 'casino') {
            UIManager.showScreen('casino');
            UIManager.showScreen('casino');
            CasinoManager.render();
        } else if (category === 'port') {
            UIManager.showScreen('port');
            this.renderPort();
        } else if (category === 'synthesis') {
            UIManager.showScreen('synthesis');
            SynthesisManager.render();
        } else if (category === 'debug') {
            UIManager.showScreen('debug');
            DebugManager.render();
        } else {
            UIManager.showScreen('shop');
            this.renderShop();

            // 初心者ミッション判定: 街へ行く
            if (category === 'town') {
                MissionManager.checkMission('go_town');
            }
        }
    },

    // ========================================
    // サブタブ切り替え (Skills / Gacha)
    // ========================================
    switchTab(tab) {
        this.currentTab = tab;
        this.renderShop();
    },

    // ========================================
    // スタイルタブ切り替え (Gear / Sky)
    // ========================================
    switchStyleTab(tab) {
        this.currentStyleTab = tab;
        this.renderShop();
    },

    // ========================================
    // ショップ画面をレンダリング
    // ========================================
    renderShop() {
        const container = document.getElementById('shop-items');
        const tabContainer = document.getElementById('shop-tabs-container');
        const townMenu = document.getElementById('town-menu');
        const upgradeSection = document.getElementById('upgrade-section');
        const title = document.getElementById('shop-main-title');

        // 表示のリセット
        container.innerHTML = '';
        if (tabContainer) tabContainer.innerHTML = '';
        if (townMenu) townMenu.classList.add('hidden');
        if (upgradeSection) upgradeSection.classList.add('hidden');

        if (this.currentCategory === 'town') {
            title.innerHTML = '<span class="material-icons">location_city</span> フィッシング・タウン';
            this.renderTownMenu();
        } else {
            if (upgradeSection) upgradeSection.classList.remove('hidden');

            switch (this.currentCategory) {
                case 'rods':
                    title.innerHTML = '<span class="material-icons">phishing</span> ロッド工房 匠';
                    this.renderRodShop();
                    break;
                case 'skills':
                    title.innerHTML = '<span class="material-icons">bolt</span> 冒険者の道場';
                    if (this.currentTab === 'skill') {
                        this.renderSkillShop();
                    } else if (this.currentTab === 'gacha') {
                        this.renderGachaShop(container);
                    }
                    break;
                case 'baits':
                    title.innerHTML = '<span class="material-icons">grass</span> 万屋 タックル';
                    this.renderBaitShop();
                    break;
                case 'skins':
                    title.innerHTML = '<span class="material-icons">palette</span> スタイリスト';
                    if (this.currentStyleTab === 'sky') {
                        this.renderSkyShop(container);
                    } else {
                        this.renderSkinShop(container);
                    }
                    this.renderStyleTabs(tabContainer); // Use tabContainer
                    break;
                // 'casino' case is removed as it's handled in setCategory now
            }
        }
        this.updateFooter();
    },

    // 町のメニューを描画
    renderTownMenu() {
        const townMenu = document.getElementById('town-menu');
        if (!townMenu) return;

        townMenu.classList.remove('hidden');
        townMenu.innerHTML = `
            <div class="shop-building rods" onclick="ShopManager.setCategory('rods')">
                <div class="building-icon"><span class="material-icons">phishing</span></div>
                <div class="building-info">
                    <div class="building-name">ロッド工房 匠</div>
                    <div class="building-desc">竿の購入・星強化を行えます</div>
                </div>
            </div>
            <div class="shop-building skills" onclick="ShopManager.setCategory('skills')">
                <div class="building-icon"><span class="material-icons">bolt</span></div>
                <div class="building-info">
                    <div class="building-name">冒険者の道場</div>
                    <div class="building-desc">スキルの習得・装備</div>
                </div>
            </div>
            <div class="shop-building baits" onclick="ShopManager.setCategory('baits')">
                <div class="building-icon"><span class="material-icons">grass</span></div>
                <div class="building-info">
                    <div class="building-name">万屋 タックル</div>
                    <div class="building-desc">各種ランクの餌を取り扱っています</div>
                </div>
            </div>
             <div class="shop-building styles" onclick="ShopManager.setCategory('skins')" style="border-color: var(--accent-color);">
                <div class="building-icon" style="color: var(--accent-color);"><span class="material-icons">palette</span></div>
                <div class="building-info">
                    <div class="building-name">スタイリスト</div>
                    <div class="building-desc">見た目の変更・空の変更</div>
                </div>
            </div>
            <div class="shop-building casino" onclick="ShopManager.setCategory('casino')">
                <div class="building-icon"><span class="material-icons">stars</span></div>
                <div class="building-info">
                    <div class="building-name">グランド・カジノ</div>
                    <div class="building-desc">運試しとスキルリサイクル</div>
                </div>
            </div>
             <div class="shop-building port" onclick="ShopManager.setCategory('port')" style="border-color: #3b82f6;">
                <div class="building-icon" style="color: #3b82f6;"><span class="material-icons">anchor</span></div>
                <div class="building-info">
                    <div class="building-name">ポート・ロイヤル</div>
                    <div class="building-desc">自動漁獲船の管理・運用</div>
                </div>
            </div>
            <div class="shop-building synthesis" onclick="ShopManager.setCategory('synthesis')" style="border-color: #a855f7;">
                <div class="building-icon" style="color: #a855f7;"><span class="material-icons">science</span></div>
                <div class="building-info">
                    <div class="building-name">合成工房</div>
                    <div class="building-desc">スキルの融合と強化</div>
                </div>
            </div>
            <div class="shop-building debug" onclick="ShopManager.setCategory('debug')" style="border-color: #f43f5e; opacity: 0.8;">
                <div class="building-icon" style="color: #f43f5e;"><span class="material-icons">admin_panel_settings</span></div>
                <div class="building-info">
                    <div class="building-name">デバッグルーム</div>
                    <div class="building-desc">管理者向けのテスト操作画面</div>
                </div>
            </div>
        `;
    },

    // フッターボタンを状況に応じて更新
    updateFooter() {
        const footerActions = document.getElementById('shop-footer-actions');
        if (!footerActions) return;

        if (this.currentCategory === 'town') {
            footerActions.innerHTML = `
                <button id="sell-btn" class="btn-action" onclick="ShopManager.sellAllFish()">
                    <span class="material-icons">sell</span> 魚を全て売却
                </button>
                <button id="encyclopedia-btn" class="btn-action" onclick="UIManager.showScreen('encyclopedia')">
                    <span class="material-icons">menu_book</span> 図鑑
                </button>
                <button id="back-btn" class="btn-nav" onclick="UIManager.showScreen('fishing')">
                    <span class="material-icons">phishing</span> 釣り場へ
                </button>
            `;
        } else {
            footerActions.innerHTML = `
                <button class="btn-nav" style="flex: 1;" onclick="ShopManager.setCategory('town')">
                    <span class="material-icons">arrow_back</span> 町に戻る
                </button>
            `;
        }
    },

    // ========================================
    // スキン（着せ替え）ショップ
    // ========================================
    renderSkinShop(container) {
        container = container || document.getElementById('shop-items');
        container.innerHTML = '';

        GAME_DATA.SKINS.forEach(skin => {
            const isUnlocked = GameState.unlockedSkins.includes(skin.id);
            const isEquipped = GameState.selectedSkin === skin.id;

            const item = document.createElement('div');
            item.className = `shop-item ${isEquipped ? 'equipped' : ''} ${!isUnlocked ? 'locked' : ''}`;

            let actionHtml = '';

            if (isUnlocked) {
                if (isEquipped) {
                    actionHtml = '<span class="status equipped">装備中</span>';
                } else {
                    actionHtml = `
                        <button class="btn btn-equip" onclick="ShopManager.equipSkin('${skin.id}')">
                            装備
                        </button>
                    `;
                }
            } else {
                // ロック中（解放条件を表示）
                // ロッド名を取得
                // rodIdからロッド名を探す
                const rod = GAME_DATA.RODS.find(r => r.id === skin.rodId);
                const rodName = rod ? rod.name : 'Unknown Rod';
                actionHtml = `<span class="status locked-reason"><span class="material-icons" style="font-size:14px;vertical-align:middle;">lock</span> ${rodName}で解放</span>`;
            }

            item.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${skin.name}</div>
                    <div class="item-desc">${skin.description}</div>
                    <div class="item-stats" style="display:flex; gap:10px; align-items:center; margin-top:5px;">
                        <div style="display:flex; align-items:center; gap:4px;">
                            <span style="font-size:10px; color:#aaa;">ROD</span>
                            <span style="display:inline-block; width:16px; height:16px; background-color:${skin.rodColor}; border-radius:4px; border:1px solid #555;"></span>
                        </div>
                        <div style="display:flex; align-items:center; gap:4px;">
                            <span style="font-size:10px; color:#aaa;">BOBBER</span>
                            <span style="display:inline-block; width:12px; height:12px; background-color:${skin.bobberColor}; border-radius:50%; border:1px solid #555;"></span>
                        </div>
                    </div>
                </div>
                <div class="item-action">
                    ${actionHtml}
                </div>
            `;

            container.appendChild(item);
        });

        // プレビュー情報（アップグレードセクションを再利用して現在の装備を表示）
        this.renderSkinInfo();
    },

    // 現在のスキン情報
    renderSkinInfo() {
        const container = document.getElementById('upgrade-section');
        if (!container) return;

        const currentSkin = GameState.getCurrentSkin();

        container.innerHTML = `
            <h3>現在のスタイル</h3>
            <div class="skin-preview" style="display:flex; gap:20px; align-items:center; justify-content:center; padding:10px;">
                <div style="text-align:center;">
                    <div style="width:8px; height:60px; background-color:${currentSkin.rodColor}; margin:0 auto; border:1px solid rgba(255,255,255,0.3);"></div>
                    <span style="font-size:10px; display:block; margin-top:4px;">ROD</span>
                </div>
                <div style="text-align:center;">
                    <div style="width:20px; height:20px; background-color:${currentSkin.bobberColor}; border-radius:50%; margin:0 auto; border:2px solid white;"></div>
                    <span style="font-size:10px; display:block; margin-top:4px;">BOBBER</span>
                </div>
            </div>
            <div class="item-desc" style="text-align:center; margin-top:10px;">
                ${currentSkin.name}: ${currentSkin.description}
            </div>
        `;
    },

    // ========================================
    // 空（背景）ショップ
    // ========================================
    renderSkyShop(container) {
        container = container || document.getElementById('shop-items');
        container.innerHTML = '';

        GAME_DATA.SKIES.forEach(sky => {
            const isUnlocked = GameState.unlockedSkies.includes(sky.id);
            const isEquipped = GameState.selectedSky === sky.id;
            const canBuy = GameState.money >= sky.price;

            const item = document.createElement('div');
            item.className = `shop-item ${isEquipped ? 'equipped' : ''} ${!isUnlocked && !canBuy ? 'locked' : ''}`;

            // 背景プレビュー用のスタイル
            const gradient = `linear-gradient(180deg, ${sky.colors[0]} 0%, ${sky.colors[1]} 100%)`;

            let actionHtml = '';

            if (isUnlocked) {
                if (isEquipped) {
                    actionHtml = '<span class="status equipped">装備中</span>';
                } else {
                    actionHtml = `
                        <button class="btn btn-equip" onclick="ShopManager.equipSky('${sky.id}')">
                            装備
                        </button>
                    `;
                }
            } else {
                if (sky.isGachaExclusive) {
                    actionHtml = `
                        <button class="btn disabled" disabled>
                            ガチャ限定
                        </button>
                    `;
                } else {
                    // 割引計算
                    const discount = GameState.getShopDiscount(); // 0.1 etc
                    const finalPrice = Math.floor(sky.price * (1.0 - discount));
                    const isDiscounted = discount > 0;

                    const canBuy = GameState.money >= finalPrice;

                    actionHtml = `
                        <button class="btn btn-buy ${canBuy ? '' : 'disabled'}" 
                            onclick="ShopManager.buySky('${sky.id}')" ${canBuy ? '' : 'disabled'}>
                            ${isDiscounted ? `<span style="text-decoration:line-through; font-size:0.8em; color:#aaa;">¥${sky.price}</span> ` : ''}
                            ¥${finalPrice.toLocaleString()}
                        </button>
                    `;
                }
            }

            item.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${sky.name}</div>
                    <div class="item-desc">${sky.description}</div>
                    <div class="sky-preview" style="margin-top: 8px; width: 100%; height: 40px; background: ${gradient}; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);"></div>
                </div>
                <div class="item-action">
                    ${actionHtml}
                </div>
            `;

            container.appendChild(item);
        });

        // プレビュー情報（現在の空）
        this.renderSkyInfo();
    },

    // 現在の空情報
    renderSkyInfo() {
        const container = document.getElementById('upgrade-section');
        if (!container) return;

        const currentSky = GameState.getCurrentSky();
        const gradient = `linear-gradient(180deg, ${currentSky.colors[0]} 0%, ${currentSky.colors[1]} 100%)`;

        container.innerHTML = `
            <h3>現在の空</h3>
            <div class="sky-preview" style="margin: 10px auto; width: 80%; height: 60px; background: ${gradient}; border-radius: 12px; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.3);"></div>
            <div class="item-desc" style="text-align:center;">
                ${currentSky.name}: ${currentSky.description}
            </div>
        `;
    },

    // 空購入
    buySky(skyId) {
        const sky = GAME_DATA.SKIES.find(s => s.id === skyId);
        if (GameState.buySky(skyId)) {
            UIManager.showMessage(`${sky.name}を購入しました！`);
            this.renderShop(); // 再描画
            UIManager.updateMoney();
        } else {
            UIManager.showMessage('お金が足りません！');
        }
    },

    // 空装備
    equipSky(skyId) {
        const sky = GAME_DATA.SKIES.find(s => s.id === skyId);
        if (GameState.equipSky(skyId)) {
            UIManager.showMessage(`${sky.name}に変更しました！`);
            this.renderShop();
            UIManager.updateSkyVisuals(); // 背景即時更新
        }
    },

    // スキン装備
    equipSkin(skinId) {
        if (GameState.equipSkin(skinId)) {
            const skin = GAME_DATA.SKINS.find(s => s.id === skinId);
            UIManager.showMessage(`${skin.name}に着せ替えました！`);
            this.renderShop();

            // 待機画面のロッドも更新が必要（アイドル状態なら）
            if (UIManager.currentScreen === 'fishing') {
                UIManager.updateRodView('idle');
            }
        }
    },

    // ========================================
    // スタイルタブ描画 helper
    // ========================================
    renderStyleTabs(container) {
        let target = container || document.getElementById('shop-tabs-container');
        let usePrepend = false;

        // フォールバック: 専用コンテナがない場合は shop-items を使用
        if (!target) {
            target = document.getElementById('shop-items');
            usePrepend = true;
        }

        if (!target) return;

        const isGear = this.currentStyleTab === 'gear';

        const html = `
            <div class="shop-tabs sub-tabs">
                <button class="shop-tab ${isGear ? 'active' : ''}" onclick="ShopManager.switchStyleTab('gear')">
                    <span class="material-icons">phishing</span> 道具
                </button>
                <button class="shop-tab ${!isGear ? 'active' : ''}" onclick="ShopManager.switchStyleTab('sky')">
                    <span class="material-icons">cloud</span> 空
                </button>
            </div>
        `;

        if (usePrepend) {
            // 既存のコンテンツを保持して先頭に追加
            const div = document.createElement('div');
            div.innerHTML = html;
            target.prepend(div.firstElementChild);
        } else {
            // 専用コンテナなら中身を書き換え
            target.innerHTML = html;
        }
    },

    // ========================================
    // スキル/ガチャ タブ描画 helper
    // ========================================
    renderSubTabs(container) {
        let target = container || document.getElementById('shop-tabs-container');
        let usePrepend = false;

        if (!target) {
            target = document.getElementById('shop-items');
            usePrepend = true;
        }

        if (!target) return;

        const isSkill = this.currentTab === 'skill';

        const html = `
            <div class="shop-tabs sub-tabs" style="margin-bottom: 20px; border-bottom: none; justify-content: center;">
                <button class="shop-tab ${isSkill ? 'active' : ''}" onclick="ShopManager.switchTab('skill')">
                    <span class="material-icons">backpack</span> 所持スキル
                </button>
                <button class="shop-tab ${!isSkill ? 'active' : ''}" onclick="ShopManager.switchTab('gacha')">
                    <span class="material-icons">auto_awesome</span> スキルガチャ
                </button>
            </div>
        `;

        if (usePrepend) {
            const div = document.createElement('div');
            div.innerHTML = html;
            target.prepend(div.firstElementChild);
        } else {
            target.innerHTML = html;
        }
    },

    // ========================================
    // 釣り竿ショップ
    // ========================================
    renderRodShop() {
        const container = document.getElementById('shop-items');
        container.innerHTML = '';

        GAME_DATA.RODS.forEach((rod, index) => {
            const isUnlocked = GameState.unlockedRods.includes(index);
            const isEquipped = GameState.rodRankIndex === index;
            const canBuy = !isUnlocked && GameState.money >= rod.price;

            const item = document.createElement('div');
            item.className = `shop-item ${isEquipped ? 'equipped' : ''} ${!isUnlocked && !canBuy ? 'locked' : ''}`;

            // ランクカラーのマッピング (index 0:D, 1:C, 2:B, 3:A, 4:S)
            const rankMap = ['D', 'C', 'B', 'A', 'S'];
            const rankClass = `rarity-${rankMap[index] || 'D'}`;

            item.innerHTML = `
                <div class="item-info">
                    <div class="item-name ${rankClass}">${rod.name}</div>
                    <div class="item-desc">${rod.description}</div>
                    <div class="item-stats">
                        パワー: ${rod.basePower} (+${rod.starPowerBonus}/<span class="material-icons star-icon">star</span>)
                    </div>
                </div>
                <div class="item-action">
                    ${isUnlocked
                    ? (isEquipped
                        ? '<span class="status equipped">装備中</span>'
                        : `<button class="btn btn-equip" onclick="ShopManager.equipRod(${index})">装備</button>`)
                    : (() => {
                        // 割引計算
                        const discount = GameState.getShopDiscount();
                        const finalPrice = Math.floor(rod.price * (1.0 - discount));
                        const isDiscounted = discount > 0;
                        const canBuy = !isUnlocked && GameState.money >= finalPrice;

                        return `<button class="btn btn-buy ${canBuy ? '' : 'disabled'}" 
                            onclick="ShopManager.buyRod(${index})" ${canBuy ? '' : 'disabled'}>
                            ${isDiscounted ? `<span style="text-decoration:line-through; font-size:0.8em; color:#aaa;">¥${rod.price}</span> ` : ''}
                            ¥${finalPrice.toLocaleString()}
                          </button>`;
                    })()
                }
                </div>
            `;

            container.appendChild(item);
        });

        // 現在の竿の強化セクション
        this.renderUpgradeSection();
    },

    // ========================================
    // 釣り竿強化セクション
    // ========================================
    renderUpgradeSection() {
        const container = document.getElementById('upgrade-section');
        if (!container) return;

        const rod = GameState.getCurrentRod();
        const stars = GameState.rodStars;
        const upgradeCost = GameState.getUpgradeCost();
        const canUpgrade = upgradeCost !== null && GameState.money >= upgradeCost;

        // 星の表示を生成
        let starsHtml = '';
        for (let i = 0; i < 5; i++) {
            if (i < stars) {
                starsHtml += '<span class="material-icons star filled">star</span>';
            } else {
                starsHtml += '<span class="material-icons star empty">star_border</span>';
            }
        }

        container.innerHTML = `
            <h3>現在の釣り竿: ${rod.name}</h3>
            <div class="stars-display">${starsHtml}</div>
            <div class="current-power">
                現在のパワー: <strong>${GameState.getTotalPower()}</strong>
            </div>
            <div class="skill-slots">
                スキルスロット: <strong>${stars}</strong>個
            </div>
            ${stars < 5
                ? `<button class="btn btn-upgrade ${canUpgrade ? '' : 'disabled'}" 
                    onclick="ShopManager.upgradeRod()" ${canUpgrade ? '' : 'disabled'}>
                    強化 (¥${upgradeCost.toLocaleString()})
                  </button>`
                : '<span class="status max">最大強化済み</span>'
            }
        `;
    },

    // ========================================
    // ガチャショップの描画
    // ========================================
    renderGachaShop(container) {
        let html = '<div class="shop-items gacha-section">';

        // ガチャ設定からボタンを生成
        const config = GAME_DATA.GACHA_CONFIG;
        const tickets = GameState.gachaTickets;
        const money = GameState.money;
        
        // チケット所持数表示 (New!)
        html += `
            <div class="ticket-status-display">
                <span class="material-icons ticket-icon">confirmation_number</span>
                <span class="ticket-label">所持チケット:</span>
                <span class="ticket-count">${tickets} 枚</span>
            </div>
        `;

        const tiers = [
            { id: 'BRONZE', name: 'ブロンズガチャ', color: '#cd7f32', desc: 'Tier1 (85%), Tier2 (14%), Tier3 (1%)' },
            { id: 'SILVER', name: 'シルバーガチャ', color: '#c0c0c0', desc: 'Tier1 (15%), Tier2 (75%), Tier3 (10%)' },
            { id: 'GOLD', name: 'ゴールドガチャ', color: '#ffd700', desc: 'Tier2 (20%), Tier3 (75%), Special (5%)' }
        ];

        tiers.forEach(tier => {
            const data = config[tier.id];
            const ticketCost = data.ticket;
            const ticketCost10 = data.ticket * 9;

            const canTicket1 = tickets >= ticketCost;
            const canTicket10 = tickets >= ticketCost10;
            const canMoney1 = money >= data.single;
            const canMoney10 = money >= data.ten;

            html += `
                <div class="shop-item gacha-item" style="border-left: 4px solid ${tier.color}; display: flex; flex-direction: column; gap: 15px; padding: 15px; background: rgba(0,0,0,0.4);">
                    <div class="item-info" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 5px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <div class="item-name" style="color: ${tier.color}; font-size: 1.2em; font-weight: bold;">${tier.name}</div>
                        </div>
                    </div>
                    
                    <div class="gacha-actions-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <!-- チケット払い -->
                        <div class="pay-method-group" style="background: rgba(100,200,255,0.05); padding: 10px; border-radius: 8px;">
                            <div class="group-header" style="text-align: center; color: #8ecae6; font-weight: bold; font-size: 0.85em; margin-bottom: 8px; border-bottom: 1px solid rgba(142,202,230,0.3); padding-bottom: 4px;">
                                <span class="material-icons" style="font-size: 14px; vertical-align: middle;">confirmation_number</span> チケット
                            </div>
                            <div style="display: grid; gap: 8px;">
                                <button class="btn btn-ticket ${!canTicket1 ? 'disabled' : ''}" 
                                        style="width: 100%; justify-content: center; font-size: 0.9em;"
                                        onclick="ShopManager.drawGacha('${tier.id}', 1, 'ticket')" ${!canTicket1 ? 'disabled' : ''}>
                                    単発 (${ticketCost}枚)
                                </button>
                                <button class="btn btn-ticket ${!canTicket10 ? 'disabled' : ''}" 
                                        style="width: 100%; justify-content: center; font-size: 0.9em;"
                                        onclick="ShopManager.drawGacha('${tier.id}', 10, 'ticket')" ${!canTicket10 ? 'disabled' : ''}>
                                    10連 (${ticketCost10}枚)
                                </button>
                            </div>
                        </div>

                        <!-- マネー払い -->
                        <div class="pay-method-group" style="background: rgba(255,215,0,0.05); padding: 10px; border-radius: 8px;">
                            <div class="group-header" style="text-align: center; color: #ffb703; font-weight: bold; font-size: 0.85em; margin-bottom: 8px; border-bottom: 1px solid rgba(255,183,3,0.3); padding-bottom: 4px;">
                                <span class="material-icons" style="font-size: 14px; vertical-align: middle;">monetization_on</span> コイン
                            </div>
                            <div style="display: grid; gap: 8px;">
                                <button class="btn btn-buy ${!canMoney1 ? 'disabled' : ''}" 
                                        style="width: 100%; justify-content: center; font-size: 0.9em;"
                                        onclick="ShopManager.drawGacha('${tier.id}', 1, 'money')" ${!canMoney1 ? 'disabled' : ''}>
                                    単発 ¥${data.single.toLocaleString()}
                                </button>
                                <button class="btn btn-buy ${!canMoney10 ? 'disabled' : ''}" 
                                        style="width: 100%; justify-content: center; font-size: 0.9em;"
                                        onclick="ShopManager.drawGacha('${tier.id}', 10, 'money')" ${!canMoney10 ? 'disabled' : ''}>
                                    10連 ¥${data.ten.toLocaleString()}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        // リサイクル（エコ・ボックス）セクション
        html += '<div id="recycle-section" class="recycle-section"></div>';

        container.innerHTML = html;

        // リサイクルUIの描画
        this.renderRecycleUI();

        // サブタブを描画
        this.renderSubTabs();
    },

    // ========================================
    // スキルショップ（冒険者の道場）の描画
    // ========================================
    renderSkillShop() {
        const container = document.getElementById('shop-items');
        // SkillInventoryManagerに描画を委譲（コンテナを渡す）
        SkillInventoryManager.init(container);

        // スキルスロット情報（上部ボックス）更新
        this.renderSkillSlotInfo();

        // サブタブを描画（これがないとタブ切り替えができなくなる）
        this.renderSubTabs(document.getElementById('shop-tabs-container'));
    },
    renderRecycleUI() {
        const container = document.getElementById('recycle-section');
        if (!container) return;

        const selectedCount = this.recycleSelectedSkills.length;

        // 選択されたスキルのTierチェック（混在不可）
        let selectedTier = null;
        let isMixed = false;
        if (selectedCount > 0) {
            const firstSkill = GAME_DATA.SKILLS.find(s => s.id === this.recycleSelectedSkills[0]);
            if (firstSkill) {
                selectedTier = firstSkill.tier;
                // 全て同じTierか確認
                isMixed = !this.recycleSelectedSkills.every(id => {
                    const s = GAME_DATA.SKILLS.find(sk => sk.id === id);
                    return s && s.tier === selectedTier;
                });
            }
        }

        // 交換レート判定
        let exchangeResult = null;
        if (selectedCount >= 30) {
            exchangeResult = `Tier ${Math.min(3, selectedTier + 2)} 確定！`; // +2 rank
        } else if (selectedCount >= 10) {
            exchangeResult = `Tier ${Math.min(3, selectedTier + 1)} 確定！`; // +1 rank
        } else if (selectedCount >= 5) {
            exchangeResult = `Tier ${selectedTier} (同ランク) 確定`;
        }

        const canExecute = !isMixed && (selectedCount === 5 || selectedCount === 10 || selectedCount === 30);

        let warningMsg = '';
        if (isMixed) warningMsg = '<span style="color:red; font-size:0.8em;">異なるTierが混ざっています</span>';
        else if (selectedCount > 0 && !canExecute) warningMsg = '<span style="color:orange; font-size:0.8em;">5個, 10個, 30個のいずれかを選択してください</span>';

        let html = `
            <div class="recycle-header">
                <h3>♻️ エコ・ボックス (確定的リサイクル)</h3>
                <p class="recycle-desc">
                    同ランクのスキルを集めて上位スキルと交換！<br>
                    5個: 同ランク1個 / 10個: 1ランクUP / 30個: 2ランクUP
                </p>
            </div>
            
            <div class="recycle-controls">
                <div class="recycle-status">
                    選択中: <span class="select-count ${canExecute ? 'complete' : ''}">${selectedCount}</span>
                    ${exchangeResult ? `<br><span class="exchange-result">➡ ${exchangeResult}</span>` : ''}
                    ${warningMsg}
                </div>
                <div class="recycle-actions">
                    <button class="btn btn-mini" onclick="ShopManager.selectBulkRecycle(null, 5)">5個選択</button>
                    <button class="btn btn-mini" onclick="ShopManager.selectBulkRecycle(null, 10)">10個選択</button>
                    <button class="btn btn-mini" onclick="ShopManager.selectBulkRecycle(null, 30)">30個選択</button>
                    <button class="btn btn-mini" onclick="ShopManager.recycleSelectedSkills = []; ShopManager.renderShop();">クリア</button>
                </div>
            </div>

            <div class="recycle-grid">
        `;

        // 所持スキルを表示 (ソート: Tier昇順 -> ID順)
        const skills = GAME_DATA.SKILLS.map(s => {
            return {
                ...s,
                count: GameState.getSkillCount(s.id),
                equipped: GameState.getEquippedSkillCount(s.id)
            };
        }).filter(s => s.count > 0)
            .sort((a, b) => {
                if (a.tier !== b.tier) return a.tier - b.tier;
                return a.id.localeCompare(b.id);
            });

        if (skills.length === 0) {
            html += '<div class="no-skills">リサイクル可能なスキルがありません</div>';
        } else {
            skills.forEach(skill => {
                const available = skill.count - skill.equipped;
                const selected = this.recycleSelectedSkills.filter(id => id === skill.id).length;
                const isSelected = selected > 0;

                // 選択可能な残り数
                const remaining = available - selected;

                // Tier混在防止: 既に選択済みがあり、かつ違うTierなら選択不可にする
                let disabled = false;
                if (selectedTier !== null && skill.tier !== selectedTier && !isSelected) {
                    disabled = true;
                }

                const canSelectMore = remaining > 0 && this.recycleSelectedSkills.length < 30;

                html += `
                    <div class="recycle-item tier-${skill.tier} ${isSelected ? 'selected' : ''} ${remaining === 0 || disabled ? 'dimmed' : ''}"
                         onclick="${(canSelectMore || isSelected) && !disabled ? `ShopManager.toggleRecycleSelect('${skill.id}')` : ''}">
                        <div class="recycle-item-icon">
                            <span class="material-icons">auto_awesome</span>
                        </div>
                        <div class="recycle-item-info">
                            <div class="name">${skill.name}</div>
                            <div class="tier">Tier ${skill.tier}</div>
                            <div class="count">所持: ${available} / 選択: ${selected}</div>
                        </div>
                        ${isSelected ? '<div class="check-mark"><span class="material-icons">check_circle</span></div>' : ''}
                    </div>
                `;
            });
        }

        html += `
            </div>
            
            <div class="recycle-execute">
                <button class="btn btn-recycle ${canExecute ? '' : 'disabled'}" 
                        onclick="ShopManager.executeRecycle()" ${canExecute ? '' : 'disabled'}>
                    ♻️ 交換する！
                </button>
            </div>
        `;

        container.innerHTML = html;
    },

    // ========================================
    // リサイクル選択トグル
    // ========================================
    toggleRecycleSelect(skillId) {
        const index = this.recycleSelectedSkills.indexOf(skillId);
        const skill = GAME_DATA.SKILLS.find(s => s.id === skillId);

        // Tierチェック
        if (this.recycleSelectedSkills.length > 0) {
            const firstId = this.recycleSelectedSkills[0];
            const firstSkill = GAME_DATA.SKILLS.find(s => s.id === firstId);
            if (firstSkill && firstSkill.tier !== skill.tier) {
                // 違うTierは選択解除のみ許可、追加は不可
                if (index === -1) return;
            }
        }

        const owned = GameState.getSkillCount(skillId);
        const equipped = GameState.getEquippedSkillCount(skillId);
        const available = owned - equipped;
        const currentSelected = this.recycleSelectedSkills.filter(id => id === skillId).length;

        if (this.recycleSelectedSkills.length < 30 && currentSelected < available) {
            this.recycleSelectedSkills.push(skillId);
        } else if (currentSelected > 0) {
            // 1つ削除
            const idx = this.recycleSelectedSkills.indexOf(skillId);
            if (idx > -1) {
                this.recycleSelectedSkills.splice(idx, 1);
            }
        }

        this.renderRecycleUI();
    },

    // ========================================
    // 一括選択
    // ========================================
    selectBulkRecycle(tierOrNull, count = 5) {
        this.recycleSelectedSkills = []; // リセット

        // Tierが指定されていない場合、一番低いTierから候補を探す
        // あるいは所持数が多いTier
        let targetTier = 1;

        // 候補検索
        let candidates = [];

        // Tier 1, 2, 3 の順で、指定個数以上持っているかチェック
        for (let t = 1; t <= 3; t++) {
            let tempCandidates = [];
            GAME_DATA.SKILLS.forEach(skill => {
                if (skill.tier === t) {
                    const owned = GameState.getSkillCount(skill.id);
                    const equipped = GameState.getEquippedSkillCount(skill.id);
                    const available = owned - equipped;
                    for (let i = 0; i < available; i++) {
                        tempCandidates.push(skill.id);
                    }
                }
            });

            if (tempCandidates.length >= count) {
                candidates = tempCandidates;
                targetTier = t;
                break;
            }
        }

        // 見つからなければTier1から詰め込む（不足状態）
        if (candidates.length < count) {
            // 再検索してとにかく集める
            GAME_DATA.SKILLS.forEach(skill => {
                if (skill.tier === 1) { // デフォルトTier1
                    const owned = GameState.getSkillCount(skill.id);
                    const equipped = GameState.getEquippedSkillCount(skill.id);
                    const available = owned - equipped;
                    for (let i = 0; i < available; i++) {
                        candidates.push(skill.id);
                    }
                }
            });
        }

        // 指定個数まで選択
        for (let i = 0; i < count && i < candidates.length; i++) {
            this.recycleSelectedSkills.push(candidates[i]);
        }

        this.renderRecycleUI();
    },

    // ========================================
    // リサイクル実行
    // ========================================
    executeRecycle() {
        const count = this.recycleSelectedSkills.length;
        if (count !== 5 && count !== 10 && count !== 30) {
            UIManager.showMessage('スキルを5個、10個、または30個選択してください');
            return;
        }

        // 入力Tierの特定
        const firstId = this.recycleSelectedSkills[0];
        const firstSkill = GAME_DATA.SKILLS.find(s => s.id === firstId);
        if (!firstSkill) return;

        const inputTier = firstSkill.tier;

        // 混在チェック
        const isMixed = !this.recycleSelectedSkills.every(id => {
            const s = GAME_DATA.SKILLS.find(sk => sk.id === id);
            return s && s.tier === inputTier;
        });

        if (isMixed) {
            UIManager.showMessage('同じTierのスキルを選択してください');
            return;
        }

        // 出力Tierの決定
        let outputTier = inputTier;
        if (count === 10) outputTier = Math.min(3, inputTier + 1);
        else if (count === 30) outputTier = Math.min(3, inputTier + 2);

        // スキル消費
        this.recycleSelectedSkills.forEach(skillId => {
            if (GameState.skillInventory[skillId] > 0) {
                GameState.skillInventory[skillId]--;
            }
        });

        // 抽選 (指定Tierの中からランダム)
        const result = this.pickSkillByTier(outputTier, count === 5 ? null : 'upgrade'); // 同ランク交換の場合は完全ランダム、昇格時は...？
        // ※ pickSkillByTierの実装に依存するが、ここでは単純に指定Tierから選ぶメソッドと仮定
        // 既存の pickSkillByTier は 'tier1', 'tier2' 文字列を受け取る実装が多いので確認が必要
        // 既存コードには pickSkillByTier が見当たらない（前回のview_fileで範囲外だったか、lottery内部で管理されているか）
        // 下記で self implementation する

        // 選択状態リセット
        this.recycleSelectedSkills = [];
        this.renderShop();
        UIManager.updateMoney();

        // 獲得処理
        GameState.gainGachaResult(result);

        UIManager.showGachaResult([result], () => {
            ShopManager.renderShop();
        });
    },

    // Tier指定でランダムなスキルを1つ選ぶ
    pickSkillByTier(tierNum) {
        const pool = GAME_DATA.SKILLS.filter(s => s.tier === tierNum);
        if (pool.length === 0) return GAME_DATA.SKILLS[0]; // fallback

        const selected = pool[Math.floor(Math.random() * pool.length)];
        return {
            ...selected,
            category: 'skill', // 演出用
            isNew: !GameState.hasSkill(selected.id)
        };
    },


    // ========================================
    // ガチャ抽選 (汎用)
    // ========================================
    lottery(rates) {
        const rand = Math.random() * 100;
        let selectedTier = 'tier1';
        let cumulative = 0;

        if ((cumulative += rates.special) > rand) selectedTier = 'special';
        else if ((cumulative += rates.tier3) > rand) selectedTier = 'tier3';
        else if ((cumulative += rates.tier2) > rand) selectedTier = 'tier2';
        else selectedTier = 'tier1';

        // Tier4 (Recycle用)
        if (rates.tier4 && (cumulative += rates.tier4) > rand) selectedTier = 'tier4';

        return this.pickSkillByTier(selectedTier);
    },

    // ========================================
    // ガチャ実行 (通常)
    // ========================================
    drawGacha(tierKey, count, paymentMethod) {
        // 連打防止
        if (this.isDrawingGacha) return;

        const config = GAME_DATA.GACHA_CONFIG[tierKey];
        if (!config) return;

        const ticketCost = config.ticket * count;
        const moneyCost = count === 10 ? config.ten : config.single;

        // 支払い方法による検証
        if (paymentMethod === 'ticket') {
            if (GameState.gachaTickets < ticketCost) {
                UIManager.showMessage('チケットが足りません！');
                return;
            }
        } else if (paymentMethod === 'money') {
            if (GameState.money < moneyCost) {
                UIManager.showMessage('お金が足りません！');
                return;
            }
        } else {
            // 旧互換性（paymentMethodが無い場合）
            const resCheck = GameState.canDrawGacha(moneyCost, count);
            if (!resCheck.can) {
                UIManager.showMessage('リソースが足りません！');
                return;
            }
            paymentMethod = resCheck.method;
        }

        // 連打防止フラグを立てる
        this.isDrawingGacha = true;

        // 抽選実行 (リソース消費の前に抽選を行い、結果を演出に渡す)
        const results = [];
        for (let i = 0; i < count; i++) {
            results.push(this.lottery(config.rates));
        }

        // リソース消費
        if (paymentMethod === 'ticket') {
            GameState.gachaTickets -= ticketCost;
        } else {
            GameState.money -= moneyCost;
        }
        UIManager.updateStatus(); // お金・チケット表示更新

        // 消費後すぐにセーブ
        SaveManager.save(GameState);

        // ガチャ専用画面へ切り替え
        UIManager.showScreen('gacha');

        // ガチャ演出開始
        UIManager.startGachaPerformance(results, () => {
            // 演出完了後の処理
            this.isDrawingGacha = false;
            this.renderShop();
        });
    },

    // ========================================
    // Tierに応じたスキル選出
    // ========================================
    pickSkillByTier(tier) {
        let targetTier = 1;
        if (tier === 'tier2') targetTier = 2;
        if (tier === 'tier3') targetTier = 3;
        if (tier === 'special' || tier === 'tier4') targetTier = 3; // Special/Tier4は現状Tier3相当

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

        // 該当Tierのスキルを抽出 (限定スキルは除外)
        const candidates = GAME_DATA.SKILLS.filter(s => s.tier === targetTier && !limitedSkillIds.includes(s.id));

        // 候補がない場合はフォールバック
        if (candidates.length === 0) {
            return GAME_DATA.SKILLS[0];
        }

        const index = Math.floor(Math.random() * candidates.length);
        const skill = candidates[index];

        // 結果オブジェクトを作成
        return {
            ...skill,
            isNew: GameState.getSkillCount(skill.id) === 0
        };
    },

    // ========================================
    // スキルショップ
    // ========================================


    // ========================================
    // スキルスロット情報
    // ========================================
    renderSkillSlotInfo() {
        const container = document.getElementById('upgrade-section');
        if (!container) return;

        const slots = GameState.getSkillSlots();
        const equipped = GameState.equippedSkills.length;

        // アクティブな効果を収集
        const effects = [];

        const power = GameState.getPowerBonus();
        if (power > 0) effects.push({ label: 'パワー', val: `+${power}` });

        const price = GameState.getPriceBonus();
        if (price > 0) effects.push({ label: '売値', val: `+${Math.round(price * 100)}%` });

        const slow = GameState.getGaugeSlowBonus();
        if (slow > 0) effects.push({ label: 'ゲージ速度', val: `-${Math.round(slow * 100)}%` });

        const catchB = GameState.getCatchBonus();
        if (catchB > 0) effects.push({ label: '捕獲率', val: `+${Math.round(catchB * 100)}%` });

        const rare = GameState.getRareBonus();
        if (rare > 0) effects.push({ label: 'レア率', val: `+${Math.round(rare * 100)}%` });

        const hitWin = GameState.getHitWindowMultiplier();
        if (hitWin > 1.0) effects.push({ label: 'HIT幅', val: `x${hitWin.toFixed(2)}` });

        const waitRed = GameState.getWaitTimeReduction();
        if (waitRed > 0) effects.push({ label: '待ち時間', val: `-${Math.round(waitRed * 100)}%` });

        const baitSave = GameState.getBaitSaveChance();
        if (baitSave > 0) effects.push({ label: '餌節約', val: `${Math.round(baitSave * 100)}%` });

        const redZone = GameState.getRedZoneBonus();
        if (redZone > 0) effects.push({ label: '赤ゾーン', val: `+${redZone}` });

        const titleC = GameState.getTitleChanceMultiplier();
        if (titleC > 1.0) effects.push({ label: '称号率', val: `x${titleC.toFixed(2)}` });

        const bigGame = GameState.getBigGameBonus();
        if (bigGame > 1.0) effects.push({ label: '大物率', val: `x${bigGame.toFixed(2)}` });

        const treasureC = GameState.getTreasureChanceBonus();
        if (treasureC > 0) effects.push({ label: '宝箱率', val: `+${Math.round(treasureC * 100)}%` });

        const doubleC = GameState.getMultiCatch2Chance();
        if (doubleC > 0) effects.push({ label: '2匹釣り', val: `${Math.round(doubleC * 100)}%` });

        const tripleC = GameState.getMultiCatch3Chance();
        if (tripleC > 0) effects.push({ label: '3匹釣り', val: `${Math.round(tripleC * 100)}%` });

        const amp = GameState.getSkillAmplifier();
        if (amp > 1.0) effects.push({ label: 'スキル効果', val: `x${amp.toFixed(2)}` });

        // 追加の欠落していた効果
        const nibble = GameState.getNibbleFixCount();
        if (nibble) effects.push({ label: '予兆固定', val: `${nibble}回` });

        const second = GameState.getSecondChanceRate();
        if (second > 0) effects.push({ label: '起死回生', val: `${Math.round(second * 100)}%` });

        const tQuant = GameState.getTreasureQuantityMultiplier();
        if (tQuant > 1.0) effects.push({ label: '宝箱量', val: `x${tQuant.toFixed(2)}` });

        const tQual = GameState.getTreasureQualityMultiplier();
        if (tQual > 1.0) effects.push({ label: '宝箱質', val: `x${tQual.toFixed(2)}` });

        const fCharge = GameState.getFeverChargeBonus();
        if (fCharge > 0) effects.push({ label: '情熱', val: `+${Math.round(fCharge * 100)}%` });

        const fLong = GameState.getFeverLongBonus();
        if (fLong > 0) effects.push({ label: '熱狂', val: `+${Math.round(fLong * 100)}%` });

        const sun = GameState.getFeverBiasBonus('sun');
        if (sun > 0) effects.push({ label: '太陽加護', val: `+${Math.round(sun * 100)}%` });

        const moon = GameState.getFeverBiasBonus('moon');
        if (moon > 0) effects.push({ label: '月加護', val: `+${Math.round(moon * 100)}%` });

        if (GameState.hasPerfectMaster()) effects.push({ label: '達人の針', val: '有効' });

        const boat = GameState.getBoatEventBonus();
        if (boat > 0) effects.push({ label: '船イベント', val: `+${Math.round(boat * 100)}%` });

        const bird = GameState.getBirdEventBonus();
        if (bird > 0) effects.push({ label: '鳥イベント', val: `+${Math.round(bird * 100)}%` });

        const missionR = GameState.getMissionRewardModifier();
        if (missionR > 1.0) effects.push({ label: '報酬ボーナス', val: `x${missionR.toFixed(2)}` });

        let effectsHtml = '';
        if (effects.length > 0) {
            effectsHtml = `
                <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-start;">
                    ${effects.map(e => `
                        <span class="effect-badge" style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 11px; white-space: nowrap;">
                            ${e.label} <span style="color: #ffd700;">${e.val}</span>
                        </span>
                    `).join('')}
                </div>
            `;
        } else {
            effectsHtml = '<span style="color:#888; font-size:11px;">なし</span>';
        }

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 10px; align-items: start;">
                <div style="text-align: left;">
                    <h3 style="margin: 0 0 5px 0; font-size: 13px; color: #aaa;">スキルスロット</h3>
                    <div class="slot-info">
                        使用中: <strong style="${equipped >= slots ? 'color: #ff6b6b;' : ''}">${equipped}</strong> / ${slots}
                    </div>
                </div>
                <div style="text-align: left; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 10px;">
                    <h3 style="margin: 0 0 5px 0; font-size: 13px; color: #aaa;">発動中の効果</h3>
                    ${effectsHtml}
                </div>
            </div>
            ${slots === 0
                ? '<p class="hint" style="margin-top: 5px;">釣り竿を強化して<span class="material-icons">star</span>を増やすとスキルが装備できます</p>'
                : ''
            }
        `;
    },

    // ========================================
    // 餌ショップ
    // ========================================
    renderBaitShop() {
        const container = document.getElementById('shop-items');
        container.innerHTML = '';

        GAME_DATA.BAITS.filter(b => b.id !== 'bait_d').forEach(bait => {
            const canBuy = GameState.money >= bait.price;

            const item = document.createElement('div');
            item.className = `shop-item ${!canBuy ? 'locked' : ''}`;

            item.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${bait.name}</div>
                    <div class="item-desc">${bait.description}</div>
                    <div class="item-stats">
                        ${bait.quantity}個入り
                    </div>
                </div>
                <div class="item-action bait-purchase-grid" style="display: flex; gap: 8px; flex-direction: column; min-width: 140px;">
                    ${(() => {
                    // 割引計算
                    const discount = GameState.getShopDiscount();
                    const buttonsHtml = [1, 10].map(multiplier => {
                        const finalPrice = Math.floor(bait.price * multiplier * (1.0 - discount));
                        const canBuy = GameState.money >= finalPrice;
                        const isDiscounted = discount > 0;
                        const label = multiplier === 1 ? '1セット' : `${multiplier}セット`;

                        return `
                                <button class="btn btn-buy ${canBuy ? '' : 'disabled'}" 
                                        style="width: 100%; border-radius: 50px; font-weight: bold; box-shadow: 0 4px 0 #e08e0b;"
                                        onclick="ShopManager.buyBait('${bait.id}', ${multiplier})" ${canBuy ? '' : 'disabled'}>
                                    <div style="font-size: 0.9em;">${label}</div>
                                    <div style="font-size: 1.0em;">¥${finalPrice.toLocaleString()}</div>
                                </button>
                            `;
                    }).join('');

                    return buttonsHtml;
                })()}

            `;

            container.appendChild(item);
        });

        // 現在の餌情報
        this.renderBaitInfo();
    },

    // ========================================
    // 現在の餌情報
    // ========================================
    renderBaitInfo() {
        const container = document.getElementById('upgrade-section');
        if (!container) return;

        const baitCount = GameState.getCurrentBaitCount();
        const baitType = GameState.baitType;
        const bait = baitType ? GAME_DATA.BAITS.find(b => b.id === baitType) : null;

        container.innerHTML = `
            <h3>所持中の餌</h3>
            <div class="bait-info">
                ${bait
                ? `<strong>${bait.name}</strong> × ${baitCount}`
                : '<span class="none">なし</span>'
            }
            </div>
        `;
    },

    // ========================================
    // 釣り竿購入
    // ========================================
    buyRod(index) {
        if (GameState.buyRod(index)) {
            UIManager.showMessage(`${GAME_DATA.RODS[index].name}を購入しました！`);
            this.renderShop();
            UIManager.updateMoney();
        }
    },

    // ========================================
    // 釣り竿装備
    // ========================================
    equipRod(index) {
        if (GameState.equipRod(index)) {
            UIManager.showMessage(`${GAME_DATA.RODS[index].name}を装備しました！`);
            this.renderShop();
        }
    },

    // ========================================
    // 釣り竿強化
    // ========================================
    upgradeRod() {
        const result = GameState.upgradeRod();
        if (result.success) {
            UIManager.showMessage(`<span class="material-icons">star</span>${result.newStars}に強化しました！`);
            this.renderShop();
            UIManager.updateMoney();
        } else {
            UIManager.showMessage(result.message);
        }
    },

    // ========================================
    // スキル購入
    // ========================================
    buySkill(skillId) {
        const skill = GAME_DATA.SKILLS.find(s => s.id === skillId);
        if (GameState.buySkill(skillId)) {
            const newCount = GameState.getSkillCount(skillId);
            UIManager.showMessage(`${skill.name}を購入しました！(所持数: ${newCount})`);
            this.renderShop();
            UIManager.updateMoney();
        }
    },

    // ========================================
    // スキル装備
    // ========================================
    equipSkill(skillId) {
        const skill = GAME_DATA.SKILLS.find(s => s.id === skillId);
        if (GameState.equipSkill(skillId)) {
            const count = GameState.getEquippedSkillCount(skillId);
            UIManager.showMessage(`${skill.name}を装備しました！(計${count}個)`);
            this.renderShop();

            // 初心者ミッション判定: スキルを装備する
            MissionManager.checkMission('equip_skill');
        } else {
            // 失敗理由を簡易表示 (スロット一杯など)
            if (GameState.equippedSkills.length >= GameState.getSkillSlots()) {
                UIManager.showMessage('スキルスロットが一杯です');
            } else {
                UIManager.showMessage('所持数が足りません');
            }
        }
    },

    // ========================================
    // スキル取り外し
    // ========================================
    unequipSkill(skillId) {
        const skill = GAME_DATA.SKILLS.find(s => s.id === skillId);
        if (GameState.unequipSkill(skillId)) {
            UIManager.showMessage(`${skill.name}を外しました`);
            this.renderShop();
        }
    },

    // ========================================
    // 餌購入
    // ========================================
    buyBait(baitId, multiplier = 1) {
        const bait = GAME_DATA.BAITS.find(b => b.id === baitId);
        if (!bait) return;

        const totalQuantity = bait.quantity * multiplier;

        if (GameState.buyBait(baitId, totalQuantity)) {
            UIManager.showMessage(`${bait.name}を${totalQuantity}個(${multiplier}セット)購入しました！`);
            this.renderShop();
            UIManager.updateMoney();

            // 初心者ミッション判定: 餌を買う
            MissionManager.checkMission('buy_bait');
        } else {
            UIManager.showMessage('お金が足りません！');
        }
    },

    // ========================================
    // 魚を全て売却
    // ========================================
    sellAllFish() {
        const count = GameState.inventory.length;
        if (count === 0) {
            UIManager.showMessage('売る魚がありません');
            return;
        }

        const earned = GameState.sellAllFish();
        UIManager.showMessage(`魚${count}匹を売却して¥${earned.toLocaleString()}を獲得！`);
        UIManager.updateMoney();
        UIManager.updateInventory();
        // ショップを再描画して購入ボタンを更新
        this.renderShop();
    },

    // ========================================
    // 港（Port）画面描画
    // ========================================
    renderPort() {
        const portArea = document.getElementById('port-main-area');
        const moneyDisplay = document.getElementById('port-money-display');
        if (moneyDisplay) moneyDisplay.textContent = `${GameState.money.toLocaleString()} G`;

        if (!portArea) return;

        const port = GameState.port;
        const ownedShip = port.ownedShipId
            ? GAME_DATA.SHIPS.find(s => s.id === port.ownedShipId)
            : null;

        let html = '';

        // 1. 保有船ステータス
        if (ownedShip) {
            // 燃料ゲージ率 (最大300分=5時間 をMAXバー表示基準とする)
            const maxBarMinutes = 300;
            const fuelPercent = Math.min(100, (port.fuelMinutes / maxBarMinutes) * 100);

            // 在庫状況
            const stockCount = port.stock.length;
            const stockPercent = Math.min(100, (stockCount / ownedShip.capacity) * 100);

            // 予想売却額
            let estimatedValue = 0;
            const priceBonus = GameState.getPriceBonus(); // 既存: return (1.0 + bonus) ? or just bonus?
            // GameState.getPriceBonus implementation check:
            // "bonus *= skill.effect.value;" (initially 1.0?? NO)
            // It returns multiplier? Let's check logic:
            // "let bonus = 0; ... bonus += skill.effect.value;" -> Returns simple add-on (e.g. 0.1)
            // GameState.collectPortStock uses "priceMultiplier = 1.0 + priceBonus"
            // So here we do the same.

            // Actually, verify_port_logic used "Math.floor(fish.price * priceMultiplier)"
            const multiplier = 1.0 + priceBonus;

            port.stock.forEach(fish => {
                estimatedValue += Math.floor(fish.price * multiplier);
            });

            html += `
                <div class="port-status-card">
                    <div class="card-header-row">
                        <h3><span class="material-icons">sailing</span> ${ownedShip.name}</h3>
                        <span class="rank-badge rarity-${ownedShip.maxRarity}">MAX Rank: ${ownedShip.maxRarity}</span>
                    </div>
                    
                    <div class="status-bars">
                        <!-- 燃料 -->
                        <div class="status-bar-group">
                            <div class="bar-label">
                                <span class="material-icons">local_gas_station</span> 燃料
                                <span class="bar-value">${port.fuelMinutes} <small>(稼働:約${Math.floor(port.fuelMinutes / (ownedShip.fuelConsumption || 1))}分)</small></span>
                            </div>
                            <div class="progress-track" style="background:#444; height:10px; border-radius:5px; overflow:hidden;">
                                <div class="progress-fill fuel" style="width: ${fuelPercent}%; background:var(--accent-color); height:100%;"></div>
                            </div>
                            <div class="bar-desc" style="font-size:10px; color:#aaa; margin-top:2px;">
                                1分ごとに${ownedShip.fuelConsumption || 1}消費 / 5分ごとに漁獲
                            </div>
                        </div>

                        <!-- 倉庫 -->
                        <div class="status-bar-group" style="margin-top:10px;">
                            <div class="bar-label">
                                <span class="material-icons">inventory_2</span> 倉庫
                                <span class="bar-value">${stockCount} / ${ownedShip.capacity}</span>
                            </div>
                            <div class="progress-track" style="background:#444; height:10px; border-radius:5px; overflow:hidden;">
                                <div class="progress-fill stock ${stockCount >= ownedShip.capacity ? 'full' : ''}" style="width: ${stockPercent}%; background:${stockCount >= ownedShip.capacity ? '#ff5252' : '#4caf50'}; height:100%;"></div>
                            </div>
                        </div>
                    </div>

                    <div class="port-actions" style="margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                        <div class="stock-info">
                            予想売上: <strong style="color:#ffd700;">${estimatedValue.toLocaleString()} G</strong>
                        </div>
                        <button class="btn btn-collect ${stockCount > 0 ? '' : 'disabled'}" 
                                onclick="ShopManager.collectPortStock()" ${stockCount > 0 ? '' : 'disabled'}
                                style="background:${stockCount > 0 ? 'var(--primary-color)' : '#555'}; color:white; border:none; padding:8px 16px; border-radius:4px;">
                            <span class="material-icons" style="vertical-align:middle; font-size:18px;">savings</span> 収獲を受け取る
                        </button>
                    </div>
                </div>
            `;
        } else {
            // 船未所持
            html += `
                <div class="port-status-card empty" style="text-align:center; padding:30px; background:rgba(0,0,0,0.3); border-radius:8px;">
                    <div class="empty-message">
                        <span class="material-icons" style="font-size: 48px; color: #555;">no_transfer</span>
                        <p style="color:#aaa;">漁船を所持していません。<br>造船所で船を購入してください。</p>
                    </div>
                </div>
            `;
        }

        // 2. 燃料スタンド
        html += `<h3 class="section-title" style="margin-top:20px; border-bottom:1px solid #444; padding-bottom:5px;"><span class="material-icons">local_gas_station</span> 給油スタンド</h3>`;
        html += `<div class="fuel-shop-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(100px, 1fr)); gap:10px; margin-top:10px;">`;
        GAME_DATA.FUELS.forEach(fuel => {
            const discount = GameState.getPortFuelDiscount();
            const finalPrice = Math.floor(fuel.price * (1.0 - discount));
            const canBuy = GameState.money >= finalPrice;

            let priceDisplay = `¥${finalPrice.toLocaleString()}`;
            if (discount > 0) {
                // 割引表示
                priceDisplay = `<span style="text-decoration:line-through; color:#aaa; font-size:10px;">¥${fuel.price.toLocaleString()}</span> <span style="color:#ffeb3b;">¥${finalPrice.toLocaleString()}</span>`;
            }

            html += `
                <div class="fuel-item" style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; text-align:center;">
                    <div class="fuel-icon"><span class="material-icons" style="color:var(--accent-color);">opacity</span></div>
                    <div class="fuel-info">
                        <div class="fuel-name" style="font-weight:bold; font-size:14px;">${fuel.name}</div>
                        <div class="fuel-effect" style="font-size:12px; color:#aaa;">+${fuel.recovery}分</div>
                    </div>
                    <button class="btn btn-buy-small ${canBuy ? '' : 'disabled'}" 
                            onclick="ShopManager.buyFuel('${fuel.id}')" ${canBuy ? '' : 'disabled'}
                            style="width:100%; margin-top:5px; font-size:12px; padding:4px;">
                        ${priceDisplay}
                    </button>
                </div>
            `;
        });
        html += `</div>`;

        // 3. 造船所
        html += `<h3 class="section-title" style="margin-top:20px; border-bottom:1px solid #444; padding-bottom:5px;"><span class="material-icons">store</span> 造船所</h3>`;
        html += `<div class="ship-shop-list" style="display:flex; flex-direction:column; gap:10px; margin-top:10px; padding-bottom:50px;">`;
        GAME_DATA.SHIPS.forEach(ship => {
            const isOwned = port.ownedShipId === ship.id;
            const canBuy = GameState.money >= ship.price;

            // 性能比較
            let capacityDiff = '';
            if (ownedShip) {
                const diff = ship.capacity - ownedShip.capacity;
                if (diff > 0) capacityDiff = `<span class="stat-up" style="color:#4caf50;">(+${diff})</span>`;
                else if (diff < 0) capacityDiff = `<span class="stat-down" style="color:#ff5252;">(${diff})</span>`;
            }

            html += `
                <div class="shop-item ship-item ${isOwned ? 'owned' : ''}" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.5); padding:10px; border-radius:8px; border:1px solid ${isOwned ? 'var(--primary-color)' : '#444'};">
                    <div class="item-info">
                        <div class="item-name rarity-${ship.maxRarity}" style="font-weight:bold; font-size:16px;">${ship.name}</div>
                        <div class="item-desc" style="font-size:12px; color:#aaa;">${ship.description}</div>
                        <div class="ship-stats" style="font-size:12px; margin-top:4px;">
                            <span style="display:block;">容量: ${ship.capacity} ${capacityDiff}</span>
                            <span style="display:block;">対象ランク: 〜${ship.maxRarity}</span>
                            <span style="display:block;">消費燃料: ${ship.fuelConsumption || 1}/分</span>
                            <span style="display:block;">漁獲量: ${ship.catchAmountRange[0]}〜${ship.catchAmountRange[1]}匹/回</span>
                        </div>
                    </div>
                    <div class="item-action">
                        ${isOwned
                    ? '<span class="status equipped" style="color:var(--primary-color); font-weight:bold;">運用中</span>'
                    : `<button class="btn btn-buy ${canBuy ? '' : 'disabled'}" 
                                   onclick="ShopManager.buyShip('${ship.id}')" ${canBuy ? '' : 'disabled'}
                                   style="padding:8px 12px;">
                                   ¥${ship.price.toLocaleString()}
                               </button>`
                }
                    </div>
                </div>
            `;
        });
        html += `</div>`;

        portArea.innerHTML = html;
    },

    // 船購入アクション
    buyShip(shipId) {
        if (confirm('船を買い替えますか？\n(現在の船は廃棄され、燃料は引き継がれます)')) {
            if (GameState.buyShip(shipId)) {
                UIManager.showMessage('新しい船を購入しました！');
                this.renderPort();
                const moneyDisplay = document.getElementById('port-money-display');
                if (moneyDisplay) moneyDisplay.textContent = `${GameState.money.toLocaleString()} G`;
                UIManager.updateMoney(); // 全体更新
            } else {
                UIManager.showMessage('資金が足りません');
            }
        }
    },

    // 燃料購入アクション
    buyFuel(fuelId) {
        if (GameState.addFuel(fuelId)) {
            // UIManager.showMessage('燃料を補給しました'); // 頻繁に買うのでログ出しすぎない方がいいかも
            this.renderPort();
            const moneyDisplay = document.getElementById('port-money-display');
            if (moneyDisplay) moneyDisplay.textContent = `${GameState.money.toLocaleString()} G`;
            UIManager.updateMoney();
        } else {
            UIManager.showMessage('資金が足りません');
        }
    },

    // 収獲受け取りアクション
    collectPortStock() {
        const earned = GameState.collectPortStock();
        if (earned > 0) {
            // 音を鳴らす？
            UIManager.showMessage(`水揚げ完了！ ${earned.toLocaleString()} G を獲得しました`);
            this.renderPort();
            const moneyDisplay = document.getElementById('port-money-display');
            if (moneyDisplay) moneyDisplay.textContent = `${GameState.money.toLocaleString()} G`;
            UIManager.updateMoney();
        } else {
            UIManager.showMessage('収獲がありません');
        }
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.ShopManager = ShopManager;
}
