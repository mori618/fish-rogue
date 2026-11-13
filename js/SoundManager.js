// 効果音
// 音源ファイルは使わず、Web Audio でその場で合成する（素材の用意やライセンス確認が不要）。
// 後から録音素材に差し替えたい音は、sounds の該当関数を AudioBuffer の再生に置き換えればよい。
//
// 使い方: SoundManager.play('hit') / SoundManager.play('coin', { combo: 3 })
// ブラウザは最初のタップまで音を出せないため、ボタンを押したときに unlock() を呼ぶ。

const SoundManager = {
    STORAGE_KEY: 'fish_rogue_sound',
    VOLUME: 0.5,

    ctx: null,
    master: null,
    noiseBuffer: null,
    ambient: null,
    enabled: true,
    wantAmbient: false,

    // ========================================
    // 準備
    // ========================================
    init() {
        try {
            this.enabled = localStorage.getItem(this.STORAGE_KEY) !== 'off';
        } catch (e) {
            this.enabled = true;
        }
    },

    // ユーザー操作の中で呼ぶ。AudioContext を作り、止まっていれば再開する
    unlock() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!this.ctx) {
            this.ctx = new AudioCtx();
            this.master = this.ctx.createGain();
            this.master.gain.value = this.enabled ? this.VOLUME : 0;
            this.master.connect(this.ctx.destination);

            // しぶき・風切り・波に使うホワイトノイズ（1秒分を使い回す）
            const length = this.ctx.sampleRate;
            this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
            const data = this.noiseBuffer.getChannelData(0);
            for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (this.wantAmbient) this.startAmbient();
    },

    setEnabled(on) {
        this.enabled = on;
        try {
            localStorage.setItem(this.STORAGE_KEY, on ? 'on' : 'off');
        } catch (e) { /* 保存できなくても続行 */ }
        if (this.master) {
            this.master.gain.setTargetAtTime(on ? this.VOLUME : 0, this.ctx.currentTime, 0.05);
        }
    },

    toggle() {
        this.setEnabled(!this.enabled);
        if (this.enabled) this.play('select');
        return this.enabled;
    },

    play(name, options = {}) {
        if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
        const sound = this.sounds[name];
        if (sound) {
            try {
                sound.call(this, options);
            } catch (e) {
                console.warn('効果音の再生に失敗しました:', name, e);
            }
        }
    },

    // ========================================
    // 音の部品
    // ========================================
    // 単音。slideTo を指定すると音の高さが滑る
    _tone(freq, duration, { type = 'sine', gain = 0.25, attack = 0.005, delay = 0, slideTo = null } = {}) {
        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const amp = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime(gain, t + attack);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        osc.connect(amp).connect(this.master);
        osc.start(t);
        osc.stop(t + duration + 0.05);
    },

    // ノイズ。フィルターで音色を作る（freqTo で抜ける帯域が動く）
    _noise(duration, { gain = 0.25, filter = 'bandpass', freq = 1000, freqTo = null, q = 1, attack = 0.005, delay = 0 } = {}) {
        const t = this.ctx.currentTime + delay;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const flt = this.ctx.createBiquadFilter();
        flt.type = filter;
        flt.frequency.setValueAtTime(freq, t);
        if (freqTo) flt.frequency.exponentialRampToValueAtTime(freqTo, t + duration);
        flt.Q.value = q;
        const amp = this.ctx.createGain();
        amp.gain.setValueAtTime(0.0001, t);
        amp.gain.exponentialRampToValueAtTime(gain, t + attack);
        amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        src.connect(flt).connect(amp).connect(this.master);
        src.start(t, Math.random() * 0.5);
        src.stop(t + duration + 0.05);
    },

    // 和音・アルペジオ（semitones は基音からの半音数、step は音の間隔）
    _arpeggio(base, semitones, { step = 0.08, duration = 0.3, type = 'triangle', gain = 0.18, delay = 0 } = {}) {
        semitones.forEach((st, i) => {
            this._tone(base * Math.pow(2, st / 12), duration, { type, gain, delay: delay + i * step });
        });
    },

    // ========================================
    // 波の環境音（釣り画面にいる間だけ小さく流す）
    // ========================================
    startAmbient() {
        this.wantAmbient = true;
        if (!this.ctx || this.ambient) return;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.loop = true;
        const flt = this.ctx.createBiquadFilter();
        flt.type = 'lowpass';
        flt.frequency.value = 420;
        const amp = this.ctx.createGain();
        amp.gain.value = 0.035;

        // 寄せては返す波: ゆっくりした揺れで音量を上下させる
        const lfo = this.ctx.createOscillator();
        const depth = this.ctx.createGain();
        lfo.frequency.value = 0.12;
        depth.gain.value = 0.025;
        lfo.connect(depth).connect(amp.gain);

        src.connect(flt).connect(amp).connect(this.master);
        src.start();
        lfo.start();
        this.ambient = { src, lfo };
    },

    stopAmbient() {
        this.wantAmbient = false;
        if (!this.ambient) return;
        this.ambient.src.stop();
        this.ambient.lfo.stop();
        this.ambient = null;
    },

    // ========================================
    // 各場面の音
    // ========================================
    RANK_STEPS: { D: 0, C: 1, B: 2, A: 3, S: 4, SS: 5 },

    sounds: {
        // 竿が空を切る「ヒュッ」
        cast() {
            this._noise(0.22, { freq: 600, freqTo: 3200, q: 1.5, gain: 0.22, attack: 0.04 });
        },

        // 小さな「ポチャ」
        land() {
            this._noise(0.12, { freq: 900, freqTo: 300, q: 2, gain: 0.25 });
            this._tone(520, 0.12, { slideTo: 180, gain: 0.18 });
        },

        // ウキが沈む「トプッ」。大きい魚ほど低い
        nibble({ scale = 1 }) {
            this._tone(520 / scale, 0.1, { slideTo: 260 / scale, gain: 0.22 });
        },

        // 探り竿の鈴
        bell() {
            this._tone(2100, 0.35, { gain: 0.12 });
            this._tone(3150, 0.25, { gain: 0.06, delay: 0.01 });
            this._tone(520, 0.08, { slideTo: 260, gain: 0.12 });
        },

        // 強い「バシャッ」と鋭い合図音
        hit() {
            this._noise(0.35, { freq: 1400, freqTo: 400, q: 0.8, gain: 0.4 });
            this._tone(1760, 0.16, { type: 'square', gain: 0.12 });
        },

        // リールの「カリッ」
        reel() {
            this._noise(0.025, { filter: 'highpass', freq: 3000, gain: 0.12 });
        },

        // ゲージを止めた音: 赤は澄んだ高い音、緑は中くらい、白は鈍い音
        stop({ zone = 'white' }) {
            if (zone === 'red') {
                this._tone(1568, 0.25, { type: 'triangle', gain: 0.22 });
                this._tone(2093, 0.3, { type: 'triangle', gain: 0.16, delay: 0.06 });
            } else if (zone === 'green') {
                this._tone(880, 0.22, { type: 'triangle', gain: 0.2 });
            } else {
                this._tone(220, 0.2, { type: 'square', gain: 0.1 });
            }
        },

        // 水から抜ける音と、上がる和音。ランクが高いほど音が多い
        catch({ rarity = 'D', treasure = false }) {
            this._noise(0.3, { freq: 700, freqTo: 2400, q: 1, gain: 0.3 });
            const steps = SoundManager.RANK_STEPS[rarity] || 0;
            const notes = treasure ? [0, 4, 7, 12, 16] : [0, 4, 7, 12, 16, 19, 24].slice(0, 3 + Math.min(steps, 4));
            this._arpeggio(523, notes, { step: 0.07, delay: 0.1 });
        },

        // 糸がゆるむ「フッ」と下がる2音
        escape() {
            this._noise(0.25, { freq: 1500, freqTo: 400, q: 1, gain: 0.15 });
            this._tone(392, 0.2, { type: 'triangle', gain: 0.16, delay: 0.05 });
            this._tone(311, 0.3, { type: 'triangle', gain: 0.16, delay: 0.2 });
        },

        // コインの「チリン」。コンボが続くほど半音ずつ高くなる
        coin({ combo = 0 }) {
            const base = 1318 * Math.pow(2, Math.min(combo, 12) / 12);
            this._tone(base, 0.12, { type: 'square', gain: 0.07 });
            this._tone(base * 1.5, 0.25, { type: 'square', gain: 0.07, delay: 0.07 });
        },

        // 目標達成
        goal() {
            this._arpeggio(659, [0, 4, 7, 12], { step: 0.09, duration: 0.35, gain: 0.2 });
        },

        // 釣り宿に着いたときのファンファーレ（銀・金で豪華に）
        fanfare({ grade = 'bronze' }) {
            const notes = { bronze: [0, 4, 7], silver: [0, 4, 7, 12], gold: [0, 4, 7, 12, 16, 19, 24] }[grade] || [0, 4, 7];
            this._arpeggio(523, notes, { step: 0.1, duration: 0.45, gain: 0.18 });
            if (grade === 'gold') this._tone(1046, 0.9, { type: 'triangle', gain: 0.12, delay: notes.length * 0.1 });
        },

        // 購入・装備の「コトッ」
        buy() {
            this._tone(330, 0.08, { type: 'triangle', gain: 0.3, slideTo: 220 });
            this._noise(0.05, { freq: 2000, q: 3, gain: 0.08 });
        },

        // お金が足りないなど、できなかった操作
        deny() {
            this._tone(180, 0.15, { type: 'square', gain: 0.08 });
        },

        // カードを選んだ
        select() {
            this._tone(880, 0.08, { type: 'triangle', gain: 0.16 });
            this._tone(1318, 0.12, { type: 'triangle', gain: 0.12, delay: 0.05 });
        },

        // ゲームオーバー: 低く沈む和音
        gameover() {
            [0, 3, 7].forEach((st, i) => {
                this._tone(262 * Math.pow(2, st / 12), 1.2, { type: 'triangle', gain: 0.12, delay: i * 0.12, slideTo: 131 * Math.pow(2, st / 12) });
            });
        }
    }
};

SoundManager.init();

// グローバルに公開
if (typeof window !== 'undefined') {
    window.SoundManager = SoundManager;
}
