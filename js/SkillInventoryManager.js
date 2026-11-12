const SkillInventoryManager = {
    filters: {
        search: '',
        tier: 'all',
        sort: 'tier-desc'
    },

    // 生成するHTMLテンプレート
    template: `
        <div class="inventory-controls">
            <!-- スキルセットセクション -->
            <div class="skill-sets-section" style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: bold; font-size: 14px; color: var(--text-highlight);">
                        <span class="material-icons" style="font-size: 16px; vertical-align: text-bottom; margin-right: 4px;">style</span>
                        スキルセット
                    </div>
                    <button class="btn-action" onclick="SkillInventoryManager.promptSaveSet()" style="font-size: 12px; padding: 4px 8px;">
                        <span class="material-icons" style="font-size: 14px;">save</span> 現在の装備を保存
                    </button>
                </div>
                <div class="skill-sets-list" style="
                    display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; min-height: 36px;
                    scrollbar-width: thin; scrollbar-color: var(--accent-color) rgba(255,255,255,0.1);
                ">
                    <!-- セット一覧がここに描画されます -->
                </div>
            </div>

            <div class="search-box">
                <span class="material-icons">search</span>
                <input type="text" class="skill-search" placeholder="スキル名で検索...">
            </div>
            <div class="filter-sort-row">
                <select class="skill-filter-tier">
                    <option value="all">すべてのTier</option>
                    <option value="1">Tier 1</option>
                    <option value="2">Tier 2</option>
                    <option value="3">Tier 3</option>
                </select>
                <select class="skill-sort">
                    <option value="tier-desc">Tierが高い順</option>
                    <option value="tier-asc">Tierが低い順</option>
                    <option value="name-asc">名前 (A-Z)</option>
                </select>
            </div>
            <div class="skill-stats-info" style="color: var(--text-secondary); font-size: 12px; margin-top: 4px;">
                <span class="skill-total-count">Total: 0</span> / 
                <span class="skill-equipped-count">装備: 0/0</span>
            </div>
        </div>
        <div class="shop-content" style="flex: 1; overflow-y: auto;">
            <div class="skills-grid"></div>
        </div>
    `,

    container: null,

    // コンテナを指定して初期化
    init(containerElement) {
        this.container = containerElement;

        // HTML構造を注入
        this.container.innerHTML = this.template;

        // イベントリスナー設定
        this.bindEvents();

        // 初回描画
        this.render();
    },

    bindEvents() {
        if (!this.container) return;

        const searchInput = this.container.querySelector('.skill-search');
        const filterSelect = this.container.querySelector('.skill-filter-tier');
        const sortSelect = this.container.querySelector('.skill-sort');

        searchInput.addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.render();
        });
        filterSelect.addEventListener('change', (e) => {
            this.filters.tier = e.target.value;
            this.render();
        });
        sortSelect.addEventListener('change', (e) => {
            this.filters.sort = e.target.value;
            this.render();
        });
    },

    // 所持スキルを「個別のインスタンス」としてフラットな配列に変換
    getInstances() {
        const instances = [];
        // GameState.skillInventory は { skillId: count } 形式
        // (GameState.skills ではなく GameState.skillInventory を参照するよう修正)
        const inventory = GameState.skillInventory || {};

        for (const [id, count] of Object.entries(inventory)) {
            const data = GameState.getSkillData(id);
            if (!data) continue;

            // 装備中の個数を計算
            const equippedCount = GameState.getEquippedSkillCount(id);

            for (let i = 0; i < count; i++) {
                // インデックスが装備数未満なら「装備中」とみなす（簡易的な割り当て）
                const isEquipped = i < equippedCount;
                instances.push({
                    ...data,
                    uniqueId: `${id}-${i}`,
                    isEquipped: isEquipped
                });
            }
        }
        return instances;
    },

    render() {
        if (!this.container) return;

        const grid = this.container.querySelector('.skills-grid');
        const totalCountSpan = this.container.querySelector('.skill-total-count');
        const equippedCountSpan = this.container.querySelector('.skill-equipped-count');

        let instances = this.getInstances();

        // スキルセット一覧の描画
        const setsList = this.container.querySelector('.skill-sets-list');
        if (setsList) {
            if (!GameState.skillSets || GameState.skillSets.length === 0) {
                setsList.innerHTML = '<span style="color: var(--text-secondary); font-size: 12px; font-style: italic;">保存されたセットはありません</span>';
            } else {
                setsList.innerHTML = GameState.skillSets.map((set, index) => `
                    <div class="skill-set-chip" style="
                        display: flex; align-items: center; background: rgba(0,0,0,0.3); 
                        border: 1px solid var(--border-color); border-radius: 16px; padding: 2px 2px 2px 10px; 
                        white-space: nowrap; font-size: 12px; transition: all 0.2s;">
                        <span style="cursor: pointer; margin-right: 8px;" onclick="SkillInventoryManager.handleApplySet(${index})">${set.name}</span>
                        <button class="btn-icon-sm" onclick="SkillInventoryManager.handleDeleteSet(${index})" 
                            style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; border-radius: 50%;">
                            <span class="material-icons" style="font-size: 14px;">close</span>
                        </button>
                    </div>
                `).join('');
            }
        }

        // 統計情報の更新
        totalCountSpan.textContent = `Total: ${instances.length}`;
        equippedCountSpan.textContent = `装備: ${GameState.equippedSkills.length}/${GameState.getSkillSlots()}`;

        // フィルタリング
        instances = instances.filter(inst => {
            const matchesSearch = inst.name.toLowerCase().includes(this.filters.search);
            const matchesTier = this.filters.tier === 'all' || inst.tier.toString() === this.filters.tier;
            return matchesSearch && matchesTier;
        });

        // ソート
        instances.sort((a, b) => {
            // 装備中を優先
            if (a.isEquipped !== b.isEquipped) return b.isEquipped ? 1 : -1;

            if (this.filters.sort === 'tier-desc') return b.tier - a.tier;
            if (this.filters.sort === 'tier-asc') return a.tier - b.tier;
            if (this.filters.sort === 'name-asc') return a.name.localeCompare(b.name, 'ja');
            return 0;
        });

        if (instances.length === 0) {
            grid.innerHTML = '<div class="no-skills" style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--text-secondary);">スキルが見つかりません</div>';
            return;
        }

        grid.innerHTML = instances.map(inst => `
            <div class="skill-inst-card rarity-${this.getTierRarity(inst.tier)} ${inst.isEquipped ? 'equipped' : ''}"
                 onclick="SkillInventoryManager.showSkillDialog('${inst.id}', '${inst.name}', ${inst.tier}, '${inst.description}', ${inst.isEquipped})">
                ${inst.isEquipped ? '<span class="status-badge equipped">E</span>' : ''}
                <span class="tier-badge">Tier ${inst.tier}</span>
                <span class="material-icons" style="color: var(--accent-color);">${inst.icon || 'auto_awesome'}</span>
                <span class="name">${inst.name}</span>
                <span class="desc">${inst.description}</span>
            </div>
        `).join('');
    },

    getTierRarity(tier) {
        return tier === 3 ? 'S' : tier === 2 ? 'B' : 'D';
    },

    // スキル詳細・装備ダイアログ表示
    showSkillDialog(skillId, name, tier, desc, isEquipped) {
        // 既存のダイアログがあれば削除
        const existing = document.getElementById('skill-dialog-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'skill-dialog-overlay';
        overlay.className = 'modal-overlay';

        // 装備ボタンの状態
        let actionBtnHTML = '';
        if (isEquipped) {
            actionBtnHTML = `
                <button class="btn btn-secondary" onclick="SkillInventoryManager.handleUnequip('${skillId}')">
                    はずす
                </button>
            `;
        } else {
            // 装備可能かチェック（スロット空きがあるか等）
            // 注意: ここで厳密なチェックをせず、押した後に判定でもよいが、UX的にはdisable表示が親切
            const check = GameState.canEquipSkill(skillId);
            actionBtnHTML = `
                <button class="btn btn-main ${!check.can ? 'disabled' : ''}" 
                        onclick="SkillInventoryManager.handleEquip('${skillId}')" ${!check.can ? 'disabled' : ''}>
                    装備する
                </button>
            `;
            if (!check.can) {
                actionBtnHTML += `<div style="color: #ff6b6b; font-size: 11px; margin-top: 4px;">${check.reason}</div>`;
            }
        }

        const rarityClass = `rarity-${this.getTierRarity(tier)}`;

        // アイコン取得（簡易的にデータから再取得）
        const skillData = GAME_DATA.SKILLS.find(s => s.id === skillId);
        const icon = skillData ? (skillData.icon || 'auto_awesome') : 'auto_awesome';
        // 詳細な効果値の説明などもあればここに追加できる

        overlay.innerHTML = `
            <div class="modal-content skill-detail-modal ${rarityClass}">
                <div class="modal-header">
                    <h2>${name}</h2>
                    <span class="tier-badge-large">Tier ${tier}</span>
                </div>
                <div class="modal-body">
                    <div class="skill-icon-large">
                        <span class="material-icons">${icon}</span>
                    </div>
                    <p class="skill-desc-large">${desc}</p>
                    <div class="skill-effect-detail">
                         <!-- ここに具体的な効果値などを表示（GAME_DATAから取得） -->
                         ${this.formatEffectDetail(skillData)}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-close-text" onclick="document.getElementById('skill-dialog-overlay').remove()">キャンセル</button>
                    ${actionBtnHTML}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    },

    formatEffectDetail(skill) {
        if (!skill) return '';
        const e = skill.effect;
        let text = '';
        if (e.type === 'power_boost') text = `パワー +${e.value}`;
        else if (e.type === 'price_boost') text = `売値 +${Math.round(e.value * 100)}%`;
        else if (e.type === 'gauge_slow') text = `ゲージ速度 -${Math.round(e.value * 100)}%`;
        else if (e.type === 'catch_boost') text = `捕獲率 +${Math.round(e.value * 100)}%`;
        else if (e.type === 'rare_boost') text = `レア出現率 +${Math.round(e.value * 100)}%`;
        // ... 他の効果タイプに応じたフォーマット
        return text ? `<div class="effect-tag">${text}</div>` : '';
    },

    handleEquip(skillId) {
        const result = GameState.equipSkill(skillId);
        if (result.can) {
            UIManager.showMessage('装備しました！');
            this.closeDialog();
            this.render(); // リスト更新（装備バッジが付く）
            if (window.ShopManager) ShopManager.renderSkillSlotInfo(); // ヘッダー情報更新
        } else {
            UIManager.showMessage(result.reason);
        }
    },

    handleUnequip(skillId) {
        const result = GameState.unequipSkill(skillId);
        if (result.can) {
            UIManager.showMessage('装備をはずしました');
            this.closeDialog();
            this.render();
            if (window.ShopManager) ShopManager.renderSkillSlotInfo(); // ヘッダー情報更新
        }
    },

    closeDialog() {
        const existing = document.getElementById('skill-dialog-overlay');
        if (existing) existing.remove();
    },

    // ========================================
    // スキルセット操作
    // ========================================
    promptSaveSet() {
        const name = prompt('保存するスキルセットの名前を入力してください:');
        if (name) {
            GameState.saveCurrentSkillSet(name);
            UIManager.showMessage(`セット「${name}」を保存しました`);
            this.render();
        }
    },

    handleApplySet(index) {
        const result = GameState.applySkillSet(index);
        if (result.success) {
            UIManager.showMessage('スキルセットを装備しました');
            this.render();
            if (window.ShopManager) ShopManager.renderSkillSlotInfo();
        } else {
            UIManager.showMessage(`装備できません: ${result.message}`, true);
        }
    },

    handleDeleteSet(index) {
        // 確認
        if (!confirm('このスキルセットを削除しますか？')) return;

        if (GameState.skillSets && GameState.skillSets[index]) {
            const name = GameState.skillSets[index].name;
            GameState.skillSets.splice(index, 1);

            if (window.SaveManager) SaveManager.save(GameState);

            UIManager.showMessage(`セット「${name}」を削除しました`);
            this.render();
        }
    }
};
