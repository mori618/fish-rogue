// ロッドシーン: 竿・糸・ウキ・水面の演出を1枚のSVGに描く
//
// ゲーム側は setState() で状態名を渡すだけ。各状態は「竿の角度・しなり・糸のたるみ」の
// 目標値を決め、実際の値はバネで追いかける。そのため状態が変わっても前の姿勢から
// なめらかにつながり、合わせた瞬間の行き過ぎや、逃げられたときの跳ね返りが自然に出る。
// 釣りの判定や時間には一切関与しない（見た目だけ）。

const RodAnimator = {
    // ========================================
    // 調整値
    // ========================================
    CONFIG: {
        segments: 16,        // 竿の曲線を何分割して描くか
        bendMax: 0.95,       // しなり量1のとき、竿先がどれだけ曲がるか（ラジアン）
        hangLength: 46,      // 構え中、竿先からウキまでの糸の長さ(px)
        waterClip: 3,        // ウキが水面からこれ以上沈んだ部分は隠す(px)

        // 状態ごとの目標値: angle = 竿の傾き（+が水面側）、bend = しなり、slack = 糸のたるみ、dip = ウキの沈み(px)
        poses: {
            idle:    { angle: 0.14, bend: 0.04, slack: 0.0, dip: 0 },
            windup:  { angle: -0.20, bend: -0.18, slack: 0.0, dip: 0 },
            swing:   { angle: 0.42, bend: 0.22, slack: 0.3, dip: 0 },
            waiting: { angle: 0.22, bend: 0.06, slack: 1.0, dip: 0 },
            nibble:  { angle: 0.22, bend: 0.08, slack: 0.8, dip: 0 },
            hit:     { angle: 0.28, bend: 0.55, slack: 0.0, dip: 42 },
            strike:  { angle: 0.10, bend: 0.50, slack: 0.0, dip: 42 },
            battle:  { angle: 0.26, bend: 0.45, slack: 0.0, dip: 42 },
            success: { angle: -0.10, bend: 0.20, slack: 0.0, dip: 0 },
            fail:    { angle: 0.18, bend: 0.02, slack: 1.3, dip: 0 }
        },

        // バネ（k = 硬さ、c = 減衰）
        springs: {
            angle: { k: 120, c: 15 },
            bend: { k: 170, c: 11 },
            slack: { k: 60, c: 12 },
            dip: { k: 260, c: 16 },
            sweep: { k: 40, c: 9 },
            bobX: { k: 55, c: 9 },
            bobY: { k: 55, c: 9 }
        },

        cast: { windup: 0.15, release: 0.24, flight: 0.42 },   // キャストの時間配分(秒)

        // バトル: 力関係ごとのしなりの強さと竿先の震え
        battle: {
            easy: { strength: 0.55, tremble: 0.004 },
            even: { strength: 0.75, tremble: 0.010 },
            hard: { strength: 0.90, tremble: 0.018 },
            reckless: { strength: 1.00, tremble: 0.028 }
        },

        // 魚のランクごとの魚影の大きさと色
        fishScale: { D: 0.7, C: 0.9, B: 1.15, A: 1.45, S: 1.8, SS: 2.2 },
        fishColor: { D: '#bcaaa4', C: '#22c55e', B: '#3b82f6', A: '#a855f7', S: '#f59e0b', SS: '#ef4444' },

        feverColor: { sun: '#ffd54f', moon: '#bfdbfe' }
    },

    // ========================================
    // 内部状態
    // ========================================
    svg: null,
    els: null,
    running: false,
    rafId: null,
    lastTime: 0,
    time: 0,

    state: 'idle',
    stateTime: 0,
    options: {},
    released: false,     // キャスト中、ウキを放したか
    gauge: 50,           // ゲージの針の位置(0-100)
    reducedMotion: false,

    layout: null,        // 画面サイズから決まる座標
    values: null,        // バネで動く値 { angle: {x, v, target}, ... }
    rod: null,           // そのフレームの竿の点列と竿先
    bobber: { mode: 'hang', x: 0, y: 0, flight: null },
    ripples: [],
    drops: [],
    fish: null,          // 釣り上げ時に跳ねる魚
    shadow: { alpha: 0, target: 0, scale: 1 },
    bangTime: -10,       // 「！」を出した時刻
    reelAngle: 0,
    nextIdleRipple: 0,

    // ========================================
    // 初期化
    // ========================================
    init() {
        const svg = document.getElementById('rod-scene');
        if (!svg) return false;
        if (this.svg === svg && this.els) return true;

        this.svg = svg;
        svg.innerHTML = `
            <defs>
                <clipPath id="rs-water-clip" clipPathUnits="userSpaceOnUse"><rect id="rs-clip-rect" x="-2000" y="-2000" width="6000" height="2000"/></clipPath>
            </defs>
            <ellipse id="rs-shadow" fill="#0b2545" opacity="0"/>
            <g id="rs-ripples">${'<ellipse fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="2" opacity="0"/>'.repeat(6)}</g>
            <path id="rs-line" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.3" stroke-linecap="round"/>
            <g id="rs-bobber-clip">
                <g id="rs-bobber">
                    <line x1="0" y1="-22" x2="0" y2="-9" stroke="#3e2723" stroke-width="2.5" stroke-linecap="round"/>
                    <circle id="rs-bob-body" r="10" stroke="#3e2723" stroke-width="1.5"/>
                    <path d="M-10,0 A10,10 0 0 0 10,0 Z" fill="#fff" stroke="#3e2723" stroke-width="1.5"/>
                </g>
            </g>
            <g id="rs-fish" opacity="0">
                <path id="rs-fish-body" stroke="#3e2723" stroke-width="1.5" stroke-linejoin="round"/>
            </g>
            <g id="rs-drops">${'<circle r="3" fill="rgba(255,255,255,0.9)" opacity="0"/>'.repeat(14)}</g>
            <text id="rs-bang" text-anchor="middle" font-size="56" font-weight="900" fill="#ffd700"
                stroke="#b91c1c" stroke-width="3" paint-order="stroke" opacity="0">！</text>
            <g id="rs-rod">
                <path id="rs-shaft" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>
                <path id="rs-grip" fill="none" stroke="#3e2723" stroke-width="17" stroke-linecap="round"/>
                <path id="rs-wraps" fill="none" stroke="#ffd54f" stroke-width="14"/>
                <g id="rs-guides">${'<circle r="4" fill="none" stroke="#ffd54f" stroke-width="2"/>'.repeat(4)}</g>
                <circle id="rs-reel" r="16" fill="#d4a017" stroke="#5d4037" stroke-width="3"/>
                <line id="rs-reel-arm" stroke="#4e342e" stroke-width="3" stroke-linecap="round"/>
                <circle id="rs-reel-knob" r="4" fill="#4e342e"/>
            </g>
        `;

        const q = id => svg.querySelector(`#${id}`);
        this.els = {
            clipRect: q('rs-clip-rect'), shadow: q('rs-shadow'),
            ripples: [...q('rs-ripples').children], line: q('rs-line'),
            bobberClip: q('rs-bobber-clip'), bobber: q('rs-bobber'), bobBody: q('rs-bob-body'),
            fish: q('rs-fish'), fishBody: q('rs-fish-body'),
            drops: [...q('rs-drops').children], bang: q('rs-bang'),
            shaft: q('rs-shaft'), grip: q('rs-grip'), wraps: q('rs-wraps'),
            guides: [...q('rs-guides').children],
            reel: q('rs-reel'), reelArm: q('rs-reel-arm'), reelKnob: q('rs-reel-knob')
        };

        this.values = {};
        Object.keys(this.CONFIG.springs).forEach(name => {
            this.values[name] = { x: 0, v: 0, target: 0 };
        });

        const media = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
        this.reducedMotion = !!(media && media.matches);

        window.addEventListener('resize', () => this.resize());
        this.resize();
        this._applyPose('idle', true);
        this.refreshSkin();
        return true;
    },

    // ========================================
    // 描画ループの開始・停止（釣り画面にいる間だけ動かす）
    // ========================================
    start() {
        if (!this.init()) return;
        this.resize();
        this.refreshSkin();
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        const loop = (now) => {
            if (!this.running) return;
            const dt = Math.min(0.033, Math.max(0.001, (now - this.lastTime) / 1000));
            this.lastTime = now;
            this._update(dt);
            this._draw();
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    },

    stop() {
        this.running = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;
    },

    // 画面サイズから、グリップ・着水点・竿の長さを決める
    resize() {
        if (!this.svg) return;
        const rect = this.svg.getBoundingClientRect();
        const w = rect.width || window.innerWidth;
        const h = rect.height || window.innerHeight;
        if (w === 0 || h === 0) return;

        // グリップは下部HUDのすぐ上に置く（少しだけHUDの裏に入り、手で持っているように見せる）
        const hud = document.querySelector('.rg-hud-bottom');
        const hudRect = hud ? hud.getBoundingClientRect() : null;
        const hudTop = hudRect && hudRect.top > 0 ? hudRect.top - rect.top : h * 0.82;
        const centerX = w / 2;
        const gripX = centerX + Math.min(w * 0.36, 260);

        // 横長の画面ではグリップがHUDの外に出るので、画面の下端から竿を伸ばす
        const besideHud = !!hudRect && gripX > hudRect.right - rect.left;

        this.layout = {
            width: w,
            height: h,
            grip: { x: gripX, y: besideHud ? h + 12 : hudTop + 26 },
            water: { x: centerX - Math.min(w * 0.24, 190), y: h * 0.47 },
            length: besideHud ? Math.min(620, h * 0.68) : Math.max(230, Math.min(460, h * 0.5))
        };

        this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        this.els.clipRect.setAttribute('height', 2000 + this.layout.water.y + this.CONFIG.waterClip);

        // 構え中にサイズが変わったら、ウキを竿先の下に置き直す
        if (this.bobber.mode === 'hang') {
            this.rod = this._computeRod();
            this.values.bobX.x = this.rod.tip.x;
            this.values.bobY.x = this.rod.tip.y + this.CONFIG.hangLength;
        }
    },

    // 竿とウキの色、星の数、フィーバー中の糸の色を反映する
    refreshSkin() {
        if (!this.els || typeof GameState === 'undefined') return;
        const skin = GameState.getCurrentSkin();
        this.els.shaft.setAttribute('fill', skin.rodColor);
        this.els.bobBody.setAttribute('fill', skin.bobberColor);
        this.stars = GameState.rodStars || 0;

        const fever = GameState.fever;
        const glow = fever && fever.isActive ? this.CONFIG.feverColor[fever.type] : null;
        this.els.line.setAttribute('stroke', glow || 'rgba(255,255,255,0.8)');
        this.els.line.setAttribute('stroke-width', glow ? 2 : 1.3);
    },

    // ========================================
    // 状態の切り替え
    //   options.rarity  魚のランク（魚影・沈みの深さ・跳ねる魚の大きさ）
    //   options.matchup 力関係 'easy' | 'even' | 'hard' | 'reckless'（バトル中のしなり）
    //   options.treasure 宝箱かどうか（釣り上げ時の形）
    // ========================================
    setState(name, options = {}) {
        if (!this.els) return;
        const previous = this.state;
        this.state = name;
        this.stateTime = 0;
        this.options = { ...this.options, ...options };
        const v = this.values;
        const water = this.layout.water;

        switch (name) {
            case 'idle':
                this._applyPose('idle');
                this.bobber.mode = 'hang';
                this.shadow.target = 0;
                this.options = {};
                this.refreshSkin();
                break;

            case 'casting':
                this._applyPose('windup');
                this.released = false;
                this.bobber.mode = 'hang';
                break;

            case 'waiting':
                this._applyPose('waiting');
                this.shadow.target = 0;
                this.nextIdleRipple = this.time + 1.5;
                // キャストを経ずに待ちへ来た場合（再開時など）はウキを水面に置く
                if (this.bobber.mode === 'hang' && previous !== 'casting') this._land(false);
                break;

            case 'nibble':
                this._applyPose('nibble');
                this.shadow.target = 0.3;
                break;

            case 'hit':
                this._applyPose('hit');
                this._ensureFloating();
                v.bend.v += 3;
                this.shadow.target = 0.45;
                this.bangTime = this.time;
                this._splash(water.x, water.y, 10, 1.2);
                this._ripple(water.x, water.y, 46);
                break;

            case 'strike':
                this._applyPose('strike');
                v.angle.v -= 3.5;     // 手前にあおる。バネで行き過ぎてから戻る
                v.bend.v += 4;
                this._splash(water.x + v.sweep.x, water.y, 5, 0.8);
                break;

            case 'battle':
                this._applyPose('battle');
                this._ensureFloating();
                this.shadow.target = 0.45;
                break;

            case 'success':
                this._applyPose('success');
                v.angle.v -= 4;
                this._startFishJump();
                this.bobber.mode = 'hang';   // ウキは竿先へ巻き取られる
                this.shadow.target = 0;
                break;

            case 'fail':
                this._applyPose('fail');
                // 負荷が抜けて竿が後ろへ跳ね返り、ウキだけが浮き上がる
                if (v.bend.x > 0.2) {
                    v.bend.v -= 4;
                    v.angle.v -= 1.5;
                }
                v.dip.v -= 120;
                this._ripple(water.x + v.sweep.x, water.y, 22);
                this.shadow.target = 0;
                break;
        }
    },

    // アタリ1回分: ウキが沈んで戻り、竿先がピクッと動く。scale が大きいほど深く沈む
    nibble(scale = 1) {
        if (!this.els) return;
        const v = this.values;
        this._ensureFloating();
        v.dip.v += 150 * Math.min(scale, 2.5);
        v.bend.v += 1.2 * scale;
        v.slack.v -= 3;
        this.shadow.scale = scale;
        this._ripple(this.layout.water.x, this.layout.water.y, 20 + 10 * scale);
    },

    // ゲージの針の位置（0〜100）。バトル中の竿のしなりに使う
    setGauge(position) {
        this.gauge = position;
    },

    // ========================================
    // 内部: 姿勢・ウキ・演出
    // ========================================
    _applyPose(poseName, snap = false) {
        const pose = this.CONFIG.poses[poseName];
        const v = this.values;
        ['angle', 'bend', 'slack', 'dip'].forEach(key => {
            v[key].target = pose[key];
            if (snap) {
                v[key].x = pose[key];
                v[key].v = 0;
            }
        });
        v.sweep.target = 0;
    },

    // ウキを水面に置く（splash = 着水の演出を出すか）
    _land(splash) {
        const water = this.layout.water;
        this.bobber.mode = 'float';
        this.bobber.flight = null;
        this.values.dip.x = splash ? 10 : 0;
        this.values.dip.v = 0;
        if (splash) {
            this._ripple(water.x, water.y, 30);
            this._splash(water.x, water.y, 5, 0.7);
        }
    },

    // 飛んでいる途中や構え中にヒット・バトルへ進んだら、ウキを水面にあるものとして扱う
    _ensureFloating() {
        if (this.bobber.mode !== 'float') this._land(false);
    },

    _ripple(x, y, size) {
        if (this.ripples.length >= this.els.ripples.length) this.ripples.shift();
        this.ripples.push({ x, y, size, age: 0, life: 1.1 });
    },

    _splash(x, y, count, power) {
        for (let i = 0; i < count; i++) {
            if (this.drops.length >= this.els.drops.length) this.drops.shift();
            const angle = -Math.PI / 2 + (i / Math.max(1, count - 1) - 0.5) * 1.6;
            const speed = (150 + (i % 3) * 60) * power;
            this.drops.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, age: 0 });
        }
    },

    // 釣り上げた魚（または宝箱）が水面から跳ね、画面上部へ飛ぶ
    _startFishJump() {
        const { water, width, height } = this.layout;
        const rarity = this.options.rarity || 'D';
        const scale = this.CONFIG.fishScale[rarity] || 1;
        const startX = water.x + this.values.sweep.x;

        this.fish = {
            age: 0, life: 0.55, scale,
            from: { x: startX, y: water.y },
            to: { x: width / 2, y: height * 0.2 },
            arc: height * 0.12
        };
        this.els.fishBody.setAttribute('d', this.options.treasure
            ? 'M-13,-10 H13 V10 H-13 Z M-13,-2 H13'
            : 'M16,0 C10,-10 -8,-10 -14,0 C-8,10 10,10 16,0 Z M-13,0 L-25,-9 L-22,0 L-25,9 Z');
        this.els.fishBody.setAttribute('fill', this.options.treasure ? '#d4a017' : (this.CONFIG.fishColor[rarity] || '#fff'));
        this._splash(startX, water.y, 9, 1.1);
        this._ripple(startX, water.y, 40);
    },

    // 竿の中心線を計算する。グリップから竿先へ進むにつれて、しなりの分だけ向きが変わる
    _computeRod() {
        const { grip, length } = this.layout;
        const n = this.CONFIG.segments;
        const angle = this.values.angle.x;
        const bend = this.values.bend.x * this.CONFIG.bendMax;
        const step = length / n;
        const points = [{ x: grip.x, y: grip.y, dir: angle }];
        let x = grip.x;
        let y = grip.y;
        for (let i = 1; i <= n; i++) {
            const dir = angle + bend * Math.pow(i / n, 1.6);
            x -= Math.sin(dir) * step;
            y -= Math.cos(dir) * step;
            points.push({ x, y, dir });
        }
        return { points, tip: points[n] };
    },

    // 中心線上の位置 s（0 = グリップ、1 = 竿先）の座標と向き
    _pointAt(s) {
        const points = this.rod.points;
        const f = Math.max(0, Math.min(1, s)) * (points.length - 1);
        const i = Math.min(points.length - 2, Math.floor(f));
        const t = f - i;
        const a = points[i];
        const b = points[i + 1];
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dir: a.dir + (b.dir - a.dir) * t };
    },

    // ========================================
    // 1フレーム分の更新
    // ========================================
    _update(dt) {
        this.time += dt;
        this.stateTime += dt;
        const v = this.values;
        const cfg = this.CONFIG;
        const { water, width } = this.layout;
        const calm = this.reducedMotion ? 0 : 1;   // 「視差効果を減らす」設定では揺れを止める

        // --- 状態ごとの目標値の時間変化 ---
        if (this.state === 'casting') {
            if (this.stateTime >= cfg.cast.windup && v.angle.target !== cfg.poses.swing.angle) {
                this._applyPose('swing');
            }
            if (this.stateTime >= cfg.cast.release && !this.released) this._release();
        } else if (this.state === 'waiting') {
            v.bend.target = cfg.poses.waiting.bend + 0.015 * Math.sin(this.time * 1.5) * calm;
            if (this.time >= this.nextIdleRipple && this.bobber.mode === 'float') {
                this._ripple(water.x, water.y, 18);
                this.nextIdleRipple = this.time + 2.6;
            }
        } else if (this.state === 'battle') {
            // 針が中央（赤ゾーン）に近いほど大きくしなる。格上ほど強く、竿先が震える
            const level = cfg.battle[this.options.matchup] || cfg.battle.even;
            const closeness = 1 - Math.abs(this.gauge - 50) / 50;
            const tremble = Math.sin(this.time * 47) * level.tremble * 6 * calm;
            v.bend.target = 0.28 + 0.55 * closeness * level.strength + tremble;
            v.angle.target = cfg.poses.battle.angle + 0.08 * closeness * level.strength;
            // 魚が左右に走り、糸の先が水面を動く
            v.sweep.target = (Math.sin(this.time * 2.3) * 0.07 + (this.gauge - 50) / 50 * 0.05) * width * (0.4 + 0.6 * calm);
            this.reelAngle += dt * (4 + 10 * closeness);
            if (Math.floor(this.time * 4) !== Math.floor((this.time - dt) * 4)) {
                this._ripple(water.x + v.sweep.x, water.y, 14);
            }
        }

        // --- バネ ---
        Object.keys(cfg.springs).forEach(name => {
            const s = v[name];
            const { k, c } = cfg.springs[name];
            s.v += (-k * (s.x - s.target) - c * s.v) * dt;
            s.x += s.v * dt;
        });
        v.dip.x = Math.max(-10, v.dip.x);
        v.bend.x = Math.max(-0.3, Math.min(1.0, v.bend.x));
        v.slack.x = Math.max(0, v.slack.x);

        this.rod = this._computeRod();
        const tip = this.rod.tip;

        // --- ウキ ---
        const bob = this.bobber;
        if (bob.mode === 'hang') {
            v.bobX.target = tip.x + Math.sin(this.time * 1.3) * 4 * calm;
            v.bobY.target = tip.y + cfg.hangLength;
            bob.x = v.bobX.x;
            bob.y = v.bobY.x;
        } else if (bob.mode === 'fly') {
            const f = bob.flight;
            f.age += dt;
            const u = Math.min(1, f.age / f.life);
            bob.x = f.from.x + (water.x - f.from.x) * u;
            bob.y = f.from.y + (water.y - f.from.y) * u - f.arc * 4 * u * (1 - u);
            if (u >= 1) this._land(true);
        } else {
            bob.x = water.x + v.sweep.x + Math.sin(this.time * 0.7) * 2 * calm;
            bob.y = water.y + Math.sin(this.time * 2.1) * 2.5 * calm + v.dip.x;
        }
        if (bob.mode !== 'hang') {
            // 構えに戻ったとき、今の位置から竿先へ巻き取られるようにバネの現在値を合わせておく
            v.bobX.x = bob.x;
            v.bobY.x = bob.y;
            v.bobX.v = 0;
            v.bobY.v = 0;
        }

        // --- 演出の寿命 ---
        this.ripples.forEach(r => r.age += dt);
        this.ripples = this.ripples.filter(r => r.age < r.life);
        this.drops.forEach(d => {
            d.age += dt;
            d.vy += 900 * dt;
            d.x += d.vx * dt;
            d.y += d.vy * dt;
        });
        this.drops = this.drops.filter(d => d.age < 0.7 && !(d.vy > 0 && d.y > water.y + 4));
        if (this.fish) {
            this.fish.age += dt;
            if (this.fish.age >= this.fish.life) this.fish = null;
        }
        this.shadow.alpha += (this.shadow.target - this.shadow.alpha) * Math.min(1, dt * 6);
    },

    // キャスト: 竿先からウキを放ち、弧を描いて着水点へ飛ばす
    _release() {
        this.released = true;
        const tip = this.rod ? this.rod.tip : this.layout.grip;
        this.bobber.mode = 'fly';
        this.bobber.flight = {
            age: 0,
            life: this.CONFIG.cast.flight,
            from: { x: this.bobber.x || tip.x, y: this.bobber.y || tip.y },
            arc: this.layout.height * 0.1
        };
    },

    // ========================================
    // 1フレーム分の描画
    // ========================================
    _draw() {
        const els = this.els;
        const v = this.values;
        const { water } = this.layout;
        const n = (value) => value.toFixed(1);

        // --- 竿（根元が太く先が細い塗り形状） ---
        const points = this.rod.points;
        const left = [];
        const right = [];
        points.forEach((p, i) => {
            const half = (14 - 11 * (i / (points.length - 1))) / 2;
            const nx = Math.cos(p.dir);
            const ny = -Math.sin(p.dir);
            left.push(`${n(p.x - nx * half)},${n(p.y - ny * half)}`);
            right.push(`${n(p.x + nx * half)},${n(p.y + ny * half)}`);
        });
        els.shaft.setAttribute('d', `M${left.join('L')}L${right.reverse().join('L')}Z`);

        const g0 = this._pointAt(0);
        const g1 = this._pointAt(0.12);
        const g2 = this._pointAt(0.24);
        els.grip.setAttribute('d', `M${n(g0.x)},${n(g0.y)}L${n(g1.x)},${n(g1.y)}L${n(g2.x)},${n(g2.y)}`);

        // 星の数だけ、グリップの上に巻き糸を描く
        let wraps = '';
        for (let i = 0; i < (this.stars || 0); i++) {
            const a = this._pointAt(0.275 + i * 0.022);
            const b = this._pointAt(0.285 + i * 0.022);
            wraps += `M${n(a.x)},${n(a.y)}L${n(b.x)},${n(b.y)}`;
        }
        els.wraps.setAttribute('d', wraps);

        [0.48, 0.66, 0.82, 0.95].forEach((s, i) => {
            const p = this._pointAt(s);
            els.guides[i].setAttribute('cx', n(p.x - Math.cos(p.dir) * 7));
            els.guides[i].setAttribute('cy', n(p.y + Math.sin(p.dir) * 7));
        });

        const reelAt = this._pointAt(0.17);
        const reelX = reelAt.x - Math.cos(reelAt.dir) * 18;
        const reelY = reelAt.y + Math.sin(reelAt.dir) * 18;
        els.reel.setAttribute('cx', n(reelX));
        els.reel.setAttribute('cy', n(reelY));
        const knobX = reelX + Math.cos(this.reelAngle) * 15;
        const knobY = reelY + Math.sin(this.reelAngle) * 15;
        els.reelArm.setAttribute('x1', n(reelX));
        els.reelArm.setAttribute('y1', n(reelY));
        els.reelArm.setAttribute('x2', n(knobX));
        els.reelArm.setAttribute('y2', n(knobY));
        els.reelKnob.setAttribute('cx', n(knobX));
        els.reelKnob.setAttribute('cy', n(knobY));

        // --- ウキ（水面より下は隠す） ---
        const bob = this.bobber;
        const inWater = bob.mode === 'float';
        // 切り抜きは外側のグループに掛ける（内側は移動するので、掛けると切り抜きごと動いてしまう）
        els.bobberClip.setAttribute('clip-path', inWater ? 'url(#rs-water-clip)' : 'none');
        els.bobber.setAttribute('transform', `translate(${n(bob.x)},${n(bob.y)})`);

        // --- 糸（竿先からウキの先端まで。たるみの分だけ下に垂れる） ---
        const tip = this.rod.tip;
        const endX = bob.x;
        const endY = inWater ? Math.min(bob.y - 22, water.y + this.CONFIG.waterClip) : bob.y - 22;
        const dist = Math.hypot(endX - tip.x, endY - tip.y);
        const sway = this.reducedMotion ? 0 : Math.sin(this.time * 1.1) * 4 * v.slack.x;
        const sag = v.slack.x * dist * 0.28;
        els.line.setAttribute('d',
            `M${n(tip.x)},${n(tip.y)}Q${n((tip.x + endX) / 2 + sway)},${n((tip.y + endY) / 2 + sag)} ${n(endX)},${n(endY)}`);

        // --- 波紋 ---
        els.ripples.forEach((el, i) => {
            const r = this.ripples[i];
            if (!r) {
                el.setAttribute('opacity', 0);
                return;
            }
            const p = r.age / r.life;
            const size = r.size * (0.3 + 0.7 * p);
            el.setAttribute('cx', n(r.x));
            el.setAttribute('cy', n(r.y));
            el.setAttribute('rx', n(size));
            el.setAttribute('ry', n(size * 0.28));
            el.setAttribute('opacity', (0.8 * (1 - p)).toFixed(2));
        });

        // --- しぶき ---
        els.drops.forEach((el, i) => {
            const d = this.drops[i];
            if (!d) {
                el.setAttribute('opacity', 0);
                return;
            }
            el.setAttribute('cx', n(d.x));
            el.setAttribute('cy', n(d.y));
            el.setAttribute('opacity', (1 - d.age / 0.7).toFixed(2));
        });

        // --- 魚影（ウキの下を左右に動く。大きさは魚のランクと、アタリの強さ） ---
        const rarityScale = this.CONFIG.fishScale[this.options.rarity] || 1;
        const shadowScale = this.state === 'nibble' ? this.shadow.scale : rarityScale;
        els.shadow.setAttribute('cx', n(water.x + v.sweep.x + Math.sin(this.time * 1.7) * 14));
        els.shadow.setAttribute('cy', n(water.y + 34));
        els.shadow.setAttribute('rx', n(20 * shadowScale));
        els.shadow.setAttribute('ry', n(6 * shadowScale));
        els.shadow.setAttribute('opacity', this.shadow.alpha.toFixed(2));

        // --- 跳ねる魚 ---
        if (this.fish) {
            const f = this.fish;
            const u = f.age / f.life;
            const x = f.from.x + (f.to.x - f.from.x) * u;
            const y = f.from.y + (f.to.y - f.from.y) * u - f.arc * 4 * u * (1 - u);
            const spin = -60 + u * 100;
            els.fish.setAttribute('transform', `translate(${n(x)},${n(y)}) rotate(${n(spin)}) scale(${(f.scale * (1 + u * 0.4)).toFixed(2)})`);
            els.fish.setAttribute('opacity', (u < 0.75 ? 1 : (1 - u) * 4).toFixed(2));
        } else {
            els.fish.setAttribute('opacity', 0);
        }

        // --- ヒットの合図「！」（合図なので、動きを減らす設定でも必ず出す） ---
        if (this.state === 'hit') {
            const pop = 1 + 0.6 * Math.exp(-(this.time - this.bangTime) * 9);
            els.bang.setAttribute('transform', `translate(${n(water.x)},${n(water.y - 40)}) scale(${pop.toFixed(2)})`);
            els.bang.setAttribute('opacity', 1);
        } else {
            els.bang.setAttribute('opacity', 0);
        }
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.RodAnimator = RodAnimator;
}
