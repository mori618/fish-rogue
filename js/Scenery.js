// 釣り場ごとの景色
// 水平線の上に重ねる岸辺の景色（shore）と、水面の手前の飾り（deco）を SVG で描く。
// どちらも横 800px の帯で、横に繰り返して画面の幅を埋める。下端（y=90 / y=0）が水平線。
// 水の色は data/gameData.js の各釣り場の water。

const Scenery = {
    // 横に並べる小物を作る小さな道具
    _repeat(count, fn) {
        return Array.from({ length: count }, (_, i) => fn(i)).join('');
    },

    _tree(x, y, r, color) {
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/><circle cx="${x + r * 0.8}" cy="${y + r * 0.3}" r="${r * 0.75}" fill="${color}"/>`;
    },

    _pine(x, base, h, color) {
        const w = h * 0.45;
        return `<path d="M${x} ${base - h} L${x + w} ${base} H${x - w} Z" fill="${color}"/>`;
    },

    // ----------------------------------------
    // 岸辺の景色（800 × 90、下端が水平線）
    // ----------------------------------------
    shore: {
        // 田んぼ: 低い丘、あぜ道で区切られた水田、農家と電柱
        paddy() {
            return `
                <path d="M0 52 Q120 34 260 46 T540 40 T800 50 V90 H0Z" fill="#a9cf8e"/>
                ${Scenery._repeat(4, i => `<rect x="0" y="${62 + i * 7}" width="800" height="5" fill="${i % 2 ? '#c5df84' : '#b2d36f'}"/><rect x="0" y="${67 + i * 7}" width="800" height="2" fill="#cfe7ef"/>`)}
                <g transform="translate(420 34)">
                    <rect x="0" y="10" width="44" height="22" fill="#e8dcc3"/>
                    <path d="M-6 12 L22 -4 L50 12 Z" fill="#4b5563"/>
                    <rect x="8" y="18" width="8" height="8" fill="#7c5c3b"/>
                    <rect x="26" y="18" width="10" height="7" fill="#93c5fd"/>
                </g>
                ${Scenery._repeat(4, i => `<rect x="${90 + i * 200}" y="28" width="3" height="40" fill="#6b5a45"/><rect x="${84 + i * 200}" y="31" width="15" height="2" fill="#6b5a45"/>`)}
                <path d="M91 31 Q190 40 291 31 T491 31 T691 31" stroke="#475569" stroke-width="0.8" fill="none"/>
            `;
        },

        // 小川: 草の土手、木の太鼓橋、柳
        brook() {
            return `
                <path d="M0 58 Q100 44 200 56 T400 52 T600 58 T800 54 V90 H0Z" fill="#7fb069"/>
                <path d="M0 74 Q200 66 400 74 T800 72 V90 H0Z" fill="#94c27b"/>
                <g transform="translate(300 52)">
                    <path d="M0 30 Q60 -6 120 30" stroke="#8b5a2b" stroke-width="7" fill="none"/>
                    <path d="M0 22 Q60 -14 120 22" stroke="#a16207" stroke-width="2.5" fill="none"/>
                    ${Scenery._repeat(7, i => `<rect x="${8 + i * 17}" y="${i === 0 || i === 6 ? 14 : 4 + Math.abs(3 - i) * 3}" width="2.5" height="14" fill="#a16207"/>`)}
                </g>
                <g transform="translate(470 20)">
                    <rect x="14" y="22" width="6" height="40" fill="#6b4f2e"/>
                    <path d="M17 6 Q-6 20 -2 58 M17 6 Q2 26 6 60 M17 6 Q32 26 30 60 M17 6 Q42 20 38 58" stroke="#5f8f3a" stroke-width="5" fill="none" stroke-linecap="round"/>
                </g>
                ${Scenery._tree(250, 50, 11, '#4d7c3a')}${Scenery._tree(560, 50, 10, '#5a8a43')}
            `;
        },

        // ため池: こんもりした森、葦、赤い鳥居
        pond() {
            return `
                ${Scenery._repeat(14, i => Scenery._tree(i * 60 + 10, 46 + (i % 3) * 5, 22 + (i % 2) * 6, i % 2 ? '#2f5d3a' : '#3b6e44'))}
                <rect x="0" y="62" width="800" height="28" fill="#3b6e44"/>
                <g transform="translate(430 40)" fill="#dc2626">
                    <rect x="4" y="8" width="5" height="34"/><rect x="33" y="8" width="5" height="34"/>
                    <rect x="-4" y="2" width="50" height="5"/><rect x="0" y="14" width="42" height="3"/>
                </g>
                <g stroke="#6b8f3a" stroke-width="2" stroke-linecap="round">
                    ${Scenery._repeat(26, i => `<path d="M${i * 31 + 5} 90 L${i * 31 + 3 + (i % 3)} ${70 - (i % 4) * 4}"/>`)}
                </g>
            `;
        },

        // 渓流: 迫る山、針葉樹、大岩、滝
        stream() {
            return `
                <path d="M0 90 V20 L60 4 L130 30 L210 0 L300 26 L380 6 L470 34 L560 2 L650 22 L730 6 L800 24 V90Z" fill="#4a6b55"/>
                <path d="M0 90 V44 L90 30 L170 50 L260 34 L350 54 L450 36 L540 52 L640 38 L730 52 L800 40 V90Z" fill="#355443"/>
                <rect x="468" y="30" width="12" height="52" fill="#e0f2fe" opacity="0.9"/>
                <rect x="472" y="30" width="3" height="52" fill="#ffffff"/>
                ${Scenery._repeat(18, i => Scenery._pine(i * 46 + 12, 72, 30 + (i % 3) * 8, i % 2 ? '#1f3d2c' : '#284b37'))}
                ${Scenery._repeat(6, i => `<ellipse cx="${i * 140 + 50}" cy="86" rx="${26 + (i % 2) * 10}" ry="13" fill="#8a8f98"/><ellipse cx="${i * 140 + 44}" cy="82" rx="12" ry="5" fill="#a8adb5"/>`)}
            `;
        },

        // 湖: 遠くの雪山、森の帯、ボート小屋
        lake() {
            return `
                <path d="M0 70 L90 30 L150 52 L260 10 L360 50 L450 22 L560 56 L660 18 L760 50 L800 40 V90 H0Z" fill="#7b93b5"/>
                <path d="M260 10 L238 26 L248 24 L260 30 L272 24 L284 26 Z M660 18 L642 32 L660 36 L676 31 Z M90 30 L74 40 L92 42 L104 38 Z" fill="#f8fafc"/>
                ${Scenery._repeat(32, i => Scenery._pine(i * 25 + 6, 84, 16 + (i % 4) * 3, '#3f5f4a'))}
                <rect x="0" y="82" width="800" height="8" fill="#3f5f4a"/>
                <g transform="translate(470 66)">
                    <rect x="0" y="6" width="30" height="16" fill="#9a6b42"/>
                    <path d="M-4 8 L15 -4 L34 8 Z" fill="#7f1d1d"/>
                    <rect x="30" y="18" width="26" height="3" fill="#8b6b4a"/>
                </g>
            `;
        },

        // 中流: 砂利の河原、遠くの町、長い鉄橋
        midstream() {
            return `
                ${Scenery._repeat(20, i => `<rect x="${i * 40 + 4}" y="${50 - (i * 7) % 18}" width="${22 + (i % 3) * 6}" height="${30 + (i * 7) % 18}" fill="${i % 2 ? '#94a3b8' : '#a5b4c6'}"/>`)}
                <rect x="0" y="72" width="800" height="18" fill="#c9bfa5"/>
                ${Scenery._repeat(40, i => `<circle cx="${i * 20 + 6}" cy="${80 + (i % 3) * 3}" r="${1.5 + (i % 2)}" fill="#a89e86"/>`)}
                <g fill="none" stroke="#b91c1c" stroke-width="3">
                    <path d="M0 52 H800"/><path d="M0 70 H800"/>
                    ${Scenery._repeat(20, i => `<path d="M${i * 40} 70 L${i * 40 + 20} 52 L${i * 40 + 40} 70"/>`)}
                </g>
                ${Scenery._repeat(5, i => `<rect x="${i * 160 + 70}" y="70" width="8" height="20" fill="#7f1d1d"/>`)}
            `;
        },

        // 堤防: コンクリートの防波堤、テトラポッド、赤い灯台、遠くのクレーン
        pier() {
            return `
                <g fill="#9aa5b4" opacity="0.8">
                    <path d="M240 60 V20 H244 V60 Z M220 22 H290 V25 H220 Z M280 25 V40 H283 V25 Z"/>
                    <path d="M320 60 V14 H324 V60 Z M300 16 H380 V19 H300 Z M370 19 V36 H373 V19 Z"/>
                </g>
                <rect x="0" y="64" width="800" height="26" fill="#b6bcc6"/>
                <rect x="0" y="62" width="800" height="4" fill="#d6dae0"/>
                ${Scenery._repeat(22, i => `<path d="M${i * 37} 90 L${i * 37 + 12} 74 L${i * 37 + 24} 90 Z M${i * 37 + 4} 80 L${i * 37 + 26} 80 L${i * 37 + 15} 72 Z" fill="${i % 2 ? '#8b939f' : '#9aa2ad'}"/>`)}
                <g transform="translate(470 14)">
                    <path d="M4 50 L8 6 H22 L26 50 Z" fill="#f8fafc"/>
                    <rect x="6" y="16" width="18" height="6" fill="#dc2626"/>
                    <rect x="5" y="32" width="20" height="6" fill="#dc2626"/>
                    <rect x="7" y="0" width="16" height="8" fill="#334155"/>
                    <circle cx="15" cy="4" r="3" fill="#fde047"/>
                </g>
            `;
        },

        // 磯: ごつごつした黒い岩、崖の上の松、白い波しぶき
        rocks() {
            return `
                <path d="M200 90 V44 L230 30 L260 42 L290 34 L320 52 L340 90 Z" fill="#3f4652"/>
                <path d="M420 90 L450 50 L490 30 L530 20 L570 8 L600 16 V90 Z" fill="#3f4652"/>
                <path d="M440 90 L470 60 L500 54 L540 40 L600 44 V90 Z" fill="#2d333c"/>
                <g transform="translate(530 -2)">
                    <rect x="8" y="10" width="4" height="16" fill="#5b4636"/>
                    <path d="M-10 12 Q10 0 30 12 Q10 6 -10 12 M-6 4 Q10 -6 26 4 Q10 0 -6 4" fill="#2f5d3a" stroke="#2f5d3a" stroke-width="4"/>
                </g>
                ${Scenery._repeat(5, i => `<path d="M${260 + i * 80} 90 L${272 + i * 80} 72 L${290 + i * 80} 66 L${306 + i * 80} 78 L${314 + i * 80} 90 Z" fill="#4b5260"/>`)}
                ${Scenery._repeat(10, i => `<circle cx="${150 + i * 50}" cy="${84 - (i % 3) * 4}" r="${2 + (i % 2)}" fill="#ffffff" opacity="0.85"/>`)}
            `;
        },

        // 潮目: ひらけた海、遠くの島
        rip() {
            return `
                <path d="M380 90 Q420 62 470 66 Q510 56 550 72 Q580 74 600 90 Z" fill="#6b8f9e"/>
                <path d="M440 70 Q460 60 480 66" stroke="#4f6f7d" stroke-width="3" fill="none"/>
                <path d="M120 90 Q140 80 170 82 Q190 78 210 90 Z" fill="#86a3b0"/>
            `;
        },

        // 沖: 何もない水平線、遠くの貨物船
        offshore() {
            return `
                <g transform="translate(420 72)" fill="#475569" opacity="0.8">
                    <path d="M0 10 H90 L84 18 H6 Z"/>
                    <rect x="62" y="0" width="16" height="10"/>
                    <rect x="10" y="4" width="10" height="6"/><rect x="22" y="4" width="10" height="6"/><rect x="34" y="4" width="10" height="6"/>
                    <rect x="68" y="-6" width="3" height="6"/>
                </g>
            `;
        },

        // 深場: 低い雲の帯だけ
        deep() {
            return `
                <path d="M0 90 V78 Q100 70 200 78 T400 76 T600 78 T800 76 V90 Z" fill="#94a3b8" opacity="0.45"/>
            `;
        },

        // 海溝: 暗い水平線
        trench() {
            return `
                <rect x="0" y="80" width="800" height="10" fill="#1e293b" opacity="0.5"/>
            `;
        }
    },

    // ----------------------------------------
    // 水面の飾り（800 × 60、上端が水平線）
    // ----------------------------------------
    deco: {
        paddy() {
            return Scenery._repeat(5, row => Scenery._repeat(26, i =>
                `<path d="M${i * 31 + (row % 2) * 15} ${10 + row * 10} l-2 -6 M${i * 31 + (row % 2) * 15} ${10 + row * 10} l2 -6 M${i * 31 + (row % 2) * 15} ${10 + row * 10} v-7" stroke="#8fbf4a" stroke-width="1.4"/>`)).toString();
        },
        brook() {
            return Scenery._repeat(14, i => `<ellipse cx="${i * 58 + 20}" cy="${8 + (i % 3) * 10}" rx="${7 + (i % 2) * 3}" ry="3" fill="#a3b1a0" opacity="0.8"/>`);
        },
        pond() {
            return Scenery._repeat(9, i => `<path d="M${i * 90 + 30} ${12 + (i % 3) * 12} m-12 0 a12 5 0 1 0 24 0 a12 5 0 1 0 -24 0 z" fill="#3f8a4a"/><path d="M${i * 90 + 30} ${12 + (i % 3) * 12} l10 -3" stroke="#2f6b3a" stroke-width="2"/>`);
        },
        stream() {
            return Scenery._repeat(18, i => `<path d="M${i * 46} ${6 + (i % 4) * 9} q12 -4 24 0" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.8"/>`);
        },
        lake() {
            return `<path d="M0 3 H800" stroke="#cbd5e1" stroke-width="1" opacity="0.6"/>` +
                Scenery._repeat(10, i => `<path d="M${i * 80 + 20} ${10 + (i % 3) * 14} h30" stroke="#ffffff" stroke-width="1" opacity="0.35"/>`);
        },
        midstream() {
            return Scenery._repeat(16, i => `<path d="M${i * 50} ${8 + (i % 3) * 12} q10 -3 20 0 t20 0" stroke="#e2e8f0" stroke-width="1.4" fill="none" opacity="0.6"/>`);
        },
        pier() {
            return Scenery._repeat(12, i => `<path d="M${i * 70} ${10 + (i % 2) * 14} q10 -4 20 0" stroke="#ffffff" stroke-width="1.6" fill="none" opacity="0.6"/>`);
        },
        rocks() {
            return Scenery._repeat(6, i => `<path d="M${i * 140 + 40} 18 l10 -12 l14 4 l8 10 z" fill="#3f4652"/><path d="M${i * 140 + 30} 20 q20 -6 50 0" stroke="#ffffff" stroke-width="2.4" fill="none" opacity="0.9"/>`);
        },
        rip() {
            // 潮目: 色の違う海がぶつかる泡の帯
            return `<path d="M0 30 Q100 18 200 28 T400 24 T600 30 T800 22 V40 Q700 46 600 40 T400 42 T200 38 T0 42 Z" fill="#1d4ed8" opacity="0.35"/>` +
                Scenery._repeat(40, i => `<circle cx="${i * 20 + 6}" cy="${28 + Math.sin(i) * 5}" r="${1.4 + (i % 3) * 0.6}" fill="#ffffff" opacity="0.85"/>`);
        },
        offshore() {
            return Scenery._repeat(10, i => `<path d="M${i * 80} ${12 + (i % 3) * 14} q14 -6 28 0" stroke="#ffffff" stroke-width="1.4" fill="none" opacity="0.4"/>`);
        },
        deep() {
            return Scenery._repeat(8, i => `<path d="M${i * 100} ${14 + (i % 2) * 18} q25 -8 50 0" stroke="#93c5fd" stroke-width="1.2" fill="none" opacity="0.3"/>`);
        },
        trench() {
            return Scenery._repeat(12, i => `<circle cx="${i * 66 + 20}" cy="${16 + (i % 4) * 10}" r="${1.5 + (i % 3)}" fill="none" stroke="#93c5fd" stroke-width="0.8" opacity="0.5"/>`);
        }
    },

    // CSS の background-image に使える data URI にする
    _uri(svg, height) {
        const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 ${height}" width="800" height="${height}">${svg}</svg>`;
        return `url("data:image/svg+xml,${encodeURIComponent(doc)}")`;
    },

    // 釣り画面の岸辺と水面の飾りを、その釣り場のものにする
    apply(spotId) {
        const shore = document.querySelector('#fishing-screen .rg-shore');
        const deco = document.querySelector('#fishing-screen .rg-water-deco');
        const shoreFn = this.shore[spotId];
        const decoFn = this.deco[spotId];
        if (shore) shore.style.backgroundImage = shoreFn ? this._uri(shoreFn(), 90) : 'none';
        if (deco) deco.style.backgroundImage = decoFn ? this._uri(decoFn(), 60) : 'none';
    }
};

if (typeof window !== 'undefined') {
    window.Scenery = Scenery;
}
