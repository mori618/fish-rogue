/**
 * SynthesisManager - スキル合成UIとロジックを管理
 */
const SynthesisManager = {
    selectedSlot1: null,
    selectedSlot2: null,

    /**
     * 合成画面のレンダリング
     */
    render() {
        const container = document.getElementById('synthesis-main-area');
        const moneyDisplay = document.getElementById('synthesis-money-display');
        if (!container) return;

        moneyDisplay.textContent = `¥${GameState.money.toLocaleString()}`;

        let html = `
            <div class="synthesis-container">
                <div class="synthesis-slots-area">
                    <div class="synthesis-slot-wrapper">
                        <div class="slot-label">素材 1</div>
                        <div id="synth-slot-1" class="synthesis-slot ${this.selectedSlot1 ? 'filled' : 'empty'}" onclick="SynthesisManager.openSelection(1)">
                            ${this.renderSlotContent(this.selectedSlot1)}
                        </div>
                    </div>
                    <div class="synthesis-plus"><span class="material-icons">add</span></div>
                    <div class="synthesis-slot-wrapper">
                        <div class="slot-label">素材 2</div>
                        <div id="synth-slot-2" class="synthesis-slot ${this.selectedSlot2 ? 'filled' : 'empty'}" onclick="SynthesisManager.openSelection(2)">
                            ${this.renderSlotContent(this.selectedSlot2)}
                        </div>
                    </div>
                </div>

                <div class="synthesis-arrow">
                    <span class="material-icons">keyboard_double_arrow_down</span>
                </div>

                <div class="synthesis-result-area">
                    <div class="slot-label">合成予測</div>
                    <div id="synth-result-slot" class="synthesis-result-slot">
                        ${this.renderResultPreview()}
                    </div>
                </div>

                <div class="synthesis-actions">
                    <button class="btn btn-synth-execute ${this.canSynthesize() ? '' : 'disabled'}" 
                            onclick="SynthesisManager.executeSynthesis()" ${this.canSynthesize() ? '' : 'disabled'}>
                        <span class="material-icons">auto_fix_high</span> 合成開始 (消費: ${this.getSynthesisCost()})
                    </button>
                    <button class="btn btn-synth-reset" onclick="SynthesisManager.resetSlots()">
                        リセット
                    </button>
                </div>

                <div class="synthesis-help-box">
                    <ul>
                        <li><span class="highlight">ランクアップ:</span> 同じスキル(Tier1-3)を2つで、1ランク上のスキルを生成します。</li>
                        <li><span class="highlight">ハイブリッド:</span> 違うスキル(同じTier)を組み合わせ、両方の効果を持つスキルを生成します。</li>
                        <li>※一部の特殊スキル、Tier4、ハイブリッドスキルは素材にできません。</li>
                    </ul>
                </div>
            </div>

            <!-- スキル選択モーダル的なオーバーレイ -->
            <div id="skill-selector-overlay" class="skill-selector-overlay hidden">
                <div class="selector-content">
                    <div class="selector-header">
                        <h3>素材スキルの選択</h3>
                        <button class="btn-close" onclick="SynthesisManager.closeSelection()"><span class="material-icons">close</span></button>
                    </div>
                    <div id="selector-list" class="selector-list">
                        <!-- 所持スキルがここに並ぶ -->
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    renderSlotContent(skillId) {
        if (!skillId) {
            return `<div class="slot-placeholder"><span class="material-icons">add_circle_outline</span><div>スキルを選択</div></div>`;
        }
        const skill = GameState.getSkillData(skillId);
        return `
            <div class="item-icon tier-${skill.tier}"><span class="material-icons">bolt</span></div>
            <div class="item-name">${skill.name}</div>
            <div class="item-tier">Tier ${skill.tier}</div>
        `;
    },

    renderResultPreview() {
        if (!this.selectedSlot1 || !this.selectedSlot2) {
            return `<div class="result-placeholder">素材を2つ選択してください</div>`;
        }

        const skill1 = GameState.getSkillData(this.selectedSlot1);
        const skill2 = GameState.getSkillData(this.selectedSlot2);

        // 素材IDからベースIDとTierを抽出
        const base1 = this.selectedSlot1.replace(/_\d$/, '');
        const base2 = this.selectedSlot2.replace(/_\d$/, '');
        const tier = skill1.tier;

        // 優先順位: 1. 特殊合成 (レシピ一致) -> 2. ランクアップ (同名) -> 3. ハイブリッド (異名)
        const key1 = base1 + '+' + base2;
        const key2 = base2 + '+' + base1;
        const resultBaseId = GAME_DATA.SPECIAL_RECIPES[key1] || GAME_DATA.SPECIAL_RECIPES[key2];

        if (skill1.tier === skill2.tier && resultBaseId) {
            // 特殊合成 (Tier無し)
            const resultId = resultBaseId;
            const resultSkill = GAME_DATA.SKILLS.find(s => s.id === resultId);

            if (resultSkill) {
                return `
                     <div class="result-success special">
                         <div class="result-label" style="color: #ffca28; font-weight: bold;">SPECIAL!</div>
                         <div class="item-name rarity-SS" style="text-shadow: 0 0 5px #ffeb3b;">${resultSkill.name}</div>
                         <div class="item-desc">${resultSkill.description}</div>
                     </div>
                 `;
            } else {
                return `<div class="result-error">特殊スキルのデータが見つかりません</div>`;
            }
        } else if (this.selectedSlot1 === this.selectedSlot2) {
            // ランクアップ
            if (skill1.tier >= 4) return `<div class="result-error">これ以上強化できません</div>`;
            const nextTier = skill1.tier + 1;
            const resultId = `${base1}_${nextTier}`;
            const resultSkill = GAME_DATA.SKILLS.find(s => s.id === resultId);

            if (!resultSkill) return `<div class="result-error">上位スキルが未定義です</div>`;

            return `
                <div class="result-success">
                    <div class="result-label">RANK UP!</div>
                    <div class="item-name rarity-S">${resultSkill.name}</div>
                    <div class="item-desc">${resultSkill.description}</div>
                </div>
            `;
        } else {
            // ハイブリッド
            if (skill1.tier !== skill2.tier) return `<div class="result-error">Tierが一致していません</div>`;
            if (skill1.tier >= 4 || skill2.tier >= 4) return `<div class="result-error">Tier 4は素材不可</div>`;
            if (skill1.effect.type === 'hybrid' || skill2.effect.type === 'hybrid') return `<div class="result-error">ハイブリッドは素材不可</div>`;

            return `
                <div class="result-success">
                    <div class="result-label">HYBRID</div>
                    <div class="item-name rarity-A">${skill1.name.split(' ')[0]}と${skill2.name.split(' ')[0]}の融合</div>
                    <div class="item-desc">両方の効果を併せ持つ</div>
                </div>
            `;
        }
    },

    canSynthesize() {
        if (!this.selectedSlot1 || !this.selectedSlot2) return false;

        const skill1 = GameState.getSkillData(this.selectedSlot1);
        const skill2 = GameState.getSkillData(this.selectedSlot2);

        // 基本バリデーション
        if (this.selectedSlot1 === this.selectedSlot2) {
            const total = GameState.getSkillCount(this.selectedSlot1);
            const equipped = GameState.getEquippedSkillCount(this.selectedSlot1);
            if ((total - equipped) < 2) return false;

            if (skill1.tier >= 4) return false;
        } else {
            // Slot 1 Check
            const total1 = GameState.getSkillCount(this.selectedSlot1);
            const equipped1 = GameState.getEquippedSkillCount(this.selectedSlot1);
            if ((total1 - equipped1) < 1) return false;

            // Slot 2 Check
            const total2 = GameState.getSkillCount(this.selectedSlot2);
            const equipped2 = GameState.getEquippedSkillCount(this.selectedSlot2);
            if ((total2 - equipped2) < 1) return false;

            if (skill1.tier !== skill2.tier) return false;
            if (skill1.tier >= 4 || skill2.tier >= 4) return false; // Tier 4は素材不可
            if (skill1.effect.type === 'hybrid' || skill2.effect.type === 'hybrid') return false;
        }

        // 費用
        const costStr = this.getSynthesisCost().replace(/[^0-9]/g, '');
        const cost = parseInt(costStr) || 0;
        if (GameState.money < cost) return false;

        return true;
    },

    getSynthesisCost() {
        if (!this.selectedSlot1 || !this.selectedSlot2) return "--- G";

        const skill1 = GameState.getSkillData(this.selectedSlot1);
        const skill2 = GameState.getSkillData(this.selectedSlot2);

        if (this.selectedSlot1 === this.selectedSlot2) {
            const costs = { 1: 1000, 2: 5000, 3: 20000 };
            return `${(costs[skill1.tier] || 50000).toLocaleString()} G`;
        } else {
            if (skill1.tier !== skill2.tier) return "--- G";

            // 特殊合成なら費用アップ
            const base1 = this.selectedSlot1.replace(/_\d$/, '');
            const base2 = this.selectedSlot2.replace(/_\d$/, '');
            const recipeKey = [base1, base2].sort().join('+');
            const isSpecial = !!GAME_DATA.SPECIAL_RECIPES[recipeKey];

            const hybridCosts = { 1: 1500, 2: 7500, 3: 30000 };
            const specialCosts = { 1: 3000, 2: 15000, 3: 60000 };

            const baseCost = isSpecial ? specialCosts[skill1.tier] : hybridCosts[skill1.tier];
            return `${(baseCost || 75000).toLocaleString()} G`;
        }
    },

    openSelection(slotNum) {
        this.activeSlot = slotNum;
        const overlay = document.getElementById('skill-selector-overlay');
        const list = document.getElementById('selector-list');
        overlay.classList.remove('hidden');

        // 所持スキルリストの生成
        list.innerHTML = '';

        const skills = [];
        for (const id in GameState.skillInventory) {
            if (GameState.skillInventory[id] > 0) {
                const data = GameState.getSkillData(id);
                if (data) skills.push(data);
            }
        }

        // ソート: Tier降順
        skills.sort((a, b) => b.tier - a.tier);

        if (skills.length === 0) {
            list.innerHTML = `<div class="empty-msg">所持スキルがありません</div>`;
            return;
        }

        skills.forEach(skill => {
            const otherSlotId = this.activeSlot === 1 ? this.selectedSlot2 : this.selectedSlot1;
            const isAlreadySelected = (skill.id === otherSlotId);

            const totalCount = GameState.skillInventory[skill.id] || 0;
            const equippedCount = GameState.getEquippedSkillCount(skill.id);
            const availableCount = totalCount - equippedCount;

            const needed = isAlreadySelected ? 2 : 1;
            const insufficientCount = availableCount < needed;

            // 合成不可の除外
            const isHybrid = skill.effect.type === 'hybrid';
            const isTier4 = skill.tier === 4;
            const isDisabled = isHybrid || isTier4 || insufficientCount;

            let reason = '';
            if (isHybrid) reason = 'ハイブリッドは素材にできません';
            else if (isTier4) reason = 'Tier 4は素材にできません';
            else if (insufficientCount) {
                if (equippedCount > 0) {
                    reason = `残りすべて装備中 (所持:${totalCount}, 装備:${equippedCount})`;
                } else {
                    reason = '所持数が足りません';
                }
            }

            const card = document.createElement('div');
            card.className = `skill-select-card tier-${skill.tier} ${isDisabled ? 'disabled' : ''}`;
            card.innerHTML = `
                <div class="skill-info">
                    <div class="name">${skill.name}</div>
                    <div class="tier">Tier ${skill.tier} / 所持: ${totalCount} (余り: ${availableCount})</div>
                    <div class="desc">${skill.description}</div>
                    ${reason ? `<div class="selection-msg">${reason}</div>` : ''}
                </div>
            `;
            if (!isDisabled) {
                card.onclick = () => this.selectSkill(skill.id);
            }
            list.appendChild(card);
        });
    },

    selectSkill(skillId) {
        if (this.activeSlot === 1) {
            this.selectedSlot1 = skillId;
        } else {
            this.selectedSlot2 = skillId;
        }
        this.closeSelection();
        this.render();
    },

    closeSelection() {
        const overlay = document.getElementById('skill-selector-overlay');
        overlay.classList.add('hidden');
    },

    resetSlots() {
        this.selectedSlot1 = null;
        this.selectedSlot2 = null;
        this.render();
    },

    executeSynthesis() {
        if (!this.canSynthesize()) return;

        const res = GameState.synthesizeSkills(this.selectedSlot1, this.selectedSlot2);
        if (res.success) {
            UIManager.showMessage(`✨ 合成に成功しました！\n「${res.skill.name}」を獲得！`);
            this.resetSlots();
        } else {
            UIManager.showMessage(`❌ 合成に失敗しました: ${res.message}`);
        }
    }
};
