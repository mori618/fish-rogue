// 港（ラウンド間）画面と、航海まわりのモーダルの描画
// 状態の変更はすべて RunManager 経由で行い、ここは表示と入力の受け渡しだけを担当する。

const HarborUI = {
    tab: 'shop',  // 'shop' | 'loadout'

    TIER_LABELS: { 0: '特別', 1: 'I', 2: 'II', 3: 'III', 4: '極' },

    // ========================================
    // 港画面
    // ========================================
    render() {
        const run = GameState.run;
        const main = document.getElementById('harbor-main');
        if (!main || !run || !run.harbor) return;

        const harbor = run.harbor;
        document.getElementById('harbor-title').textContent = `港 ― ラウンド${run.round} クリア`;
        UIManager.updateMoney();

        const tabs = document.getElementById('harbor-tabs');
        const departBtn = document.getElementById('depart-btn');

        if (!harbor.rewardTaken) {
            // まず報酬スキルを選ぶ（選ぶまで買い物・出航はできない）
            tabs.classList.add('hidden');
            departBtn.disabled = true;
            main.innerHTML = this.summaryHtml(harbor.summary) + this.rewardHtml(harbor);
        } else {
            tabs.classList.remove('hidden');
            departBtn.disabled = false;
            tabs.querySelectorAll('.shop-tab').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === this.tab);
            });
            document.getElementById('harbor-loadout-count').textContent =
                `${GameState.equippedSkills.length}/${GameState.getSkillSlots()}`;
            main.innerHTML = this.tab === 'shop' ? this.shopHtml(harbor) : this.loadoutHtml();
        }

        const nextRound = run.round + 1;
        const nextBait = GameState.getTotalBaitCount() + RunManager.config.baitPerRound;
        document.getElementById('harbor-next').innerHTML = `
            <span class="rg-next-label">次 ROUND ${nextRound}</span>
            <span class="rg-next-value">目標 ${RunManager.getTarget(nextRound).toLocaleString()} G ／ 餌 ${nextBait}個</span>
        `;
    },

    setTab(tab) {
        this.tab = tab;
        this.render();
    },

    summaryHtml(summary) {
        const banner = summary.isFinalClear
            ? `<div class="rg-banner"><span class="material-icons">emoji_events</span> 航海達成！ ここから先はエンドレスです</div>`
            : '';

        return `
            ${banner}
            <div class="rg-summary">
                <div class="rg-summary-row"><span>水揚げ</span><strong>${summary.earned.toLocaleString()} / ${summary.target.toLocaleString()} G</strong></div>
                <div class="rg-summary-row"><span>クリアボーナス</span><strong class="rg-plus">+${summary.clearBonus.toLocaleString()} G</strong></div>
                <div class="rg-summary-row"><span>余った基本の餌 ×${summary.leftover}</span><strong class="rg-plus">+${summary.leftoverBonus.toLocaleString()} G</strong></div>
            </div>
        `;
    },

    rewardHtml(harbor) {
        const cards = harbor.rewardOptions.map((id, index) => {
            const skill = GameState.getSkillData(id);
            return `
                <button class="rg-reward-card rg-tier-${skill.tier}" onclick="HarborUI.onChooseReward(${index})">
                    <span class="material-icons rg-reward-icon">${skill.icon || 'auto_fix_high'}</span>
                    <span class="rg-tier-badge rg-tier-${skill.tier}">${this.TIER_LABELS[skill.tier]}</span>
                    <span class="rg-reward-name">${skill.name}</span>
                    <span class="rg-reward-desc">${skill.description}</span>
                </button>
            `;
        }).join('');

        return `
            <h3 class="rg-section-title"><span class="material-icons">redeem</span> 報酬スキルを1つ選ぶ</h3>
            <div class="rg-reward-list">${cards}</div>
            <button class="btn-nav rg-skip-btn" onclick="HarborUI.onSkipReward()">
                受け取らずに +${RunManager.getRewardSkipBonus().toLocaleString()} G もらう
            </button>
        `;
    },

    // ----------------------------------------
    // ショップタブ: スキル・餌・竿
    // ----------------------------------------
    shopHtml(harbor) {
        const money = GameState.money;

        const skillRows = harbor.shopSkills.map((offer, index) => {
            const price = RunManager.getSkillPrice(offer.id);
            const action = offer.sold
                ? `<span class="rg-sold">売り切れ</span>`
                : this.buyButton(price, money, `HarborUI.onBuySkill(${index})`);
            return this.skillRow(offer.id, action, offer.sold ? 'locked' : '');
        }).join('');

        const rerollCost = RunManager.getRerollCost();
        const rerollBtn = `
            <button class="btn rg-reroll-btn ${money < rerollCost ? 'disabled' : ''}" onclick="HarborUI.onReroll()">
                <span class="material-icons">refresh</span> 入れ替え ${rerollCost.toLocaleString()} G
            </button>
        `;

        const baitRows = RunManager.getBaitOffers().map(item => {
            const bait = GAME_DATA.BAITS.find(b => b.id === item.id);
            const action = item.stock <= 0
                ? `<span class="rg-sold">売り切れ</span>`
                : this.buyButton(item.price, money, `HarborUI.onBuyBait('${item.id}')`);
            return `
                <div class="shop-item ${item.stock <= 0 ? 'locked' : ''}">
                    <span class="rg-rank-chip rarity-${bait.rank}">${bait.rank}</span>
                    <div class="item-info">
                        <div class="item-name">${bait.name} ×${item.quantity}</div>
                        <div class="item-desc">所持 ${GameState.getBaitCount(item.id)}個 ／ 在庫 ${item.stock}</div>
                    </div>
                    <div class="item-action">${action}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="rg-section-head">
                <h3 class="rg-section-title"><span class="material-icons">auto_fix_high</span> スキル</h3>
                ${rerollBtn}
            </div>
            <div class="shop-items">${skillRows}</div>

            <h3 class="rg-section-title"><span class="material-icons">set_meal</span> 餌 <small>買った餌は次のラウンドに持ち越せます</small></h3>
            <div class="shop-items">${baitRows}</div>

            <h3 class="rg-section-title"><span class="material-icons">phishing</span> 竿 <small>購入・強化のたびにスキルスロット+1</small></h3>
            <div class="shop-items">${this.rodHtml(money)}</div>
        `;
    },

    rodHtml(money) {
        const rod = GameState.getCurrentRod();
        const stars = GameState.rodStars;
        const power = rod.basePower + rod.starPowerBonus * stars;
        const starsHtml = '★'.repeat(stars) + '☆'.repeat(5 - stars);

        const upgradeCost = GameState.getUpgradeCost();
        const upgradeAction = upgradeCost === null
            ? `<span class="rg-sold">最大</span>`
            : this.buyButton(upgradeCost, money, 'HarborUI.onUpgradeRod()');

        let html = `
            <div class="shop-item">
                <div class="item-info">
                    <div class="item-name">${rod.name} <span class="rg-stars">${starsHtml}</span></div>
                    <div class="item-desc">${upgradeCost === null
                        ? `竿パワー ${power}`
                        : `星強化: 竿パワー ${power} → ${power + rod.starPowerBonus}`}</div>
                </div>
                <div class="item-action">${upgradeAction}</div>
            </div>
        `;

        const nextIndex = GameState.rodRankIndex + 1;
        const nextRod = GAME_DATA.RODS[nextIndex];
        if (nextRod) {
            html += `
                <div class="shop-item">
                    <div class="item-info">
                        <div class="item-name">${nextRod.name} に買い替え</div>
                        <div class="item-desc">竿パワー ${power} → ${nextRod.basePower}（星は0から。星1つで+${nextRod.starPowerBonus}）</div>
                    </div>
                    <div class="item-action">${this.buyButton(GameState.getRodPrice(nextIndex), money, 'HarborUI.onBuyRod()')}</div>
                </div>
            `;
        }
        return html;
    },

    // ----------------------------------------
    // 装備タブ: スキルの付け替え・売却
    // ----------------------------------------
    loadoutHtml() {
        const equipped = GameState.equippedSkills;
        const slots = GameState.getSkillSlots();

        const equippedRows = equipped.map(id => this.skillRow(id,
            `<button class="btn btn-unequip" onclick="HarborUI.onToggleSkill('${id}', false)">外す</button>`,
            'equipped')).join('');

        // 装備していない分（所持数 − 装備数）を控えとして並べる
        const benchRows = Object.keys(GameState.skillInventory).map(id => {
            const spare = GameState.getSkillCount(id) - GameState.getEquippedSkillCount(id);
            return Array.from({ length: Math.max(0, spare) }, () => this.skillRow(id, `
                <button class="btn btn-equip" onclick="HarborUI.onToggleSkill('${id}', true)">装備</button>
                <button class="btn rg-sell-btn" onclick="HarborUI.onSellSkill('${id}')">売る +${RunManager.getSkillSellPrice(id).toLocaleString()}</button>
            `)).join('');
        }).join('');

        const emptySlots = Array.from({ length: Math.max(0, slots - equipped.length) },
            () => `<div class="rg-empty-slot">空きスロット</div>`).join('');

        return `
            <div class="rg-summary">
                <div class="rg-summary-row"><span>釣りパワー</span><strong>${GameState.getTotalPower()}</strong></div>
                <div class="rg-summary-row"><span>スキルスロット</span><strong>${equipped.length} / ${slots}</strong></div>
            </div>
            <h3 class="rg-section-title"><span class="material-icons">bolt</span> 装備中</h3>
            <div class="shop-items">${equippedRows}${emptySlots}</div>
            <h3 class="rg-section-title"><span class="material-icons">inventory_2</span> 控え</h3>
            <div class="shop-items">${benchRows || '<div class="rg-empty-slot">控えのスキルはありません</div>'}</div>
        `;
    },

    // ----------------------------------------
    // 共通パーツ
    // ----------------------------------------
    skillRow(skillId, actionHtml, extraClass = '') {
        const skill = GameState.getSkillData(skillId);
        return `
            <div class="shop-item ${extraClass}">
                <span class="material-icons rg-skill-icon rg-tier-${skill.tier}">${skill.icon || 'auto_fix_high'}</span>
                <div class="item-info">
                    <div class="item-name">${skill.name} <span class="rg-tier-badge rg-tier-${skill.tier}">${this.TIER_LABELS[skill.tier]}</span></div>
                    <div class="item-desc">${skill.description}</div>
                </div>
                <div class="item-action rg-actions">${actionHtml}</div>
            </div>
        `;
    },

    buyButton(price, money, onclick) {
        const affordable = money >= price;
        return `<button class="btn btn-buy ${affordable ? '' : 'disabled'}" onclick="${onclick}">${price.toLocaleString()} G</button>`;
    },

    // ========================================
    // 港: 入力ハンドラ
    // ========================================
    _after(success, failMessage = 'お金が足りません') {
        if (!success) UIManager.showMessage(failMessage, 1500);
        this.render();
    },

    onChooseReward(index) {
        const skillId = GameState.run.harbor.rewardOptions[index];
        if (RunManager.chooseReward(index)) {
            const equippedNow = GameState.getEquippedSkillCount(skillId) > 0;
            UIManager.showNotification('スキル獲得', equippedNow
                ? `${GameState.getSkillData(skillId).name} を装備しました`
                : `${GameState.getSkillData(skillId).name} を控えに入れました（スロットが一杯です）`, 'auto_fix_high', 2500);
        }
        this.tab = 'shop';
        this.render();
    },

    onSkipReward() {
        RunManager.skipReward();
        this.tab = 'shop';
        this.render();
    },

    onBuySkill(index) { this._after(RunManager.buySkill(index)); },
    onReroll() { this._after(RunManager.rerollSkills()); },
    onBuyBait(baitId) { this._after(RunManager.buyBait(baitId)); },
    onUpgradeRod() { this._after(RunManager.upgradeRod()); },
    onBuyRod() { this._after(RunManager.buyNextRod()); },
    onSellSkill(skillId) { this._after(RunManager.sellSkill(skillId), '売却できませんでした'); },

    onToggleSkill(skillId, equip) {
        const result = RunManager.toggleSkill(skillId, equip);
        this._after(result.can, result.reason);
    },

    onDepart() {
        if (!RunManager.depart()) {
            UIManager.showMessage('先に報酬スキルを選んでください', 1500);
        }
    },

    // ========================================
    // モーダル共通
    // ========================================
    openModal(id, innerHtml) {
        this.closeModal(id);
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = id;
        overlay.innerHTML = `<div class="modal-content rg-modal">${innerHtml}</div>`;
        // 釣り画面のタップ判定（キャスト）に流れないようにする
        overlay.addEventListener('pointerdown', e => e.stopPropagation());
        document.body.appendChild(overlay);
        return overlay;
    },

    closeModal(id) {
        const existing = document.getElementById(id);
        if (existing) existing.remove();
    },

    // ========================================
    // 釣り中の装備確認（閲覧のみ。変更は港で行う）
    // ========================================
    showBuild() {
        const run = GameState.run;
        if (!run) return;

        const rod = GameState.getCurrentRod();
        const skills = GameState.equippedSkills.map(id => this.skillRow(id, '')).join('')
            || '<div class="rg-empty-slot">スキルを装備していません</div>';

        const overlay = this.openModal('build-modal', `
            <div class="modal-header">
                <h2><span class="material-icons">backpack</span> 装備</h2>
                <button class="btn-close" onclick="HarborUI.closeModal('build-modal')"><span class="material-icons">close</span></button>
            </div>
            <div class="rg-modal-body">
                <div class="rg-summary">
                    <div class="rg-summary-row"><span>竿</span><strong>${rod.name} ${'★'.repeat(GameState.rodStars)}</strong></div>
                    <div class="rg-summary-row"><span>釣りパワー</span><strong>${GameState.getTotalPower()}</strong></div>
                    <div class="rg-summary-row"><span>スキルスロット</span><strong>${GameState.equippedSkills.length} / ${GameState.getSkillSlots()}</strong></div>
                </div>
                <div class="shop-items">${skills}</div>
                <p class="rg-note">装備の変更と買い物は、ラウンドをクリアした後の港で行えます。</p>
                <button class="btn-nav rg-retire-btn" onclick="HarborUI.onRetire()">この航海をリタイアする</button>
            </div>
        `);
        overlay.addEventListener('click', e => {
            if (e.target === overlay) this.closeModal('build-modal');
        });
    },

    onRetire() {
        if (!window.confirm('この航海を終了しますか？（進行状況は失われます）')) return;
        this.closeModal('build-modal');
        RunManager.retire();
    },

    // ========================================
    // ゲームオーバー
    // ========================================
    showGameOver(isBest) {
        const run = GameState.run;
        const cleared = run.round - 1;
        const biggest = GameState.biggestFish ? GameState.biggestFish.name : '―';

        this.openModal('gameover-modal', `
            <div class="rg-gameover">
                <div class="rg-gameover-title">GAME OVER</div>
                <p class="rg-gameover-lead">ラウンド${run.round}で餌が尽きた…<br>
                    水揚げ ${run.earned.toLocaleString()} / ${run.target.toLocaleString()} G</p>
                ${isBest ? '<div class="rg-banner"><span class="material-icons">military_tech</span> 最高記録を更新！</div>' : ''}
                <div class="rg-summary">
                    <div class="rg-summary-row"><span>クリアしたラウンド</span><strong>${cleared}</strong></div>
                    <div class="rg-summary-row"><span>釣った魚</span><strong>${GameState.totalFishCaught} 匹</strong></div>
                    <div class="rg-summary-row"><span>稼いだ総額</span><strong>${GameState.totalMoneyEarned.toLocaleString()} G</strong></div>
                    <div class="rg-summary-row"><span>一番の大物</span><strong>${biggest}</strong></div>
                </div>
                <div class="rg-gameover-actions">
                    <button class="btn-main" onclick="HarborUI.onRestart()">もう一度</button>
                    <button class="btn-nav" onclick="HarborUI.onBackToTitle()">タイトルへ</button>
                </div>
            </div>
        `);
    },

    onRestart() {
        this.closeModal('gameover-modal');
        RunManager.startNewRun();
    },

    onBackToTitle() {
        this.closeModal('gameover-modal');
        GameState.run = null;
        UIManager.showScreen('start');
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.HarborUI = HarborUI;
}
