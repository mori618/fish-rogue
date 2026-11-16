// テストプレイの記録
// エラー・警告・画面と釣りの状態の変化・タップを時刻つきで集める。
// Claude 上の非公開ページ（artifact）で動いているときは、その記録を artifact のデータベースへ送り、
// Claude があとから読めるようにする。GitHub Pages などふつうの公開ページでは何も送らない。

const DebugLog = {
    entries: [],        // まだ送っていない記録
    sent: 0,            // このセッションで送った記録の数
    chunk: 0,           // 送った塊の番号
    session: '',        // このセッションの名前（開いた時刻）
    db: null,
    startedAt: 0,
    lastState: '',

    start() {
        this.startedAt = Date.now();
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        this.session = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

        window.addEventListener('error', e => {
            const file = (e.filename || '').split('/').pop();
            this.add('error', `${e.message} @${file}:${e.lineno}:${e.colno}`, e.error && e.error.stack);
        });
        window.addEventListener('unhandledrejection', e => this.add('reject', String(e.reason && (e.reason.stack || e.reason))));

        // console.error / console.warn も拾う
        ['error', 'warn'].forEach(level => {
            const original = console[level].bind(console);
            console[level] = (...args) => {
                try { this.add(level, args.map(a => (a && a.stack) || (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')); } catch (e) { /* 記録の失敗は無視 */ }
                original(...args);
            };
        });

        // タップ: どこを押したか（要素）と、そのときの釣りの状態
        document.addEventListener('pointerdown', e => {
            const el = e.target.closest('button, [id], [class]') || e.target;
            const name = el.id ? `#${el.id}` : (typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : el.tagName);
            this.add('tap', `${name} (${Math.round(e.clientX)},${Math.round(e.clientY)}) state=${this._fishingState()}`);
        }, true);

        // 状態の変化を0.2秒ごとに見る
        setInterval(() => this._pollState(), 200);

        this.add('open', `${navigator.userAgent} ${innerWidth}x${innerHeight}`);
        this._connect();
    },

    add(kind, text, stack) {
        const entry = { t: Math.round((Date.now() - this.startedAt) / 100) / 10, k: kind, m: String(text).slice(0, 600) };
        if (stack) entry.s = String(stack).slice(0, 1200);
        this.entries.push(entry);
        if (this.entries.length > 1000) this.entries.shift();
    },

    _fishingState() {
        try { return typeof FishingGame !== 'undefined' ? FishingGame.state : '-'; } catch (e) { return '?'; }
    },

    _pollState() {
        try {
            if (typeof GameState === 'undefined' || typeof UIManager === 'undefined') return;
            const r = GameState.run;
            const parts = [
                UIManager.currentScreen,
                this._fishingState(),
                r ? `${r.phase} R${r.round}` : 'no-run',
                r ? `${r.earned}/${r.target}${r.reached ? ' 達成' : ''}` : '',
                r && r.nushi ? `ヌシ${r.nushi.caught ? '済' : r.nushi.won || 0}` : '',
                `餌${GameState.getTotalBaitCount ? GameState.getTotalBaitCount() : '?'}`,
                `${GameState.money}G`
            ];
            const state = parts.filter(Boolean).join(' | ');
            if (state !== this.lastState) {
                this.lastState = state;
                this.add('state', state);
            }
        } catch (e) {
            this.add('pollerr', e.message);
        }
    },

    // artifact のデータベースにつながれば、2秒ごとにまとめて送る
    async _connect() {
        if (!window.claude || typeof window.claude.use !== 'function') return;
        try {
            this.db = await window.claude.use('db');
        } catch (e) {
            this.db = null;
        }
        if (!this.db) return;
        this.add('db', 'connected');
        setInterval(() => this._flush(), 2000);
        // 閉じる・隠れるときにも送る
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') this._flush();
        });
    },

    async _flush() {
        if (!this.db || this.flushing || this.entries.length === 0) return;
        this.flushing = true;
        const batch = this.entries.splice(0, 200);
        try {
            const id = `${this.session}-${String(this.chunk).padStart(4, '0')}`;
            await this.db.collection('logs').doc(id).set({
                session: this.session,
                chunk: this.chunk,
                at: new Date().toISOString(),
                entries: batch
            });
            this.chunk++;
            this.sent += batch.length;
        } catch (e) {
            // 送れなかった分は戻して次に回す
            this.entries.unshift(...batch);
        } finally {
            this.flushing = false;
        }
    }
};

if (typeof window !== 'undefined') {
    window.DebugLog = DebugLog;
    DebugLog.start();
}
