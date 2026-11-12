// チンチロ（カジノ）のロジック管理
// 役の判定、勝敗、配当計算などを担当

const CasinoManager = {
    // ========================================
    // 状態
    // ========================================
    currentTab: 'dice', // dice, rules
    currentBet: 100,
    currentBetPage: 0,
    chinchiroState: 'ready', // ready, playing
    rollResolver: null, // Promise resolver for manual roll

    BET_PAGES: [
        [100, 500, 1000, 5000],
        [10000, 50000, 100000, 500000]
    ],

    // ========================================
    // UI管理
    // ========================================
    switchTab(tab) {
        this.currentTab = tab;
        this.render();
    },

    render() {
        const area = document.getElementById('casino-main-area');
        if (!area) return;
        area.innerHTML = '';

        // 所持金の表示更新
        const moneyDisplay = document.getElementById('casino-money-display');
        if (moneyDisplay) moneyDisplay.textContent = `¥${GameState.money.toLocaleString()}`;

        // タブナビゲーション
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'casino-tabs sub-tabs';
        tabsContainer.style.marginBottom = '20px';
        tabsContainer.style.justifyContent = 'center';
        tabsContainer.innerHTML = `
            <button class="casino-tab ${this.currentTab === 'dice' ? 'active' : ''}" onclick="CasinoManager.switchTab('dice')">
                <span class="material-icons">casino</span> チンチロ
            </button>
            <button class="casino-tab ${this.currentTab === 'rules' ? 'active' : ''}" onclick="CasinoManager.switchTab('rules')">
                <span class="material-icons">description</span> ルール説明
            </button>
        `;
        area.appendChild(tabsContainer);

        // コンテンツエリア
        const contentContainer = document.createElement('div');
        contentContainer.className = 'casino-content';
        area.appendChild(contentContainer);

        if (this.currentTab === 'dice') {
            this.renderDiceGame(contentContainer);
        } else if (this.currentTab === 'rules') {
            const rulesSection = document.createElement('div');
            rulesSection.className = 'rules-section';
            this.renderRules(rulesSection);
            contentContainer.appendChild(rulesSection);
        }
    },

    // ========================================
    // ルール画面のレンダリング
    // ========================================
    renderRules(container) {
        const dots = this.getDotHtml();
        const getDiceHtml = (vals) => {
            return `<div class="dice-container" style="gap: 8px;">
                ${vals.map(v => `
                    <div class="dice" data-value="${v}" style="width: 32px; height: 32px; transform: none; box-shadow: 1px 1px 4px rgba(0,0,0,0.5);">
                        <div class="dot-container" style="width: 100%; height: 100%; gap: 1px;">${dots}</div>
                    </div>
                `).join('')}
            </div>`;
        };

        container.innerHTML = `
            <div id="chinchiro-container" style="background: transparent; box-shadow: none; border: none; padding: 0;">
                <div style="padding: 20px; color: #fff;">
                    <h3 style="text-align: center; margin-bottom: 20px; color: #ffd700;">チンチロリン ルール</h3>
                    
                    <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                        <h4 style="margin-bottom: 10px; border-bottom: 1px solid #555; padding-bottom: 5px;">基本ルール</h4>
                        <p style="font-size: 0.9em; line-height: 1.6;">
                            親（胴元）と子（あなた）がサイコロを3つ振って、出た目で勝負します。<br>
                            3回まで挑戦でき、役が出た時点で確定します。3回とも「目なし」の場合は負け扱いとなります。
                        </p>
                    </div>

                    <div style="display: grid; gap: 10px;">
                        ${this._createRuleRow('ピンゾロ (1-1-1)', '最強の役。配当 <span style="font-weight:bold;color:#fff;">5倍</span>', '#ffd700', getDiceHtml([1, 1, 1]))}
                        ${this._createRuleRow('アラシ (N-N-N)', 'ゾロ目 (1以外)。配当 <span style="font-weight:bold;color:#fff;">3倍</span>', '#c0c0c0', getDiceHtml([3, 3, 3]))}
                        ${this._createRuleRow('シゴロ (4-5-6)', '順子。配当 <span style="font-weight:bold;color:#fff;">2倍</span>', '#ff6464', getDiceHtml([4, 5, 6]))}
                        ${this._createRuleRow('通常の目 (N-N-M)', 'ペア以外の数字が強さ。配当 1倍', '#64c8ff', getDiceHtml([6, 6, 4]))}
                        ${this._createRuleRow('ヒフミ (1-2-3)', '最弱の役。支払い <span style="font-weight:bold;color:#ff4444;">2倍</span>', '#ff4444', getDiceHtml([1, 2, 3]))}
                        ${this._createRuleRow('目なし', '役なし。支払い 1倍', '#888', getDiceHtml([1, 4, 5]))}
                    </div>
                </div>
            </div>
        `;
    },

    _createRuleRow(title, desc, color, diceHtml) {
        return `
            <div style="background: rgba(${this._hexToRgb(color)}, 0.2); padding: 10px; border-radius: 8px; border-left: 4px solid ${color}; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: bold; color: ${color};">${title}</div>
                    <div style="font-size: 0.9em;">${desc}</div>
                </div>
                ${diceHtml}
            </div>
        `;
    },

    _hexToRgb(hex) {
        // Simple hex to rgb string 'r, g, b' conversion
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length === 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',');
        }
        return '255,255,255';
    },

    // ========================================
    // チンチロ (Dice Game) - Refactored
    // ========================================
    getDotHtml() {
        return Array(9).fill('<div class="dot"></div>').join('');
    },

    renderDiceGame(container) {
        this.chinchiroState = 'ready'; // Reset state on render

        const dots = this.getDotHtml();

        const html = `
            <div id="chinchiro-container">
                <div class="battle-view">
                    <div id="chinchiro-opponent-panel" class="opponent-area">
                        <div class="label">対戦相手（胴元）</div>
                        <div class="dice-container" id="chinchiro-opponent-dice">
                            <div class="dice" data-value="?"><div class="dot-container">${dots}</div></div>
                            <div class="dice" data-value="?"><div class="dot-container">${dots}</div></div>
                            <div class="dice" data-value="?"><div class="dot-container">${dots}</div></div>
                        </div>
                        <div id="chinchiro-opponent-hand" class="hand-status">-</div>
                    </div>

                    <div id="chinchiro-bowl" class="bowl">
                        <div class="dice-container" id="chinchiro-active-dice">
                            <div class="dice" id="chinchiro-d1" data-value="1"><div class="dot-container">${dots}</div></div>
                            <div class="dice" id="chinchiro-d2" data-value="1"><div class="dot-container">${dots}</div></div>
                            <div class="dice" id="chinchiro-d3" data-value="1"><div class="dot-container">${dots}</div></div>
                        </div>
                    </div>

                    <div id="chinchiro-player-panel" class="player-area">
                        <div class="label">あなた</div>
                        <div class="dice-container" id="chinchiro-player-dice">
                            <div class="dice" data-value="?"><div class="dot-container">${dots}</div></div>
                            <div class="dice" data-value="?"><div class="dot-container">${dots}</div></div>
                            <div class="dice" data-value="?"><div class="dot-container">${dots}</div></div>
                        </div>
                        <div id="chinchiro-player-hand" class="hand-status">-</div>
                    </div>

                    <div id="chinchiro-battle-result">
                        <div id="chinchiro-result-text" class="result-text"></div>
                    </div>
                </div>

                <div class="controls">
                    <div id="chinchiro-info-message" class="message-log">掛け金を選んで勝負開始だ</div>
                    <div class="bet-selector" id="chinchiro-bet-selector">
                        <!-- Bet buttons generated dynamically -->
                    </div>
                    <button id="chinchiro-roll-button" class="roll-btn" onclick="CasinoManager.handleMainButton()">勝負を挑む！</button>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this._renderBetButtons(); // Initial render of bet buttons
        this.updateChinchiroUI();
    },

    _renderBetButtons() {
        const container = document.getElementById('chinchiro-bet-selector');
        if (!container) return;

        const maxPage = this.BET_PAGES.length - 1;
        const currentAmounts = this.BET_PAGES[this.currentBetPage];

        let html = '';

        // Prev Button
        if (this.currentBetPage > 0) {
            html += `<button class="bet-btn nav-btn" onclick="CasinoManager.switchBetPage(-1)">◀</button>`;
        } else {
            html += `<button class="bet-btn nav-btn disabled" disabled>◀</button>`;
        }

        // Amount Buttons
        currentAmounts.forEach(amount => {
            const isActive = amount === this.currentBet ? 'active' : '';
            html += `<button class="bet-btn ${isActive}" onclick="CasinoManager.setBet(${amount})">${amount.toLocaleString()}</button>`;
        });

        // Next Button
        if (this.currentBetPage < maxPage) {
            html += `<button class="bet-btn nav-btn" onclick="CasinoManager.switchBetPage(1)">▶</button>`;
        } else {
            html += `<button class="bet-btn nav-btn disabled" disabled>▶</button>`;
        }

        container.innerHTML = html;
    },

    switchBetPage(dir) {
        const newPage = this.currentBetPage + dir;
        if (newPage >= 0 && newPage < this.BET_PAGES.length) {
            this.currentBetPage = newPage;
            this._renderBetButtons();
        }
    },

    updateChinchiroUI() {
        const moneyEl = document.getElementById('chinchiro-money-display');
        if (moneyEl) moneyEl.textContent = GameState.money.toLocaleString();

        this._renderBetButtons();
    },

    setBet(amount) {
        if (this.chinchiroState !== 'ready') return;
        this.currentBet = amount;
        this.updateChinchiroUI();
    },

    evalHand(dice) {
        dice.sort((a, b) => a - b);
        const [d1, d2, d3] = dice;

        if (d1 === 1 && d2 === 1 && d3 === 1) return { name: "ピンゾロ", score: 10000, mult: 5 };
        if (d1 === d2 && d2 === d3) return { name: `アラシ (${d1})`, score: d1 * 1000, mult: 3 };
        if (d1 === 4 && d2 === 5 && d3 === 6) return { name: "シゴロ", score: 500, mult: 2 };
        if (d1 === 1 && d2 === 2 && d3 === 3) return { name: "ヒフミ", score: -1, mult: -2 };

        if (d1 === d2) return { name: `${d3}の目`, score: d3, mult: 1 };
        if (d2 === d3) return { name: `${d1}の目`, score: d1, mult: 1 }; // d2==d3なのでd1が役

        return { name: "目なし", score: 0, mult: -1 };
    },

    rand6() { return Math.floor(Math.random() * 6) + 1; },
    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); },
    setMessage(msg) {
        const el = document.getElementById('chinchiro-info-message');
        if (el) el.textContent = msg;
    },

    resetHands() {
        if (document.getElementById('chinchiro-player-hand'))
            document.getElementById('chinchiro-player-hand').textContent = "-";
        if (document.getElementById('chinchiro-opponent-hand'))
            document.getElementById('chinchiro-opponent-hand').textContent = "-";

        // Reset displayed dice in panels
        document.querySelectorAll('#chinchiro-player-dice .dice, #chinchiro-opponent-dice .dice').forEach(d => d.setAttribute('data-value', '?'));
        // Reset active dice to default
        document.querySelectorAll('#chinchiro-active-dice .dice').forEach(d => d.setAttribute('data-value', '1'));
    },

    // Main button handler
    handleMainButton() {
        if (this.chinchiroState === 'ready') {
            this.startBattle();
        } else if (this.chinchiroState === 'waiting_for_roll' && this.rollResolver) {
            this.rollResolver();
            this.rollResolver = null;
        }
    },

    // Enable/Disable main button and change text
    setMainButtonState(enabled, text) {
        const btn = document.getElementById('chinchiro-roll-button');
        if (!btn) return;
        btn.disabled = !enabled;
        btn.textContent = text;
    },

    async startBattle() {
        if (this.chinchiroState !== 'ready') return;
        if (GameState.money < this.currentBet) {
            this.setMessage("金が足りねえな。どっかで稼いできな。");
            return;
        }

        this.chinchiroState = 'playing';
        this.setMainButtonState(false, "ゲーム開始...");

        const resultText = document.getElementById('chinchiro-result-text');
        if (resultText) resultText.className = 'result-text';

        this.resetHands();

        const playerFirst = Math.random() < 0.5;
        let playerResult, opponentResult;

        if (playerFirst) {
            this.setMessage("あんたが先攻だ。気合を入れな！");
            playerResult = await this.handleTurn('player');
            await this.sleep(1000);
            this.setMessage("次は俺の番だ。...");
            opponentResult = await this.handleTurn('opponent');
        } else {
            this.setMessage("俺が先攻で行くぜ。...");
            opponentResult = await this.handleTurn('opponent');
            await this.sleep(1000);
            this.setMessage("次はあんたの番だ。...");
            playerResult = await this.handleTurn('player');
        }

        await this.sleep(800);
        this.resolveBattle(playerResult, opponentResult);
    },

    async handleTurn(target) {
        // target: 'player' or 'opponent'
        const panel = document.getElementById(`chinchiro-${target}-panel`);
        if (panel) panel.classList.add('active-turn');

        let result;
        // Allow up to 3 attempts (1 initial + 2 rerolls) if result is Menashi
        for (let i = 0; i < 3; i++) {
            if (i > 0) {
                this.setMessage(target === 'player' ? "目なしだ... もう一回！" : "目なしだ... 再挑戦！");

                // If player is rerolling, wait a bit so they can see the message before enabling button
                if (target === 'player') await this.sleep(500);
                else await this.sleep(1000);
            }

            if (target === 'player') {
                // Wait for user input
                this.chinchiroState = 'waiting_for_roll';
                this.setMainButtonState(true, i === 0 ? "サイコロを振る！" : "もう一回振る！");

                await new Promise(resolve => {
                    this.rollResolver = resolve;
                });

                this.chinchiroState = 'playing';
                this.setMainButtonState(false, "Rolling...");
            } else {
                // Opponent rolls automatically
                this.setMainButtonState(false, "相手のターン...");
                // Initial delay for opponent
                if (i === 0) await this.sleep(500);
            }

            result = await this.rollDiceAnimation(target);

            // If satisfied (not menashi), stop
            if (result.name !== "目なし") {
                break;
            }
        }

        if (panel) panel.classList.remove('active-turn');
        return result;
    },

    async rollDiceAnimation(target) {
        const bowl = document.getElementById('chinchiro-bowl');
        const activeDice = document.getElementById('chinchiro-active-dice');
        // Visiblity is always visible now, but kept logic mostly same
        if (bowl) bowl.classList.add('shaking');

        let lastDice = [1, 1, 1];
        const duration = 1500;
        const interval = 80;
        let elapsed = 0;

        const rollTask = new Promise(resolve => {
            const timer = setInterval(() => {
                elapsed += interval;
                lastDice = [this.rand6(), this.rand6(), this.rand6()];

                // Animate the active dice in the bowl
                const d1 = document.getElementById('chinchiro-d1');
                const d2 = document.getElementById('chinchiro-d2');
                const d3 = document.getElementById('chinchiro-d3');

                if (d1) d1.setAttribute('data-value', lastDice[0]);
                if (d2) d2.setAttribute('data-value', lastDice[1]);
                if (d3) d3.setAttribute('data-value', lastDice[2]);

                if (elapsed >= duration) {
                    clearInterval(timer);
                    resolve(lastDice);
                }
            }, interval);
        });

        const resultDice = await rollTask;
        if (bowl) bowl.classList.remove('shaking');

        const hand = this.evalHand(resultDice);

        // Show result in target panel
        const diceContainer = document.getElementById(`chinchiro-${target}-dice`);
        if (diceContainer) {
            const diceEls = diceContainer.querySelectorAll('.dice');
            resultDice.forEach((val, i) => {
                if (diceEls[i]) diceEls[i].setAttribute('data-value', val);
            });
        }

        const handEl = document.getElementById(`chinchiro-${target}-hand`);
        if (handEl) handEl.textContent = hand.name;

        return hand;
    },

    resolveBattle(pHand, oHand) {
        const resultText = document.getElementById('chinchiro-result-text');
        let moneyChange = 0;

        // Calculate effective multiplier (Max of winner's mult or loser's penalty)
        let multiplier = Math.max(Math.abs(pHand.mult), Math.abs(oHand.mult));

        // High Roller Skill Check (Double Risk/Double Return)
        let isHighRoller = false;
        if (GameState.equippedSkills) {
            const skill = GameState.equippedSkills.find(id => id === 'casino_high_roller' || (GAME_DATA.SKILLS.find(s => s.id === id && s.effect.type === 'casino_high_roller')));
            if (skill) {
                isHighRoller = true;
                multiplier *= 2;
                console.log('🎰 High Roller Active: x2 Multiplier');
            }
        }

        if (pHand.score > oHand.score) {
            moneyChange = this.currentBet * multiplier;
            const profitStr = moneyChange.toLocaleString();
            if (resultText) {
                resultText.innerHTML = `勝利！ <span class="mult-display">(x${multiplier})</span><br><span style="font-size: 0.5em; color: #4ade80;">+${profitStr} G</span>`;
                resultText.className = "result-text win";
            }
            this.setMessage("ちっ...運がいい野郎だ。");
        } else if (pHand.score < oHand.score) {
            moneyChange = -this.currentBet * multiplier;
            const lossStr = Math.abs(moneyChange).toLocaleString();
            if (resultText) {
                resultText.innerHTML = `敗北... <span class="mult-display">(x${multiplier})</span><br><span style="font-size: 0.5em; color: #f87171;">-${lossStr} G</span>`;
                resultText.className = "result-text lose";
            }
            this.setMessage("へへっ、これが実力の差ってやつよ。");
        } else {
            if (resultText) {
                resultText.textContent = "引き分け";
                resultText.className = "result-text draw";
            }
            this.setMessage("痛み分けか。次で決めるぜ。");
        }

        if (moneyChange > 0) {
            GameState.casinoTotalWin += moneyChange;
            // ミッション進捗更新（コイン獲得）
            if (typeof MissionManager !== 'undefined') {
                MissionManager.checkMission('money_earned', { amount: moneyChange });
            }
        } else if (moneyChange < 0) {
            GameState.casinoTotalLoss += Math.abs(moneyChange);
        }

        GameState.money += moneyChange;
        this.updateChinchiroUI();
        UIManager.updateMoney(); // Global UI update
        SaveManager.saveGame(); // Auto-save

        setTimeout(() => {
            this.chinchiroState = 'ready';
            this.setMainButtonState(true, "勝負を挑む！");
        }, 1500);
    }
};

// グローバル公開
if (typeof window !== 'undefined') {
    window.CasinoManager = CasinoManager;
}
