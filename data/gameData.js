// ゲームデータ定義
// 釣り竿、魚、スキル、餌などのマスターデータ

// ========================================
// 釣り竿データ
// 星4つのパワー ≒ 次のランクの竿（星0）のパワー となるよう調整
// ========================================
const RODS = [
    {
        id: 'wooden_rod',
        name: '木の釣竿',
        basePower: 10,
        starPowerBonus: 3,  // 星1つあたりのパワー上昇
        price: 0,           // 初期装備
        upgradeCosts: [100, 300, 600, 1200, 3000], // 星1〜5への強化費用
        description: '初心者向けの木製釣竿'
    },
    {
        id: 'bamboo_rod',
        name: '竹の釣竿',
        basePower: 22,
        starPowerBonus: 5,
        price: 2000,
        upgradeCosts: [1000, 2500, 5000, 10000, 20000],
        description: 'しなやかで扱いやすい竹製釣竿'
    },
    {
        id: 'carbon_rod',
        name: 'カーボン釣竿',
        basePower: 42,
        starPowerBonus: 8,
        price: 10000,
        upgradeCosts: [5000, 12000, 25000, 50000, 100000],
        description: '軽量で強度に優れたカーボン製'
    },
    {
        id: 'titanium_rod',
        name: 'チタン釣竿',
        basePower: 74,
        starPowerBonus: 12,
        price: 50000,
        upgradeCosts: [20000, 50000, 100000, 200000, 400000],
        description: '最高級のチタン合金製釣竿'
    },
    {
        id: 'legendary_rod',
        name: '伝説の釣竿',
        basePower: 122,
        starPowerBonus: 20,
        price: 250000,
        upgradeCosts: [100000, 250000, 500000, 1000000, 2000000],
        description: '古より伝わる伝説の釣竿'
    }
];

// ========================================
// 魚データ
// レア度: common(一般), uncommon(珍しい), rare(レア), epic(超レア), legendary(伝説)
// ========================================
// ========================================
// 魚データ (計35種類)
// ランク: D(9), C(8), B(7), A(6), S(5)
// ========================================
const FISH = [
    // Dランク (9種)
    {
        id: 'fish_d9', name: 'オタマジャクシ', power: 4, price: 5, rarity: 'D', weight: 20, frequency: 'たくさん釣れる', specialTitle: '明日に夢見る', icon: 'spa',
        description: 'カエルの子供。もうすぐ足が生えてくるかもしれない。',
        titleDescription: 'いつか大空を飛ぶことを夢見続けている、ロマンチストなオタマジャクシ。'
    },
    {
        id: 'fish_d1', name: 'メダカ', power: 5, price: 10, rarity: 'D', weight: 15, frequency: 'そこそこ釣れる', specialTitle: '水たまりの', icon: 'water_drop',
        image: 'images/fish/medaka.webp',
        description: '小さな淡水魚。群れで泳ぐ姿が可愛らしい。',
        titleDescription: '水たまりの主として君臨する巨大メダカ。'
    },
    {
        id: 'fish_d2', name: 'フナ', power: 6, price: 15, rarity: 'D', weight: 15, frequency: 'そこそこ釣れる', specialTitle: '泥まみれの', icon: 'set_meal',
        description: '日本の河川でよく見られる魚。釣りはフナに始まりフナに終わると言われる。',
        titleDescription: '泥の中を這い回り、たくましく生き抜いた伝説のフナ。'
    },
    {
        id: 'fish_d3', name: 'クチボソ', power: 7, price: 20, rarity: 'D', weight: 12, frequency: 'あまり釣れない', specialTitle: '小生意気な', icon: 'water_drop',
        description: '口が細いことからこの名がついた。すばしっこい。',
        titleDescription: '釣り人を翻弄する、非常に小生意気な性格をしたクチボソ。'
    },
    {
        id: 'fish_d4', name: 'ヌマエビ', power: 8, price: 25, rarity: 'D', weight: 10, frequency: 'あまり釣れない', specialTitle: '透き通った', icon: 'pest_control',
        description: '水草の間を動き回る小さなエビ。透き通った体が特徴。',
        titleDescription: '驚くべき透明度を誇り、水に溶け込むかのようなヌマエビ。'
    },
    {
        id: 'fish_d6', name: 'ハゼ', power: 10, price: 35, rarity: 'D', weight: 10, frequency: 'あまり釣れない', specialTitle: '砂底の', icon: 'set_meal',
        description: '砂泥底に生息する愛嬌のある顔をした魚。天ぷらが美味しい。',
        titleDescription: '砂底の支配者として、海底から全てを見通すハゼ。'
    },
    {
        id: 'fish_d5', name: 'ザリガニ', power: 9, price: 30, rarity: 'D', weight: 8, frequency: 'なかなか釣れない', specialTitle: '真紅の鋏の', icon: 'pest_control',
        description: '大きなハサミを持つ淡水の甲殻類。後ろ向きに泳ぐのが得意。',
        titleDescription: '鉄をも断ち切る真紅のハサミを持つ、恐るべきザリガニ。'
    },
    {
        id: 'fish_d7', name: 'タナゴ', power: 11, price: 40, rarity: 'D', weight: 5, frequency: 'なかなか釣れない', specialTitle: '虹色に輝く', icon: 'palette',
        description: '美しい婚姻色を持つことで知られる淡水魚。',
        titleDescription: '七色に輝く鱗を持ち、見る者を魅了する幻のタナゴ。'
    },
    {
        id: 'fish_d8', name: 'ドジョウ', power: 12, price: 45, rarity: 'D', weight: 5, frequency: 'なかなか釣れない', specialTitle: 'ぬるぬるした', icon: 'gesture',
        description: '細長い体で泥の中を泳ぐ。ひげがチャームポイント。',
        titleDescription: '捕まえようとしても手から滑り落ちる、究極のぬるぬるを持つドジョウ。'
    },

    // Cランク (8種)
    {
        id: 'fish_c7', name: 'ブルーギル', power: 14, price: 50, rarity: 'C', weight: 25, frequency: 'たくさん釣れる', specialTitle: '青い鱗の', icon: 'water',
        description: '青みがかった体色が特徴。繁殖力が強い。',
        titleDescription: '神秘的な青い輝きを放つ、突然変異種のブルーギル。'
    },
    {
        id: 'fish_c8', name: 'ウグイ', power: 12, price: 40, rarity: 'C', weight: 20, frequency: 'たくさん釣れる', specialTitle: 'どこにでも居る', icon: 'set_meal',
        description: '酸性水にも強い生命力を持つ魚。婚姻色は鮮やかな朱色になる。',
        titleDescription: '世界中どこへ行っても遭遇する、神出鬼没のウグイ。'
    },
    {
        id: 'fish_c4', name: 'コイ', power: 22, price: 100, rarity: 'C', weight: 15, frequency: 'そこそこ釣れる', specialTitle: '大河の主候補', icon: 'set_meal',
        description: '生命力が非常に強く、長生きする魚。滝を登ると龍になると言われる。',
        titleDescription: '龍になる直前、強大な力を秘めた大河の主候補。'
    },
    {
        id: 'fish_c1', name: 'アユ', power: 15, price: 60, rarity: 'C', weight: 12, frequency: 'あまり釣れない', specialTitle: '清流の', icon: 'waves',
        description: '清流に住む魚。独特の香気があり、香魚とも呼ばれる。',
        titleDescription: '最も清らかな水にしか住まない、高貴な香りを放つアユ。'
    },
    {
        id: 'fish_c5', name: 'ニジマス', power: 25, price: 120, rarity: 'C', weight: 10, frequency: 'あまり釣れない', specialTitle: '宝石を纏った', icon: 'diamond',
        description: '体側に虹色の帯があるのが特徴。釣りの対象として人気が高い。',
        titleDescription: '全身が宝石のように輝き、見る者を魅了するニジマス。'
    },
    {
        id: 'fish_c6', name: 'ブラックバス', power: 28, price: 150, rarity: 'C', weight: 8, frequency: 'なかなか釣れない', specialTitle: '湖の暴君', icon: 'gavel',
        description: '北米原産の肉食魚。引きが強く、ゲームフィッシングで人気。',
        titleDescription: '湖の生態系を支配する、圧倒的な力を持った暴君バス。'
    },
    {
        id: 'fish_c2', name: 'イワナ', power: 18, price: 75, rarity: 'C', weight: 5, frequency: 'なかなか釣れない', specialTitle: '岩陰の紳士', icon: 'landscape',
        description: '河川の最上流部に生息する。貪欲な肉食性を持つ。',
        titleDescription: '岩陰から虎視眈々と獲物を狙う、冷徹な紳士イワナ。'
    },
    {
        id: 'fish_c3', name: 'ヤマメ', power: 20, price: 90, rarity: 'C', weight: 5, frequency: 'なかなか釣れない', specialTitle: '渓流の女王', icon: 'filter_hdr',
        description: '体のパーマークが美しい、渓流の女王と呼ばれる魚。',
        titleDescription: 'その美しさで釣り人を惑わす、真の渓流の女王。'
    },

    // Bランク (7種)
    {
        id: 'fish_b7', name: 'ボラ', power: 28, price: 180, rarity: 'B', weight: 25, frequency: 'たくさん釣れる', specialTitle: '海辺の跳躍者', icon: 'flight',
        description: 'よく水面からジャンプする姿が見られる。卵巣はカラスミになる。',
        titleDescription: '大空へ飛び出すことを夢見て、限界まで跳躍するボラ。'
    },
    {
        id: 'fish_b6', name: 'カツオ', power: 30, price: 200, rarity: 'B', weight: 20, frequency: 'たくさん釣れる', specialTitle: '一本釣りの', icon: 'phishing',
        description: '高速で泳ぎ続ける回遊魚。たたきが絶品。',
        titleDescription: '誰にも止められない速度で海を駆け抜ける、弾丸カツオ。'
    },
    {
        id: 'fish_b5', name: 'サワラ', power: 55, price: 450, rarity: 'B', weight: 15, frequency: 'そこそこ釣れる', specialTitle: '春を告げる', icon: 'local_florist',
        description: '細長い体が特徴の大型肉食魚。春の訪れを告げる魚。',
        titleDescription: '春風と共に現れ、全てを置き去りにする疾風のサワラ。'
    },
    {
        id: 'fish_b4', name: 'スズキ', power: 50, price: 400, rarity: 'B', weight: 15, frequency: 'そこそこ釣れる', specialTitle: '出世を夢見る', icon: 'trending_up',
        description: '汽水域から海水域まで広く生息する。ルアーフィッシングの好敵手。',
        titleDescription: '海を支配する野望を持ち、貪欲に成長を続けるスズキ。'
    },
    {
        id: 'fish_b3', name: 'ブリ', power: 45, price: 350, rarity: 'B', weight: 10, frequency: 'あまり釣れない', specialTitle: '荒波に揉まれた', icon: 'tsunami',
        description: '成長するにつれて名前が変わる出世魚。冬の味覚。',
        titleDescription: '幾多の荒波を乗り越え、最強の身体を手に入れたブリ。'
    },
    {
        id: 'fish_b2', name: 'ヒラメ', power: 40, price: 300, rarity: 'B', weight: 8, frequency: 'なかなか釣れない', specialTitle: '砂漠の忍者の', icon: 'visibility_off',
        description: '海底の砂に隠れて獲物を待つ。高級魚としても知られる。',
        titleDescription: '砂と完全に同化し、獲物を瞬殺する砂漠の忍者ヒラメ。'
    },
    {
        id: 'fish_b1', name: 'タイ', power: 35, price: 250, rarity: 'B', weight: 7, frequency: 'なかなか釣れない', specialTitle: '目出度い', icon: 'celebration',
        description: '「めでたい」に通じる縁起の良い魚。味も姿も一級品。',
        titleDescription: '祝いの席には欠かせない、光り輝く最高級のタイ。'
    },

    // Aランク (6種)
    {
        id: 'fish_a5', name: 'エイ', power: 60, price: 700, rarity: 'A', weight: 30, frequency: 'たくさん釣れる', specialTitle: '海を舞う', icon: 'paragliding',
        description: '平べったい体と長い尾が特徴。優雅に泳ぐ姿は空飛ぶ絨毯のよう。',
        titleDescription: '海中を優雅に舞い、毒針すらも美しい芸術的なエイ。'
    },
    {
        id: 'fish_a1', name: 'マグロ', power: 70, price: 800, rarity: 'A', weight: 25, frequency: 'たくさん釣れる', specialTitle: '大海を駆ける', icon: 'speed',
        description: '海の王様とも呼ばれる大型回遊魚。その巨体は高速で泳ぐための筋肉の塊。',
        titleDescription: '七つの海を制覇し、止まることを知らない海の帝王マグロ。'
    },
    {
        id: 'fish_a3', name: 'ウナギ', power: 65, price: 1000, rarity: 'A', weight: 15, frequency: 'そこそこ釣れる', specialTitle: '精力のつく', icon: 'bolt',
        description: '長い旅をして川に戻ってくる神秘的な魚。蒲焼きは日本の伝統食。',
        titleDescription: '無限のスタミナを秘め、食べた者に活力を与える伝説のウナギ。'
    },
    {
        id: 'fish_a2', name: 'カジキ', power: 85, price: 1200, rarity: 'A', weight: 12, frequency: 'あまり釣れない', specialTitle: '水中の狙撃手', icon: 'gps_fixed',
        description: '鋭く尖った吻が特徴。世界最速の魚類の一つ。',
        titleDescription: '狙った獲物は逃がさない、海のスナイパーとして恐れられるカジキ。'
    },
    {
        id: 'fish_a4', name: 'クエ', power: 95, price: 1500, rarity: 'A', weight: 10, frequency: 'あまり釣れない', specialTitle: '幻の磯の主', icon: 'workspace_premium',
        description: '磯の王者と呼ばれるハタ科の大型魚。味は絶品だが、釣るのは非常に困難。',
        titleDescription: '滅多に姿を現さない、幻の中の幻と呼ばれる究極のクエ。'
    },
    {
        id: 'fish_a6', name: 'チョウザメ', power: 110, price: 2000, rarity: 'A', weight: 8, frequency: 'なかなか釣れない', specialTitle: 'キャビアを産む', icon: 'egg_alt',
        description: '古代魚の姿を残す大型魚。世界三大珍味の一つキャビアの親。',
        titleDescription: '黄金のキャビアをその身に宿す、生きた宝石箱チョウザメ。'
    },

    // Sランク (5種)
    {
        id: 'fish_s3', name: '大王イカ', power: 120, price: 4000, rarity: 'S', weight: 40, frequency: 'たくさん釣れる', specialTitle: '全てを呑み込む', icon: 'hub',
        description: '世界最大級の無脊椎動物。深海の怪物クラーケンの正体とされる。',
        titleDescription: 'その巨大な触手で船さえも沈めると噂される、深海の悪魔。'
    },
    {
        id: 'fish_s1', name: 'シーラカンス', power: 130, price: 5000, rarity: 'S', weight: 25, frequency: 'たくさん釣れる', specialTitle: '太古より目覚めし', icon: 'history',
        description: '数億年前から姿を変えていない「生きた化石」。深海にひっそりと生息する。',
        titleDescription: '悠久の時を超えて現代に蘇った、歴史の証人たるシーラカンス。'
    },
    {
        id: 'fish_s2', name: 'リュウグウノツカイ', power: 150, price: 8000, rarity: 'S', weight: 20, frequency: 'たくさん釣れる', specialTitle: '深海よりの使者', icon: 'scuba_diving',
        description: '銀色の長い体と赤い鰭が美しい深海魚。人魚のモデルとも言われる。',
        titleDescription: '竜宮城からのメッセージを携え、深海から現れた神秘の使者。'
    },
    {
        id: 'fish_s4', name: '黄金のタイ', power: 140, price: 10000, rarity: 'S', weight: 10, frequency: 'あまり釣れない', specialTitle: '伝説の輝きを放つ', icon: 'star',
        description: '全身が黄金に輝く伝説のタイ。釣り上げた者に巨万の富をもたらす。',
        titleDescription: '太陽の如き輝きを放ち、見る者全ての運命を変える神の使い。'
    },
    {
        id: 'fish_s5', name: '伝説の海龍', power: 200, price: 30000, rarity: 'S', weight: 5, frequency: 'なかなか釣れない', specialTitle: '天を統べし', icon: 'token',
        description: 'あらゆる海洋生物の頂点に立つ龍。その姿を見た者はいないとされる。',
        titleDescription: '海だけでなく天候さえも操る、神話の世界から現れた絶対的な存在。'
    },

    // SSランク (2種)
    {
        id: 'fish_ss1', name: '伝説のクラーケン', power: 250, price: 50000, rarity: 'SS', weight: 0.05, frequency: '滅多に釣れない', specialTitle: '深海よりの厄災', icon: 'storm',
        description: '船を襲い海に引きずり込むと言われる伝説の巨大生物。複数の触手を持つ。',
        titleDescription: '全ての船乗りに恐れられ、海そのものの怒りを具現化したかのような厄災。'
    },
    {
        id: 'fish_ss2', name: 'リヴァイアサン', power: 300, price: 80000, rarity: 'SS', weight: 0.02, frequency: '滅多に釣れない', specialTitle: '世界を飲み込む', icon: 'all_inclusive',
        description: '旧約聖書にも記される巨大な海獣。その鱗はあらゆる武器を弾くという。',
        titleDescription: '世界の終わりに現れ、海すらも飲み干すと言われる究極の海獣。'
    }
];

// ========================================
// 称号付き魚の設定
// ========================================
const TITLE_CONFIG = {
    chance: 0.015,        // 称号付きが出る確率 (5%)
    priceMultiplier: 10,  // 称号付きの売値倍率
};

// ========================================
// ランクシステム設定
// ========================================
const RANK_SYSTEM = {
    baseExp: 100,       // ランク1→2に必要な経験値
    expGrowthRate: 1.15, // 必要経験値の増加率 (15%増)
    powerBonusPerRank: 0.01, // ランクごとの釣りパワーボーナス (1%)
    // ランクアップ報酬 (ジェネレーター関数等で動的に処理するか、固定パターン)
    rewardCoinBase: 1000,
    rewardCoinGrowth: 500,
};

// ========================================
// スキルデータ
// ========================================
const SKILLS = [
    { id: 'power_up_1', name: 'パワーUP I', description: '釣りパワー+5', effect: { type: 'power_boost', value: 5 }, price: 200, tier: 1, group: '強化グループ', icon: 'bolt' },
    { id: 'power_up_2', name: 'パワーUP II', description: '釣りパワー+15', effect: { type: 'power_boost', value: 15 }, price: 800, tier: 2, group: '強化グループ', icon: 'bolt' },
    { id: 'power_up_3', name: 'パワーUP III', description: '釣りパワー+30', effect: { type: 'power_boost', value: 30 }, price: 2500, tier: 3, group: '強化グループ', icon: 'bolt' },
    { id: 'power_up_4', name: 'パワーUP 極', description: '釣りパワー+60', effect: { type: 'power_boost', value: 60 }, price: 10000, tier: 4, group: '強化グループ', icon: 'bolt' },
    { id: 'overdrive_1', name: 'オーバードライブ I', description: 'パワー+15% & ゲージ速度+5%', effect: { type: 'overdrive', power: 0.15, speed: 0.05 }, price: 1000, tier: 1, group: '強化グループ', icon: 'bolt' },
    { id: 'overdrive_2', name: 'オーバードライブ II', description: 'パワー+30% & ゲージ速度+10%', effect: { type: 'overdrive', power: 0.3, speed: 0.1 }, price: 4000, tier: 2, group: '強化グループ', icon: 'bolt' },
    { id: 'overdrive_3', name: 'オーバードライブ III', description: 'パワー+50% & ゲージ速度+20%', effect: { type: 'overdrive', power: 0.5, speed: 0.2 }, price: 10000, tier: 3, group: '強化グループ', icon: 'bolt' },
    { id: 'overdrive_4', name: 'オーバードライブ 極', description: 'パワー+100% & ゲージ速度+30%', effect: { type: 'overdrive', power: 1, speed: 0.4 }, price: 30000, tier: 4, group: '強化グループ', icon: 'bolt' },
    { id: 'ultimate_risk_1', name: '究極の賭け I', description: 'パワー+40% & 失敗時に所持魚が半分減少', effect: { type: 'ultimate_risk', power: 0.4, lossRate: 0.5 }, price: 5000, tier: 1, group: '強化グループ', icon: 'bolt' },
    { id: 'ultimate_risk_2', name: '究極の賭け II', description: 'パワー+70% & 失敗時に所持魚が8割減少', effect: { type: 'ultimate_risk', power: 0.7, lossRate: 0.8 }, price: 15000, tier: 2, group: '強化グループ', icon: 'bolt' },
    { id: 'ultimate_risk_3', name: '究極の賭け III', description: 'パワー+100% & 失敗時に所持魚が0になる', effect: { type: 'ultimate_risk', power: 1, lossRate: 1 }, price: 50000, tier: 3, group: '強化グループ', icon: 'bolt' },
    { id: 'ultimate_risk_4', name: '究極の賭け 極', description: 'パワー+200% & 失敗時に所持金と魚が0になる', effect: { type: 'ultimate_risk', power: 2, lossRate: 1, moneyLoss: true }, price: 150000, tier: 4, group: '強化グループ', icon: 'bolt' },
    { id: 'gauge_slow_1', name: 'ゲージ減速 I', description: 'ゲージ速度-10%', effect: { type: 'gauge_slow', value: 0.1 }, price: 300, tier: 1, group: '強化グループ', icon: 'bolt' },
    { id: 'gauge_slow_2', name: 'ゲージ減速 II', description: 'ゲージ速度-20%', effect: { type: 'gauge_slow', value: 0.2 }, price: 1000, tier: 2, group: '強化グループ', icon: 'bolt' },
    { id: 'gauge_slow_3', name: 'ゲージ減速 III', description: 'ゲージ速度-30%', effect: { type: 'gauge_slow', value: 0.3 }, price: 5000, tier: 3, group: '強化グループ', icon: 'bolt' },
    { id: 'gauge_slow_4', name: 'ゲージ減速 極', description: 'ゲージ速度-45%', effect: { type: 'gauge_slow', value: 0.45 }, price: 15000, tier: 4, group: '強化グループ', icon: 'bolt' },
    { id: 'price_up_1', name: '売値UP I', description: '魚の売却価格+10%', effect: { type: 'price_boost', value: 0.1 }, price: 400, tier: 1, group: '商売グループ', icon: 'payments' },
    { id: 'price_up_2', name: '売値UP II', description: '魚の売却価格+25%', effect: { type: 'price_boost', value: 0.25 }, price: 1500, tier: 2, group: '商売グループ', icon: 'payments' },
    { id: 'price_up_3', name: '売値UP III', description: '魚の売却価格+45%', effect: { type: 'price_boost', value: 0.45 }, price: 4000, tier: 3, group: '商売グループ', icon: 'payments' },
    { id: 'price_up_4', name: '売値UP 極', description: '魚の売却価格+70%', effect: { type: 'price_boost', value: 0.7 }, price: 12000, tier: 4, group: '商売グループ', icon: 'payments' },
    { id: 'high_risk_sell_1', name: '闇取引 I', description: '売却価格1.2倍 & 失敗時に所持金微減', effect: { type: 'high_risk_sell', priceMult: 1.2, penaltyRate: 0.05 }, price: 1200, tier: 1, group: '商売グループ', icon: 'payments' },
    { id: 'high_risk_sell_2', name: '闇取引 II', description: '売却価格1.5倍 & 失敗時に所持金減少(小)', effect: { type: 'high_risk_sell', priceMult: 1.5, penaltyRate: 0.1 }, price: 5000, tier: 2, group: '商売グループ', icon: 'payments' },
    { id: 'high_risk_sell_3', name: '闇取引 III', description: '売却価格3倍 & 失敗時に所持金減少(大)', effect: { type: 'high_risk_sell', priceMult: 3, penaltyRate: 0.3 }, price: 15000, tier: 3, group: '商売グループ', icon: 'payments' },
    { id: 'high_risk_sell_4', name: '闇取引 極', description: '売却価格5倍 & 失敗時に全額没収', effect: { type: 'high_risk_sell', priceMult: 5, penaltyRate: 1 }, price: 50000, tier: 4, group: '商売グループ', icon: 'payments' },
    { id: 'catch_rate_1', name: 'キャッチ率UP I', description: '捕獲確率+5%', effect: { type: 'catch_boost', value: 0.05 }, price: 500, tier: 1, group: '捕獲グループ', icon: 'phishing' },
    { id: 'catch_rate_2', name: 'キャッチ率UP II', description: '捕獲確率+15%', effect: { type: 'catch_boost', value: 0.15 }, price: 2000, tier: 2, group: '捕獲グループ', icon: 'phishing' },
    { id: 'catch_rate_3', name: 'キャッチ率UP III', description: '捕獲確率+30%', effect: { type: 'catch_boost', value: 0.3 }, price: 6000, tier: 3, group: '捕獲グループ', icon: 'phishing' },
    { id: 'catch_rate_4', name: 'キャッチ率UP 極', description: '捕獲確率+50%', effect: { type: 'catch_boost', value: 0.5 }, price: 18000, tier: 4, group: '捕獲グループ', icon: 'phishing' },
    { id: 'rare_up_1', name: 'レア魚UP I', description: 'レア魚出現率+20%', effect: { type: 'rare_boost', value: 0.2 }, price: 600, tier: 1, group: '探索グループ', icon: 'radar' },
    { id: 'rare_up_2', name: 'レア魚UP II', description: 'レア魚出現率+50%', effect: { type: 'rare_boost', value: 0.5 }, price: 2400, tier: 2, group: '探索グループ', icon: 'radar' },
    { id: 'rare_up_3', name: 'レア魚UP III', description: 'レア魚出現率+100%', effect: { type: 'rare_boost', value: 1 }, price: 10000, tier: 3, group: '探索グループ', icon: 'radar' },
    { id: 'rare_up_4', name: 'レア魚UP 極', description: 'レア魚出現率が3倍', effect: { type: 'rare_boost', value: 3 }, price: 40000, tier: 4, group: '探索グループ', icon: 'radar' },
    { id: 'rank_license_c', name: 'Cランク免許', description: 'Cランク以上の魚しか釣れなくなる', effect: { type: 'rank_sniper', minRarity: 'C' }, price: 2000, tier: 1, group: '探索グループ', icon: 'radar' },
    { id: 'rank_license_b', name: 'Bランク免許', description: 'Bランク以上の魚しか釣れなくなる', effect: { type: 'rank_sniper', minRarity: 'B' }, price: 6000, tier: 2, group: '探索グループ', icon: 'radar' },
    { id: 'rank_license_a', name: 'Aランク免許', description: 'Aランク以上の魚しか釣れなくなる', effect: { type: 'rank_sniper', minRarity: 'A' }, price: 20000, tier: 3, group: '探索グループ', icon: 'radar' },
    { id: 'rank_license_s', name: 'Sランク免許', description: 'Sランク以上の魚しか釣れなくなる', effect: { type: 'rank_sniper', minRarity: 'S' }, price: 100000, tier: 4, group: '探索グループ', icon: 'radar' },
    { id: 'rank_collector_c', name: 'Cランク愛好家', description: 'Cランクの魚が釣れやすくなる', effect: { type: 'rank_collector', targetRarity: 'C' }, price: 2000, tier: 1, group: '探索グループ', icon: 'radar' },
    { id: 'rank_collector_b', name: 'Bランク愛好家', description: 'Bランクの魚が釣れやすくなる', effect: { type: 'rank_collector', targetRarity: 'B' }, price: 6000, tier: 2, group: '探索グループ', icon: 'radar' },
    { id: 'rank_collector_a', name: 'Aランク愛好家', description: 'Aランクの魚が釣れやすくなる', effect: { type: 'rank_collector', targetRarity: 'A' }, price: 20000, tier: 3, group: '探索グループ', icon: 'radar' },
    { id: 'rank_collector_s', name: 'Sランク愛好家', description: 'Sランクの魚が釣れやすくなる', effect: { type: 'rank_collector', targetRarity: 'S' }, price: 100000, tier: 4, group: '探索グループ', icon: 'radar' },
    { id: 'moon_rare_up_1', name: '月光の導き I', description: '月の加護装備時のみレア魚率+20%', effect: { type: 'moon_rare_up', value: 0.2 }, price: 3000, tier: 1, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'moon_rare_up_2', name: '月光の導き II', description: '月の加護装備時のみレア魚率+40%', effect: { type: 'moon_rare_up', value: 0.4 }, price: 10000, tier: 2, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'moon_rare_up_3', name: '月光の導き III', description: '月の加護装備時のみレア魚率+70%', effect: { type: 'moon_rare_up', value: 0.7 }, price: 40000, tier: 3, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'moon_rare_up_4', name: '月光の導き 極', description: '月の加護装備時のみレア魚出現率が2倍', effect: { type: 'moon_rare_up', value: 2, multiplier: true }, price: 120000, tier: 4, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'sun_chest_up_1', name: '太陽の恵み I', description: '太陽の加護装備時のみ宝箱率+5%', effect: { type: 'sun_chest_up', value: 0.05 }, price: 3000, tier: 1, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'sun_chest_up_2', name: '太陽の恵み II', description: '太陽の加護装備時のみ宝箱率+15%', effect: { type: 'sun_chest_up', value: 0.15 }, price: 10000, tier: 2, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'sun_chest_up_3', name: '太陽の恵み III', description: '太陽の加護装備時のみ宝箱率+40%', effect: { type: 'sun_chest_up', value: 0.4 }, price: 40000, tier: 3, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'sun_chest_up_4', name: '太陽の恵み 極', description: '太陽の加護装備時のみ宝箱出現率が3倍', effect: { type: 'sun_chest_up', value: 3, multiplier: true }, price: 120000, tier: 4, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'nibble_fix_1', name: '予兆察知 I', description: 'ウキの揺れが常に3回になる', effect: { type: 'nibble_fix', value: 3 }, price: 400, tier: 1, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'nibble_fix_2', name: '予兆察知 II', description: 'ウキの揺れが常に2回になる', effect: { type: 'nibble_fix', value: 2 }, price: 1200, tier: 2, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'nibble_fix_3', name: '予兆察知 III', description: 'ウキの揺れが常に1回になる', effect: { type: 'nibble_fix', value: 1 }, price: 4000, tier: 3, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'nibble_fix_4', name: '予兆察知 極', description: '即ヒット（ウキが揺れずに沈む）', effect: { type: 'nibble_fix', value: 0 }, price: 20000, tier: 4, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'concentration_1', name: '集中力 I', description: 'HIT受付時間をベースの1.5倍に延長', effect: { type: 'hit_window_mult', value: 1.5 }, price: 300, tier: 1, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'concentration_2', name: '集中力 II', description: 'HIT受付時間をベースの2倍に延長', effect: { type: 'hit_window_mult', value: 2 }, price: 1200, tier: 2, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'concentration_3', name: '集中力 III', description: 'HIT受付時間をベースの3倍に延長', effect: { type: 'hit_window_mult', value: 3 }, price: 5000, tier: 3, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'concentration_4', name: '集中力 極', description: 'HIT受付時間をベースの5倍に延長', effect: { type: 'hit_window_mult', value: 5 }, price: 20000, tier: 4, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'patience_1', name: '忍耐力 I', description: '待ち時間を10%短縮', effect: { type: 'wait_time_reduction', value: 0.1 }, price: 400, tier: 1, group: '強化グループ', icon: 'bolt' },
    { id: 'patience_2', name: '忍耐力 II', description: '待ち時間を25%短縮', effect: { type: 'wait_time_reduction', value: 0.25 }, price: 1500, tier: 2, group: '強化グループ', icon: 'bolt' },
    { id: 'patience_3', name: '忍耐力 III', description: '待ち時間を40%短縮', effect: { type: 'wait_time_reduction', value: 0.4 }, price: 4000, tier: 3, group: '強化グループ', icon: 'bolt' },
    { id: 'patience_4', name: '忍耐力 極', description: '待ち時間を60%短縮', effect: { type: 'wait_time_reduction', value: 0.6 }, price: 15000, tier: 4, group: '強化グループ', icon: 'bolt' },
    { id: 'quick_hit_penalty_1', name: '早打ち I', description: 'ヒット待ち-15% & 売却価格-10%', effect: { type: 'quick_hit_penalty', waitReduc: 0.15, priceReduc: 0.1 }, price: 1000, tier: 1, group: '強化グループ', icon: 'bolt' },
    { id: 'quick_hit_penalty_2', name: '早打ち II', description: 'ヒット待ち-30% & 売却価格-20%', effect: { type: 'quick_hit_penalty', waitReduc: 0.3, priceReduc: 0.2 }, price: 3000, tier: 2, group: '強化グループ', icon: 'bolt' },
    { id: 'quick_hit_penalty_3', name: '早打ち III', description: 'ヒット待ち-50% & 売却価格-40%', effect: { type: 'quick_hit_penalty', waitReduc: 0.5, priceReduc: 0.4 }, price: 8000, tier: 3, group: '強化グループ', icon: 'bolt' },
    { id: 'quick_hit_penalty_4', name: '早打ち 極', description: 'ヒット待ち-75% & 売却価格-60%', effect: { type: 'quick_hit_penalty', waitReduc: 0.75, priceReduc: 0.6 }, price: 25000, tier: 4, group: '強化グループ', icon: 'bolt' },
    { id: 'bait_master_1', name: '餌の達人 I', description: '釣り成功時、15%で餌を消費しない', effect: { type: 'bait_save', value: 0.15 }, price: 500, tier: 1, group: '便利グループ', icon: 'build' },
    { id: 'bait_master_2', name: '餌の達人 II', description: '釣り成功時、30%で餌を消費しない', effect: { type: 'bait_save', value: 0.3 }, price: 2000, tier: 2, group: '便利グループ', icon: 'build' },
    { id: 'bait_master_3', name: '餌の達人 III', description: '釣り成功時、50%で餌を消費しない', effect: { type: 'bait_save', value: 0.5 }, price: 6000, tier: 3, group: '便利グループ', icon: 'build' },
    { id: 'bait_master_4', name: '餌の達人 極', description: '釣り成功時、75%で餌を消費しない', effect: { type: 'bait_save', value: 0.75 }, price: 25000, tier: 4, group: '便利グループ', icon: 'build' },
    { id: 'technician_1', name: 'テクニシャン I', description: '赤ゾーンの幅が20%拡大', effect: { type: 'red_zone_boost', value: 0.2 }, price: 600, tier: 1, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'technician_2', name: 'テクニシャン II', description: '赤ゾーンの幅が40%拡大', effect: { type: 'red_zone_boost', value: 0.4 }, price: 2500, tier: 2, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'technician_3', name: 'テクニシャン III', description: '赤ゾーンの幅が60%拡大', effect: { type: 'red_zone_boost', value: 0.6 }, price: 7000, tier: 3, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'technician_4', name: 'テクニシャン 極', description: '赤ゾーンの幅が100%拡大', effect: { type: 'red_zone_boost', value: 1 }, price: 25000, tier: 4, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'second_chance_1', name: '起死回生 I', description: '白ゾーンでの失敗時、10%で成功扱い', effect: { type: 'second_chance', value: 0.1 }, price: 800, tier: 1, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'second_chance_2', name: '起死回生 II', description: '白ゾーンでの失敗時、20%で成功扱い', effect: { type: 'second_chance', value: 0.2 }, price: 3000, tier: 2, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'second_chance_3', name: '起死回生 III', description: '白ゾーンでの失敗時、35%で成功扱い', effect: { type: 'second_chance', value: 0.35 }, price: 8000, tier: 3, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'second_chance_4', name: '起死回生 極', description: '白ゾーンでの失敗時、50%で成功扱い', effect: { type: 'second_chance', value: 0.5 }, price: 30000, tier: 4, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'appraisal_1', name: '鑑定眼 I', description: '称号付きの出現確率が2倍', effect: { type: 'title_boost', value: 2 }, price: 1000, tier: 1, group: '探索グループ', icon: 'radar' },
    { id: 'appraisal_2', name: '鑑定眼 II', description: '称号付きの出現確率が3倍', effect: { type: 'title_boost', value: 3 }, price: 3500, tier: 2, group: '探索グループ', icon: 'radar' },
    { id: 'appraisal_3', name: '鑑定眼 III', description: '称号付きの出現確率が4倍', effect: { type: 'title_boost', value: 4 }, price: 9000, tier: 3, group: '探索グループ', icon: 'radar' },
    { id: 'appraisal_4', name: '鑑定眼 極', description: '称号付きの出現確率が6倍', effect: { type: 'title_boost', value: 6 }, price: 35000, tier: 4, group: '探索グループ', icon: 'radar' },
    { id: 'big_game_hunter_1', name: '大物狙い I', description: '上位ランクの出現率が1.5倍', effect: { type: 'big_game_boost', value: 1.5 }, price: 1200, tier: 1, group: '探索グループ', icon: 'radar' },
    { id: 'big_game_hunter_2', name: '大物狙い II', description: '上位ランクの出現率が2.5倍', effect: { type: 'big_game_boost', value: 2.5 }, price: 4500, tier: 2, group: '探索グループ', icon: 'radar' },
    { id: 'big_game_hunter_3', name: '大物狙い III', description: '上位ランクの出現率が5.0倍', effect: { type: 'big_game_boost', value: 5 }, price: 12000, tier: 3, group: '探索グループ', icon: 'radar' },
    { id: 'big_game_hunter_4', name: '大物狙い 極', description: '上位ランクの出現率が10倍', effect: { type: 'big_game_boost', value: 10 }, price: 45000, tier: 4, group: '探索グループ', icon: 'radar' },
    { id: 'treasure_hunter_1', name: 'トレジャーハンター I', description: '宝箱出現率 +2%', effect: { type: 'treasure_boost', value: 0.02 }, price: 1500, tier: 1, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'treasure_hunter_2', name: 'トレジャーハンター II', description: '宝箱出現率 +5%', effect: { type: 'treasure_boost', value: 0.05 }, price: 5000, tier: 2, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'treasure_hunter_3', name: 'トレジャーハンター III', description: '宝箱出現率 +10%', effect: { type: 'treasure_boost', value: 0.1 }, price: 15000, tier: 3, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'treasure_hunter_4', name: 'トレジャーハンター 極', description: '宝箱出現率 +20%', effect: { type: 'treasure_boost', value: 0.2 }, price: 50000, tier: 4, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'fortune_hunter_1', name: 'フォーチュンハンター I', description: '宝箱報酬量 +20%', effect: { type: 'treasure_quantity', value: 0.2 }, price: 3000, tier: 1, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'fortune_hunter_2', name: 'フォーチュンハンター II', description: '宝箱報酬量 +50%', effect: { type: 'treasure_quantity', value: 0.5 }, price: 10000, tier: 2, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'fortune_hunter_3', name: 'フォーチュンハンター III', description: '宝箱報酬量 +100%', effect: { type: 'treasure_quantity', value: 1 }, price: 30000, tier: 3, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'fortune_hunter_4', name: 'フォーチュンハンター 極', description: '宝箱報酬量 +200%', effect: { type: 'treasure_quantity', value: 2 }, price: 80000, tier: 4, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'luxury_hunter_1', name: 'ラグジュアリーハンター I', description: '宝箱報酬質UP(小)', effect: { type: 'treasure_quality', value: 1.2 }, price: 5000, tier: 1, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'luxury_hunter_2', name: 'ラグジュアリーハンター II', description: '宝箱報酬質UP(中)', effect: { type: 'treasure_quality', value: 1.5 }, price: 20000, tier: 2, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'luxury_hunter_3', name: 'ラグジュアリーハンター III', description: '宝箱報酬質UP(大)', effect: { type: 'treasure_quality', value: 2 }, price: 50000, tier: 3, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'luxury_hunter_4', name: 'ラグジュアリーハンター 極', description: '宝箱報酬質UP(特大)', effect: { type: 'treasure_quality', value: 3 }, price: 150000, tier: 4, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'passion_1', name: '情熱 I', description: 'フィーバーゲージ蓄積率 +5%', effect: { type: 'fever_charge', value: 0.05 }, price: 2000, tier: 1, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'passion_2', name: '情熱 II', description: 'フィーバーゲージ蓄積率 +10%', effect: { type: 'fever_charge', value: 0.1 }, price: 8000, tier: 2, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'passion_3', name: '情熱 III', description: 'フィーバーゲージ蓄積率 +15%', effect: { type: 'fever_charge', value: 0.15 }, price: 25000, tier: 3, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'passion_4', name: '情熱 極', description: 'フィーバーゲージ蓄積率 +25%', effect: { type: 'fever_charge', value: 0.25 }, price: 60000, tier: 4, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'mania_1', name: '熱狂 I', description: 'フィーバー終了確率 -10%', effect: { type: 'fever_long', value: 0.1 }, price: 3000, tier: 1, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'mania_2', name: '熱狂 II', description: 'フィーバー終了確率 -20%', effect: { type: 'fever_long', value: 0.2 }, price: 12000, tier: 2, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'mania_3', name: '熱狂 III', description: 'フィーバー終了確率 -30%', effect: { type: 'fever_long', value: 0.3 }, price: 40000, tier: 3, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'mania_4', name: '熱狂 極', description: 'フィーバー終了確率 -50%', effect: { type: 'fever_long', value: 0.5 }, price: 100000, tier: 4, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'fever_bias_sun_1', name: '太陽の加護 I', description: 'おたからフィーバー確率 +10%', effect: { type: 'fever_bias_sun', value: 0.1 }, price: 5000, tier: 1, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'fever_bias_sun_2', name: '太陽の加護 II', description: 'おたからフィーバー確率 +20%', effect: { type: 'fever_bias_sun', value: 0.2 }, price: 15000, tier: 2, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'fever_bias_sun_3', name: '太陽の加護 III', description: 'おたからフィーバー確率 +35%', effect: { type: 'fever_bias_sun', value: 0.35 }, price: 50000, tier: 3, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'fever_bias_sun_4', name: '太陽の加護 極', description: 'おたからフィーバー確率 +60%', effect: { type: 'fever_bias_sun', value: 0.6 }, price: 150000, tier: 4, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'fever_bias_moon_1', name: '月の加護 I', description: 'おさかなフィーバー確率 +10%', effect: { type: 'fever_bias_moon', value: 0.1 }, price: 5000, tier: 1, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'fever_bias_moon_2', name: '月の加護 II', description: 'おさかなフィーバー確率 +20%', effect: { type: 'fever_bias_moon', value: 0.2 }, price: 15000, tier: 2, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'fever_bias_moon_3', name: '月の加護 III', description: 'おさかなフィーバー確率 +35%', effect: { type: 'fever_bias_moon', value: 0.35 }, price: 50000, tier: 3, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'fever_bias_moon_4', name: '月の加護 極', description: 'おさかなフィーバー確率 +60%', effect: { type: 'fever_bias_moon', value: 0.6 }, price: 150000, tier: 4, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'fever_treasure_boost_1', name: 'フィーバーリッチ I', description: 'フィーバー中の宝箱出現率 +10%', effect: { type: 'fever_treasure_boost', value: 0.1 }, price: 2000, tier: 1, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'fever_treasure_boost_2', name: 'フィーバーリッチ II', description: 'フィーバー中の宝箱出現率 +20%', effect: { type: 'fever_treasure_boost', value: 0.2 }, price: 8000, tier: 2, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'fever_treasure_boost_3', name: 'フィーバーリッチ III', description: 'フィーバー中の宝箱出現率 +35%', effect: { type: 'fever_treasure_boost', value: 0.35 }, price: 25000, tier: 3, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'fever_treasure_boost_4', name: 'フィーバーリッチ 極', description: 'フィーバー中の宝箱出現率 +60%', effect: { type: 'fever_treasure_boost', value: 0.6 }, price: 70000, tier: 4, group: '特殊効果グループ', icon: 'auto_awesome' },
    { id: 'perfect_master_1', name: '達人の針 I', description: 'ゲージ赤ゾーン停止時、捕獲率が50%になる', effect: { type: 'perfect_catch', value: 0.5 }, price: 5000, tier: 1, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'perfect_master_2', name: '達人の針 II', description: 'ゲージ赤ゾーン停止時、捕獲率が75%になる', effect: { type: 'perfect_catch', value: 0.75 }, price: 20000, tier: 2, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'perfect_master_3', name: '達人の針 III', description: 'ゲージ赤ゾーン停止時、捕獲率が100%になる', effect: { type: 'perfect_catch', value: 1 }, price: 100000, tier: 3, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'perfect_master_4', name: '達人の針 極', description: '赤ゾーン停止時100%捕獲 & 赤ゾーン幅+40%', effect: { type: 'perfect_catch', value: 1, extraRedZone: 0.4 }, price: 250000, tier: 4, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'dual_catcher_1', name: 'ダブルキャッチ I', description: '20%の確率で魚が2匹釣れる', effect: { type: 'multi_catch_2', value: 0.2 }, price: 3000, tier: 1, group: '捕獲グループ', icon: 'phishing' },
    { id: 'dual_catcher_2', name: 'ダブルキャッチ II', description: '35%の確率で魚が2匹釣れる', effect: { type: 'multi_catch_2', value: 0.35 }, price: 10000, tier: 2, group: '捕獲グループ', icon: 'phishing' },
    { id: 'dual_catcher_3', name: 'ダブルキャッチ III', description: '50%の確率で魚が2匹釣れる', effect: { type: 'multi_catch_2', value: 0.5 }, price: 30000, tier: 3, group: '捕獲グループ', icon: 'phishing' },
    { id: 'dual_catcher_4', name: 'ダブルキャッチ 極', description: '80%の確率で魚が2匹釣れる', effect: { type: 'multi_catch_2', value: 0.8 }, price: 80000, tier: 4, group: '捕獲グループ', icon: 'phishing' },
    { id: 'triple_catcher_1', name: 'トリプルキャッチ I', description: '5%の確率で魚が3匹釣れる', effect: { type: 'multi_catch_3', value: 0.05 }, price: 5000, tier: 1, group: '捕獲グループ', icon: 'phishing' },
    { id: 'triple_catcher_2', name: 'トリプルキャッチ II', description: '10%の確率で魚が3匹釣れる', effect: { type: 'multi_catch_3', value: 0.1 }, price: 20000, tier: 2, group: '捕獲グループ', icon: 'phishing' },
    { id: 'triple_catcher_3', name: 'トリプルキャッチ III', description: '20%の確率で魚が3匹釣れる', effect: { type: 'multi_catch_3', value: 0.2 }, price: 50000, tier: 3, group: '捕獲グループ', icon: 'phishing' },
    { id: 'triple_catcher_4', name: 'トリプルキャッチ 極', description: '40%の確率で魚が3匹釣れる', effect: { type: 'multi_catch_3', value: 0.4 }, price: 120000, tier: 4, group: '捕獲グループ', icon: 'phishing' },
    { id: 'amplifier_1', name: '増幅の心得 I', description: '他のスキル効果を1.2倍にする', effect: { type: 'skill_amplifier', value: 0.2 }, price: 5000, tier: 1, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'amplifier_2', name: '増幅の心得 II', description: '他のスキル効果を1.35倍にする', effect: { type: 'skill_amplifier', value: 0.35 }, price: 15000, tier: 2, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'amplifier_3', name: '増幅の心得 III', description: '他のスキル効果を1.5倍にする', effect: { type: 'skill_amplifier', value: 0.5 }, price: 40000, tier: 3, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'amplifier_4', name: '増幅の心得 極', description: '他のスキル効果を2倍にする', effect: { type: 'skill_amplifier', value: 1 }, price: 150000, tier: 4, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'ship_interval_down_1', name: '高速エンジン I', description: '漁獲間隔を10%短縮', effect: { type: 'ship_interval_down', value: 0.1 }, price: 5000, tier: 1, group: '便利グループ', icon: 'build' },
    { id: 'ship_interval_down_2', name: '高速エンジン II', description: '漁獲間隔を25%短縮', effect: { type: 'ship_interval_down', value: 0.25 }, price: 20000, tier: 2, group: '便利グループ', icon: 'build' },
    { id: 'ship_interval_down_3', name: '高速エンジン III', description: '漁獲間隔を45%短縮', effect: { type: 'ship_interval_down', value: 0.45 }, price: 60000, tier: 3, group: '便利グループ', icon: 'build' },
    { id: 'ship_interval_down_4', name: '高速エンジン 極', description: '漁獲間隔を70%短縮', effect: { type: 'ship_interval_down', value: 0.7 }, price: 180000, tier: 4, group: '便利グループ', icon: 'build' },
    { id: 'ship_amount_up_1', name: '大型網 I', description: '一度の漁獲量 +1〜2匹', effect: { type: 'ship_amount_up', min: 1, max: 2 }, price: 6000, tier: 1, group: '便利グループ', icon: 'build' },
    { id: 'ship_amount_up_2', name: '大型網 II', description: '一度の漁獲量 +3〜5匹', effect: { type: 'ship_amount_up', min: 3, max: 5 }, price: 25000, tier: 2, group: '便利グループ', icon: 'build' },
    { id: 'ship_amount_up_3', name: '大型網 III', description: '一度の漁獲量 +6〜10匹', effect: { type: 'ship_amount_up', min: 6, max: 10 }, price: 80000, tier: 3, group: '便利グループ', icon: 'build' },
    { id: 'ship_amount_up_4', name: '大型網 極', description: '一度の漁獲量 +15〜25匹', effect: { type: 'ship_amount_up', min: 15, max: 25 }, price: 250000, tier: 4, group: '便利グループ', icon: 'build' },
    { id: 'ship_fuel_eco_1', name: 'エコ航行 I', description: '20%の確率で燃料消費を回避', effect: { type: 'ship_fuel_eco', value: 0.2 }, price: 4000, tier: 1, group: '便利グループ', icon: 'build' },
    { id: 'ship_fuel_eco_2', name: 'エコ航行 II', description: '40%の確率で燃料消費を回避', effect: { type: 'ship_fuel_eco', value: 0.4 }, price: 15000, tier: 2, group: '便利グループ', icon: 'build' },
    { id: 'ship_fuel_eco_3', name: 'エコ航行 III', description: '60%の確率で燃料消費を回避', effect: { type: 'ship_fuel_eco', value: 0.6 }, price: 45000, tier: 3, group: '便利グループ', icon: 'build' },
    { id: 'ship_fuel_eco_4', name: 'エコ航行 極', description: '90%の確率で燃料消費を回避', effect: { type: 'ship_fuel_eco', value: 0.9 }, price: 150000, tier: 4, group: '便利グループ', icon: 'build' },
    { id: 'ship_fuel_discount_1', name: '港の顔馴染み I', description: '燃料購入価格 15%割引', effect: { type: 'ship_fuel_discount', value: 0.15 }, price: 3000, tier: 1, group: '商売グループ', icon: 'payments' },
    { id: 'ship_fuel_discount_2', name: '港の顔馴染み II', description: '燃料購入価格 30%割引', effect: { type: 'ship_fuel_discount', value: 0.3 }, price: 10000, tier: 2, group: '商売グループ', icon: 'payments' },
    { id: 'ship_fuel_discount_3', name: '港の顔馴染み III', description: '燃料購入価格 50%割引', effect: { type: 'ship_fuel_discount', value: 0.5 }, price: 30000, tier: 3, group: '商売グループ', icon: 'payments' },
    { id: 'ship_fuel_discount_4', name: '港の顔馴染み 極', description: '燃料購入価格 80%割引', effect: { type: 'ship_fuel_discount', value: 0.8 }, price: 100000, tier: 4, group: '商売グループ', icon: 'payments' },
    { id: 'sailor_intuition_1', name: '船乗りの勘 I', description: 'ボートイベント出現率 +5%', effect: { type: 'boat_event_boost', value: 0.05 }, price: 2000, tier: 1, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'sailor_intuition_2', name: '船乗りの勘 II', description: 'ボートイベント出現率 +10%', effect: { type: 'boat_event_boost', value: 0.1 }, price: 8000, tier: 2, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'sailor_intuition_3', name: '船乗りの勘 III', description: 'ボートイベント出現率 +15%', effect: { type: 'boat_event_boost', value: 0.15 }, price: 25000, tier: 3, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'sailor_intuition_4', name: '船乗りの勘 極', description: 'ボートイベント出現率 +30%', effect: { type: 'boat_event_boost', value: 0.3 }, price: 80000, tier: 4, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'bird_watcher_1', name: 'バードウォッチャー I', description: '鳥イベント出現率 +5%', effect: { type: 'bird_event_boost', value: 0.05 }, price: 2000, tier: 1, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'bird_watcher_2', name: 'バードウォッチャー II', description: '鳥イベント出現率 +10%', effect: { type: 'bird_event_boost', value: 0.1 }, price: 8000, tier: 2, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'bird_watcher_3', name: 'バードウォッチャー III', description: '鳥イベント出現率 +15%', effect: { type: 'bird_event_boost', value: 0.15 }, price: 25000, tier: 3, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'bird_watcher_4', name: 'バードウォッチャー 極', description: '鳥イベント出現率 +30%', effect: { type: 'bird_event_boost', value: 0.3 }, price: 80000, tier: 4, group: '宝物グループ', icon: 'card_giftcard' },
    { id: 'stoic_1', name: 'ストイック I', description: '獲得経験値 +20% & コイン -10%', effect: { type: 'stoic', exp: 0.2, coin: -0.1 }, price: 1500, tier: 1, group: '成長グループ', icon: 'trending_up' },
    { id: 'stoic_2', name: 'ストイック II', description: '獲得経験値 +50% & コイン -20%', effect: { type: 'stoic', exp: 0.5, coin: -0.2 }, price: 6000, tier: 2, group: '成長グループ', icon: 'trending_up' },
    { id: 'stoic_3', name: 'ストイック III', description: '獲得経験値 +100% & コイン -40%', effect: { type: 'stoic', exp: 1, coin: -0.4 }, price: 20000, tier: 3, group: '成長グループ', icon: 'trending_up' },
    { id: 'stoic_4', name: 'ストイック 極', description: '獲得経験値 +200% & コイン -60%', effect: { type: 'stoic', exp: 2, coin: -0.6 }, price: 60000, tier: 4, group: '成長グループ', icon: 'trending_up' },
    { id: 'casual_fisher_1', name: 'カジュアル I', description: '放置コイン獲得率 +20%', effect: { type: 'log_coin_boost', value: 0.2 }, price: 1000, tier: 1, group: '成長グループ', icon: 'trending_up' },
    { id: 'casual_fisher_2', name: 'カジュアル II', description: '放置コイン獲得率 +50%', effect: { type: 'log_coin_boost', value: 0.5 }, price: 4000, tier: 2, group: '成長グループ', icon: 'trending_up' },
    { id: 'casual_fisher_3', name: 'カジュアル III', description: '放置コイン獲得率 +100%', effect: { type: 'log_coin_boost', value: 1 }, price: 12000, tier: 3, group: '成長グループ', icon: 'trending_up' },
    { id: 'casual_fisher_4', name: 'カジュアル 極', description: '放置コイン獲得率 +200%', effect: { type: 'log_coin_boost', value: 2 }, price: 40000, tier: 4, group: '成長グループ', icon: 'trending_up' },
    { id: 'mission_reward_up_1', name: '報酬アップ I', description: 'ミッション報酬 +50%', effect: { type: 'mission_reward_up', value: 0.5 }, price: 800, tier: 1, group: '成長グループ', icon: 'trending_up' },
    { id: 'mission_reward_up_2', name: '報酬アップ II', description: 'ミッション報酬 +100%', effect: { type: 'mission_reward_up', value: 1 }, price: 4000, tier: 2, group: '成長グループ', icon: 'trending_up' },
    { id: 'mission_reward_up_3', name: '報酬アップ III', description: 'ミッション報酬 +200%', effect: { type: 'mission_reward_up', value: 2 }, price: 15000, tier: 3, group: '成長グループ', icon: 'trending_up' },
    { id: 'mission_reward_up_4', name: '報酬アップ 極', description: 'ミッション報酬 +400% (5倍)', effect: { type: 'mission_reward_up', value: 4 }, price: 50000, tier: 4, group: '成長グループ', icon: 'trending_up' },
    { id: 'gacha_mission_up_1', name: 'ガチャの使命 I', description: '報酬がガチャチケのミッション率 +20%', effect: { type: 'gacha_mission_boost', value: 0.2 }, price: 4000, tier: 1, group: '成長グループ', icon: 'trending_up' },
    { id: 'gacha_mission_up_2', name: 'ガチャの使命 II', description: '報酬がガチャチケのミッション率 +50%', effect: { type: 'gacha_mission_boost', value: 0.5 }, price: 15000, tier: 2, group: '成長グループ', icon: 'trending_up' },
    { id: 'gacha_mission_up_3', name: 'ガチャの使命 III', description: '報酬がガチャチケのミッション率 +100%', effect: { type: 'gacha_mission_boost', value: 1 }, price: 40000, tier: 3, group: '成長グループ', icon: 'trending_up' },
    { id: 'gacha_mission_up_4', name: 'ガチャの使命 極', description: '報酬がガチャチケのミッション率 +200%', effect: { type: 'gacha_mission_boost', value: 2 }, price: 120000, tier: 4, group: '成長グループ', icon: 'trending_up' },
    { id: 'recycle_boost_1', name: 'リサイクル強化 I', description: 'リサイクルの必要スキル数 -1', effect: { type: 'recycle_boost', costReduction: 1 }, price: 2000, tier: 1, group: '便利グループ', icon: 'build' },
    { id: 'recycle_boost_2', name: 'リサイクル強化 II', description: 'リサイクルの必要スキル数 -2', effect: { type: 'recycle_boost', costReduction: 2 }, price: 8000, tier: 2, group: '便利グループ', icon: 'build' },
    { id: 'recycle_boost_3', name: 'リサイクル強化 III', description: 'リサイクル時の獲得スキル数 +1', effect: { type: 'recycle_boost', gainBonus: 1 }, price: 25000, tier: 3, group: '便利グループ', icon: 'build' },
    { id: 'recycle_boost_4', name: 'リサイクル強化 極', description: 'リサイクル必要数-3 & 獲得数+2', effect: { type: 'recycle_boost', costReduction: 3, gainBonus: 2 }, price: 80000, tier: 4, group: '便利グループ', icon: 'build' },
    { id: 'auto_hit_1', name: '自動合わせ I', description: 'ウキ沈下時に15%で自動ヒット', effect: { type: 'auto_hit', chance: 0.15 }, price: 2000, tier: 1, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'auto_hit_2', name: '自動合わせ II', description: 'ウキ沈下時に30%で自動ヒット', effect: { type: 'auto_hit', chance: 0.3 }, price: 8000, tier: 2, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'auto_hit_3', name: '自動合わせ III', description: 'ウキ沈下時に50%で自動ヒット', effect: { type: 'auto_hit', chance: 0.5 }, price: 25000, tier: 3, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'auto_hit_4', name: '自動合わせ 極', description: 'ウキ沈下時に80%で自動ヒット', effect: { type: 'auto_hit', chance: 0.8 }, price: 80000, tier: 4, group: '技術グループ', icon: 'precision_manufacturing' },
    { id: 'shop_discount_1', name: 'ショップ割引 I', description: 'ショップのアイテム価格 -10%', effect: { type: 'shop_discount', value: 0.1 }, price: 5000, tier: 1, group: '商売グループ', icon: 'payments' },
    { id: 'shop_discount_2', name: 'ショップ割引 II', description: 'ショップのアイテム価格 -20%', effect: { type: 'shop_discount', value: 0.2 }, price: 20000, tier: 2, group: '商売グループ', icon: 'payments' },
    { id: 'shop_discount_3', name: 'ショップ割引 III', description: 'ショップのアイテム価格 -30%', effect: { type: 'shop_discount', value: 0.3 }, price: 60000, tier: 3, group: '商売グループ', icon: 'payments' },
    { id: 'shop_discount_4', name: 'ショップ割引 極', description: 'ショップのアイテム価格 -50%', effect: { type: 'shop_discount', value: 0.5 }, price: 180000, tier: 4, group: '商売グループ', icon: 'payments' },
    { id: 'upgrade_discount_1', name: '強化割引 I', description: 'ロッド強化費用 -10%', effect: { type: 'upgrade_discount', value: 0.1 }, price: 8000, tier: 1, group: '商売グループ', icon: 'payments' },
    { id: 'upgrade_discount_2', name: '強化割引 II', description: 'ロッド強化費用 -20%', effect: { type: 'upgrade_discount', value: 0.2 }, price: 30000, tier: 2, group: '商売グループ', icon: 'payments' },
    { id: 'upgrade_discount_3', name: '強化割引 III', description: 'ロッド強化費用 -30%', effect: { type: 'upgrade_discount', value: 0.3 }, price: 100000, tier: 3, group: '商売グループ', icon: 'payments' },
    { id: 'upgrade_discount_4', name: '強化割引 極', description: 'ロッド強化費用 -50%', effect: { type: 'upgrade_discount', value: 0.5 }, price: 300000, tier: 4, group: '商売グループ', icon: 'payments' },
    { id: 'count_fish_gacha_2', name: '魚の知識 II', description: '所持魚10個につき追加ガチャチケ +0.5', effect: { type: 'count_fish_gacha', value: 0.05 }, price: 15000, tier: 2, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_fish_gacha_3', name: '魚の知識 III', description: '所持魚10個につき追加ガチャチケ +1.0', effect: { type: 'count_fish_gacha', value: 0.1 }, price: 40000, tier: 3, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_fish_gacha_4', name: '魚の知識 極', description: '所持魚10個につき追加ガチャチケ +2.0', effect: { type: 'count_fish_gacha', value: 0.2 }, price: 120000, tier: 4, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_gacha_coin_1', name: 'チケットの重み I', description: '所持チケット10枚につき追加コイン +10%', effect: { type: 'count_gacha_coin', value: 0.01 }, price: 4000, tier: 1, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_gacha_coin_2', name: 'チケットの重み II', description: '所持チケット10枚につき追加コイン +25%', effect: { type: 'count_gacha_coin', value: 0.025 }, price: 15000, tier: 2, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_gacha_coin_3', name: 'チケットの重み III', description: '所持チケット10枚につき追加コイン +50%', effect: { type: 'count_gacha_coin', value: 0.05 }, price: 40000, tier: 3, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_gacha_coin_4', name: 'チケットの重み 極', description: '所持チケット10枚につき追加コイン +100%', effect: { type: 'count_gacha_coin', value: 0.1 }, price: 120000, tier: 4, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_fish_title_1', name: '称号への関心 I', description: '所持魚10個につき称号率 +0.5%', effect: { type: 'count_fish_title', value: 0.0005 }, price: 4000, tier: 1, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_fish_title_2', name: '称号への関心 II', description: '所持魚10個につき称号率 +1.5%', effect: { type: 'count_fish_title', value: 0.0015 }, price: 15000, tier: 2, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_fish_title_3', name: '称号への関心 III', description: '所持魚10個につき称号率 +3.0%', effect: { type: 'count_fish_title', value: 0.003 }, price: 40000, tier: 3, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_fish_title_4', name: '称号への関心 極', description: '所持魚10個につき称号率 +6.0%', effect: { type: 'count_fish_title', value: 0.006 }, price: 120000, tier: 4, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_skill_power_1', name: 'マナの共鳴 I', description: '所持スキル数に応じてパワーUP(小)', effect: { type: 'count_skill_power', value: 0.5 }, price: 3000, tier: 1, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_skill_power_2', name: 'マナの共鳴 II', description: '所持スキル数に応じてパワーUP(中)', effect: { type: 'count_skill_power', value: 1 }, price: 12000, tier: 2, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_skill_power_3', name: 'マナの共鳴 III', description: '所持スキル数に応じてパワーUP(大)', effect: { type: 'count_skill_power', value: 2 }, price: 40000, tier: 3, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_skill_power_4', name: 'マナの共鳴 極', description: '所持スキル数に応じてパワーUP(超)', effect: { type: 'count_skill_power', value: 3.5 }, price: 60000, tier: 4, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_gacha_sell_1', name: '券の価値 I', description: '所持ガチャチケ数に応じて売却価格UP(小)', effect: { type: 'count_gacha_sell', value: 0.05 }, price: 3000, tier: 1, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_gacha_sell_2', name: '券の価値 II', description: '所持ガチャチケ数に応じて売却価格UP(中)', effect: { type: 'count_gacha_sell', value: 0.1 }, price: 12000, tier: 2, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_gacha_sell_3', name: '券の価値 III', description: '所持ガチャチケ数に応じて売却価格UP(大)', effect: { type: 'count_gacha_sell', value: 0.2 }, price: 40000, tier: 3, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'count_gacha_sell_4', name: '券の価値 極', description: '所持ガチャチケ数に応じて売却価格UP(超)', effect: { type: 'count_gacha_sell', value: 0.35 }, price: 60000, tier: 4, group: '収集ボーナス', icon: 'inventory_2' },
    { id: 'slot_expansion_1', name: '拡張モジュール I', description: 'スキルスロット数 +1', effect: { type: 'skill_slot_expansion', value: 1 }, price: 5000, tier: 1, group: '便利グループ', icon: 'build' },
    { id: 'slot_expansion_2', name: '拡張モジュール II', description: 'スキルスロット数 +2', effect: { type: 'skill_slot_expansion', value: 2 }, price: 20000, tier: 2, group: '便利グループ', icon: 'build' },
    { id: 'slot_expansion_3', name: '拡張モジュール III', description: 'スキルスロット数 +3', effect: { type: 'skill_slot_expansion', value: 3 }, price: 50000, tier: 3, group: '便利グループ', icon: 'build' },
    { id: 'slot_expansion_4', name: '拡張モジュール 極', description: 'スキルスロット数 +5', effect: { type: 'skill_slot_expansion', value: 5 }, price: 120000, tier: 4, group: '便利グループ', icon: 'build' },
    { id: 'master_needle', name: '達人の針', description: 'ゲージ赤ゾーンで停止時、捕獲率が100%になる', effect: { type: 'master_needle' }, price: 150000, tier: 0, group: '特殊スキル', icon: 'workspace_premium' },
    { id: 'mobile_shop', name: '出張売店', description: '釣り上げ成功時に自動で魚を売却する', effect: { type: 'mobile_shop' }, price: 150000, tier: 0, group: '特殊スキル', icon: 'workspace_premium' },
    { id: 'master_angler_special', name: '太公望', description: '釣果が常に2倍になり、ドロップ獲得量も2倍になる', effect: { type: 'master_angler_special' }, price: 250000, tier: 0, group: '特殊スキル', icon: 'workspace_premium' },
    { id: 'eternal_mania', name: '永遠の熱狂', description: 'フィーバー終了時にゲージが4溜まった状態になる', effect: { type: 'eternal_mania' }, price: 200000, tier: 0, group: '特殊スキル', icon: 'workspace_premium' },
    { id: 'cosmic_blessing', name: '宇宙の加護', description: 'フィーバー中、30%の確率でゲージがLv6にリセットされる', effect: { type: 'cosmic_blessing' }, price: 250000, tier: 0, group: '特殊スキル', icon: 'workspace_premium' },
    { id: 'rank_sniper_c', name: 'Cランクスナイパー', description: 'Cランクの魚しか釣れなくなる', effect: { type: 'rank_sniper_fixed', rank: 'C' }, price: 120000, tier: 0, group: '特殊スキル', icon: 'workspace_premium' },
    { id: 'rank_sniper_b', name: 'Bランクスナイパー', description: 'Bランクの魚しか釣れなくなる', effect: { type: 'rank_sniper_fixed', rank: 'B' }, price: 150000, tier: 0, group: '特殊スキル', icon: 'workspace_premium' },
    { id: 'rank_sniper_a', name: 'Aランクスナイパー', description: 'Aランクの魚しか釣れなくなる', effect: { type: 'rank_sniper_fixed', rank: 'A' }, price: 200000, tier: 0, group: '特殊スキル', icon: 'workspace_premium' },
    { id: 'rank_sniper_s', name: 'Sランクスナイパー', description: 'Sランクの魚しか釣れなくなる', effect: { type: 'rank_sniper_fixed', rank: 'S' }, price: 300000, tier: 0, group: '特殊スキル', icon: 'workspace_premium' },
    { id: 'infinite_bait', name: '無限餌', description: '釣り時に餌を消費しなくなる', effect: { type: 'infinite_bait' }, price: 250000, tier: 0, group: '特殊スキル', icon: 'workspace_premium' },
    { id: 'good_feel', name: '手応え', description: 'パワー2倍 & ガチャチケットのドロップを確定させる', effect: { type: 'good_feel' }, price: 200000, tier: 0, group: '特殊スキル', icon: 'workspace_premium' },
    { id: 'hard_mode', name: 'ハードモード', description: 'パワー5倍 & 魚の売却額8倍', effect: { type: 'hard_mode' }, price: 500000, tier: 0, group: '特殊スキル', icon: 'workspace_premium' },
    { id: 'perpetual_engine', name: '永久機関', description: '船の燃料を消費しなくなる', effect: { type: 'perpetual_engine' }, price: 300000, tier: 0, group: '特殊スキル', icon: 'workspace_premium' },
    { id: 'magnet', name: 'マグネット', description: '宝箱の抽選から木の宝箱を除外する', effect: { type: 'magnet' }, price: 200000, tier: 0, group: '特殊スキル', icon: 'workspace_premium' },
    { id: 'xp_boost_1', name: '経験値アップ I', description: '獲得経験値 +10%', effect: { type: 'xp_boost', value: 0.1 }, price: 2000, tier: 1, group: '成長グループ', icon: 'trending_up' },
    { id: 'xp_boost_2', name: '経験値アップ II', description: '獲得経験値 +20%', effect: { type: 'xp_boost', value: 0.2 }, price: 8000, tier: 2, group: '成長グループ', icon: 'trending_up' },
    { id: 'xp_boost_3', name: '経験値アップ III', description: '獲得経験値 +50%', effect: { type: 'xp_boost', value: 0.5 }, price: 25000, tier: 3, group: '成長グループ', icon: 'trending_up' },
    { id: 'xp_boost_4', name: '経験値アップ 極', description: '獲得経験値 +100%', effect: { type: 'xp_boost', value: 1 }, price: 80000, tier: 4, group: '成長グループ', icon: 'trending_up' },
    { id: 'rank_power_boost_1', name: 'ランク熟練 I', description: 'ランクによるパワーボーナス +50%', effect: { type: 'rank_power_boost', value: 0.5 }, price: 5000, tier: 1, group: '成長グループ', icon: 'trending_up' },
    { id: 'rank_power_boost_2', name: 'ランク熟練 II', description: 'ランクによるパワーボーナス +100%', effect: { type: 'rank_power_boost', value: 1 }, price: 15000, tier: 2, group: '成長グループ', icon: 'trending_up' },
    { id: 'rank_power_boost_3', name: 'ランク熟練 III', description: 'ランクによるパワーボーナス +200%', effect: { type: 'rank_power_boost', value: 2 }, price: 50000, tier: 3, group: '成長グループ', icon: 'trending_up' },
    { id: 'rank_power_boost_4', name: 'ランク熟練 極', description: 'ランクによるパワーボーナス +400%', effect: { type: 'rank_power_boost', value: 4 }, price: 150000, tier: 4, group: '成長グループ', icon: 'trending_up' },
    { id: 'rank_reward_boost_1', name: '栄光の報酬 I', description: 'ランクアップ報酬 5倍', effect: { type: 'rank_reward_boost', value: 5 }, price: 20000, tier: 1, group: '成長グループ', icon: 'trending_up' },
    { id: 'rank_reward_boost_2', name: '栄光の報酬 II', description: 'ランクアップ報酬 10倍', effect: { type: 'rank_reward_boost', value: 10 }, price: 80000, tier: 2, group: '成長グループ', icon: 'trending_up' },
    { id: 'rank_reward_boost_3', name: '栄光の報酬 III', description: 'ランクアップ報酬 20倍', effect: { type: 'rank_reward_boost', value: 20 }, price: 250000, tier: 3, group: '成長グループ', icon: 'trending_up' },
    { id: 'rank_reward_boost_4', name: '栄光の報酬 極', description: 'ランクアップ報酬 50倍', effect: { type: 'rank_reward_boost', value: 50 }, price: 1000000, tier: 4, group: '成長グループ', icon: 'trending_up' },
];

/**
 * 特殊合成レシピ (Special Synthesis Recipes)
 * キー: 素材AのベースID + '+' + 素材BのベースID (アルファベット順)
 * 値: 生成される特殊スキルのベースID
 */
const SPECIAL_RECIPES = {
    'power_up+gauge_slow': 'master_needle',
    'price_up+high_risk_sell': 'mobile_shop',
    'catch_rate+technician': 'master_angler_special',
    'passion+mania': 'eternal_mania',
    'fever_bias_sun+fever_bias_moon': 'cosmic_blessing',
    'rank_license_c+rank_collector_c': 'rank_sniper_c',
    'rank_license_b+rank_collector_b': 'rank_sniper_b',
    'rank_license_a+rank_collector_a': 'rank_sniper_a',
    'rank_license_s+rank_collector_s': 'rank_sniper_s',
    'bait_master+fever_bias_sun': 'infinite_bait',
    'overdrive+fever_bias_moon': 'good_feel',
    'amplifier+high_risk_sell': 'hard_mode',
    'bait_master+ship_fuel_eco': 'perpetual_engine',
    'treasure_hunter+treasure_hunter': 'magnet'
};

// ========================================
// 餌データ
// ========================================
const BAITS = [
    {
        id: 'bait_d',
        name: 'Dランクの餌',
        rank: 'D',
        description: '基本の餌。Dランクが釣れやすい。釣れても消費されない。',
        price: 0,
        quantity: 1
    },
    {
        id: 'bait_c',
        name: 'Cランクの餌',
        rank: 'C',
        description: 'Cランクが釣れやすい。失敗しても消費されない。',
        price: 50,
        quantity: 5
    },
    {
        id: 'bait_b',
        name: 'Bランクの餌',
        rank: 'B',
        description: 'Bランクが釣れやすい。失敗しても消費されない。',
        price: 200,
        quantity: 5
    },
    {
        id: 'bait_a',
        name: 'Aランクの餌',
        rank: 'A',
        description: 'Aランクが釣れやすい。釣れなくても消費される。',
        price: 800,
        quantity: 5
    },
    {
        id: 'bait_s',
        name: 'Sランクの餌',
        rank: 'S',
        description: 'Sランクが釣れやすい。釣れなくても消費される。',
        price: 3000,
        quantity: 5
    }
];



// ========================================
// スキン（着せ替え）データ
// ========================================
const SKINS = [
    // ロッドアンロック系 (Shop/Unlock)
    {
        id: 'skin_default',
        name: 'ノーマル',
        rodColor: '#8B4513',
        bobberColor: '#ff0000',
        rodId: 'wooden_rod',
        description: '標準的な釣竿とウキのセット',
        tier: 1
    },
    {
        id: 'skin_bamboo',
        name: 'バンブー',
        rodColor: '#6B8E23',
        bobberColor: '#ADFF2F',
        rodId: 'bamboo_rod',
        description: '自然を感じる竹の色合い',
        tier: 1
    },
    {
        id: 'skin_carbon',
        name: 'カーボン',
        rodColor: '#2F4F4F',
        bobberColor: '#00CED1',
        rodId: 'carbon_rod',
        description: 'クールな黒と未来的な青',
        tier: 2
    },
    {
        id: 'skin_titanium',
        name: 'チタン',
        rodColor: '#C0C0C0',
        bobberColor: '#FFD700',
        rodId: 'titanium_rod',
        description: '高級感あふれる金属光沢',
        tier: 3
    },
    {
        id: 'skin_legendary',
        name: 'レジェンド',
        rodColor: '#800080',
        bobberColor: '#FF00FF',
        rodId: 'legendary_rod',
        description: '伝説の釣り人に相応しい神秘的な色',
        tier: 3
    },

    // ガチャ限定スキン
    {
        id: 'skin_neon',
        name: 'ネオンライト',
        rodColor: '#00ff00',
        bobberColor: '#ff00ff',
        description: '夜に輝くネオンカラー',
        tier: 2,
        isGachaExclusive: true
    },
    {
        id: 'skin_gold_rush',
        name: 'ゴールドラッシュ',
        rodColor: '#FFD700',
        bobberColor: '#DAA520',
        description: '全身が黄金に輝く成金仕様',
        tier: 3,
        isGachaExclusive: true
    },
    {
        id: 'skin_void',
        name: 'ヴォイド',
        rodColor: '#000000',
        bobberColor: '#4B0082',
        description: '光を吸収する漆黒のロッド',
        tier: 3,
        isGachaExclusive: true
    },
    {
        id: 'skin_cherry',
        name: '桜まつり',
        rodColor: '#FFB7C5',
        bobberColor: '#FF69B4',
        description: '春を感じさせる桜色',
        tier: 1,
        isGachaExclusive: true
    }
];
// ========================================
const GAUGE_CONFIG = {
    // ゲージの基本速度（ピクセル/フレーム）
    baseSpeed: 1.5,
    // パワー差による速度調整（差が小さいほど遅くなる）
    speedMultiplierMin: 1.0,
    speedMultiplierMax: 2.0,

    // ゾーンの幅（%）
    zones: {
        red: { width: 10, catchRate: { min: 0.8, max: 1.0 } },    // 大成功
        green: { width: 15, catchRate: { min: 0.4, max: 0.6 } },  // 成功
        white: { width: 75, catchRate: { min: 0.1, max: 0.2 } }   // 普通
    },

    // パワー差による赤ゾーン幅の調整
    redZoneWidthMin: 5,
    redZoneWidthMax: 20
};

// ========================================
// 釣りサイクル設定
// ========================================
const FISHING_CONFIG = {
    // ウキが揺れるまでの待機時間（ミリ秒）
    waitTimeMin: 2000,
    waitTimeMax: 6000,

    // 予兆（ウキ揺れ）の設定
    nibbleCountMin: 1,
    nibbleCountMax: 3,
    nibbleIntervalMin: 500,  // 0.5秒
    nibbleIntervalMax: 1500, // 1.5秒
    nibbleShakeDuration: 200, // 1回の揺れにかかる時間（ミリ秒）

    // ヒット判定可能時間（ミリ秒）
    hitWindowTime: 600,
    hitWindowByRarity: {
        D: 800,
        C: 600,
        B: 500,
        A: 400,
        S: 350
    },

    // ヒットを逃した場合のペナルティ時間（ミリ秒）
    missedPenalty: 500
};

// ========================================
// レア度別の出現重み調整
// ========================================
// ========================================
// レア度別の出現重み調整 (ベース)
// ========================================
const RARITY_WEIGHTS = {
    D: 1.0,
    C: 0.3,
    B: 0.1,
    A: 0.03,
    S: 0.01,
    SS: 0.005
};

// ========================================
// ガチャ設定
// ========================================
const GACHA_CONFIG = {
    BRONZE: { single: 1000, ten: 9000, ticket: 1, rates: { tier1: 85, tier2: 14, tier3: 1, special: 0 } },
    SILVER: { single: 8000, ten: 72000, ticket: 8, rates: { tier1: 15, tier2: 75, tier3: 10, special: 0.1 } },
    GOLD: { single: 30000, ten: 250000, ticket: 30, rates: { tier1: 0, tier2: 20, tier3: 75, special: 5 } }
};

// ========================================
// リサイクルガチャ（エコ・ボックス）出現率
// ========================================
const RECYCLE_RATES = {
    tier1: 40,
    tier2: 50,
    tier3: 9,
    tier4: 1 // 実質Tier 3 (special)
};

// ========================================
// 宝箱設定
// ========================================
const TREASURE_CONFIG = {
    baseChance: 0.05, // 5%の確率で出現
    rarityWeights: {
        WOOD: 0.7,   // 木: 70% (D相当)
        SILVER: 0.25, // 銀: 25% (B相当)
        GOLD: 0.05    // 金: 5% (S相当)
    },
    chestData: {
        WOOD: { name: '木の宝箱', power: 30, rarity: 'D', icon: 'inventory_2', description: '古びた木製の宝箱。中身は...' },
        SILVER: { name: '銀の宝箱', power: 80, rarity: 'B', icon: 'lock', description: '装飾が施された銀色の宝箱。期待できそう。' },
        GOLD: { name: '金の宝箱', power: 150, rarity: 'S', icon: 'diamond', description: '眩い輝きを放つ純金の宝箱。最高のお宝が入っているかも！' }
    },
    lootTables: {
        WOOD: {
            money: { min: 100, max: 500 },
            baits: [
                { id: 'bait_c', min: 1, max: 3, weight: 0.8 },
                { id: 'bait_b', min: 1, max: 1, weight: 0.2 }
            ],
            skills: [
                { tier: 1, chance: 0.15 } // 15%でTier1スキル
            ]
        },
        SILVER: {
            money: { min: 1000, max: 3000 },
            baits: [
                { id: 'bait_b', min: 2, max: 5, weight: 0.6 },
                { id: 'bait_a', min: 1, max: 2, weight: 0.4 }
            ],
            skills: [
                { tier: 1, chance: 0.2 }, // 20%でTier1スキル
                { tier: 2, chance: 0.15 } // 15%でTier2スキル
            ]
        },
        GOLD: {
            money: { min: 5000, max: 15000 },
            baits: [
                { id: 'bait_s', min: 1, max: 3, weight: 1.0 }
            ],
            skills: [
                { tier: 2, chance: 0.4 }, // 40%でTier2スキル
                { tier: 3, chance: 0.2 }  // 20%でTier3スキル
            ]
        }
    }
};


// ========================================
// 空（背景）データ
// ========================================
const SKIES = [
    {
        id: 'sky_default',
        name: '青空',
        price: 0,
        description: 'いつもの爽やかな青空',
        colors: ['#87CEEB', '#7dd3fc']
    },
    {
        id: 'sky_sunset',
        name: '夕焼け',
        price: 5000,
        colors: ['#ff7e5f', '#feb47b'],
        description: 'ロマンチックな夕暮れ',
        tier: 2
    },
    {
        id: 'sky_night',
        name: '星空',
        price: 15000,
        colors: ['#0f2027', '#203a43'],
        description: '静寂に包まれた夜',
        tier: 2
    },
    {
        id: 'sky_aurora',
        name: 'オーロラ',
        price: 50000,
        colors: ['#1e1b4b', '#22d3ee'],
        description: '幻想的な北国の空',
        tier: 3
    },

    // ガチャ限定
    {
        id: 'sky_galaxy',
        name: '銀河',
        colors: ['#2c3e50', '#4ca1af'],
        description: '宇宙の広がりを感じる',
        tier: 3,
        isGachaExclusive: true
    },
    {
        id: 'sky_storm',
        name: '嵐',
        colors: ['#373B44', '#4286f4'],
        description: '荒れ狂う嵐の空',
        tier: 2,
        isGachaExclusive: true
    },
    {
        id: 'sky_cherry',
        name: '桜空',
        colors: ['#ffe259', '#ffa751'],
        description: '舞い散る花びら',
        tier: 1,
        isGachaExclusive: true
    }
];

// ========================================
// 港（Port）データ - 漁船
// ========================================
const SHIPS = [
    {
        id: 'ship_small',
        name: '小型漁船',
        price: 10000,
        capacity: 20,
        catchAmountRange: [1, 3],
        maxRarity: 'C',
        description: '近海漁業用の小型船。小回りが利く。',
        description: '近海漁業用の小型船。小回りが利く。',
        fishingInterval: 300000, // 5分
        fuelConsumption: 1 // 1分あたりの燃料消費量
    },
    {
        id: 'ship_medium',
        name: '中型漁船',
        price: 100000,
        capacity: 50,
        catchAmountRange: [4, 8],
        maxRarity: 'B',
        description: '多少の荒波にも耐える中型船。',
        description: '多少の荒波にも耐える中型船。',
        fishingInterval: 300000, // 5分
        fuelConsumption: 2 // 1分あたりの燃料消費量
    },
    {
        id: 'ship_large',
        name: '大型漁船',
        price: 500000,
        capacity: 150,
        catchAmountRange: [10, 20],
        maxRarity: 'S',
        description: '遠洋漁業も可能な大型船。大量の魚を積載可能。',
        description: '遠洋漁業も可能な大型船。大量の魚を積載可能。',
        fishingInterval: 300000, // 5分
        fuelConsumption: 3 // 1分あたりの燃料消費量
    }
];

// ========================================
// 港（Port）データ - 燃料
// ========================================
const FUELS = [
    {
        id: 'fuel_regular',
        name: 'レギュラー燃料',
        recovery: 30, // 30分回復
        price: 500
    },
    {
        id: 'fuel_high',
        name: 'ハイオク燃料',
        recovery: 60, // 60分回復
        price: 1200
    },
    {
        id: 'fuel_max',
        name: 'マックス燃料',
        recovery: 180, // 180分(3時間)回復
        price: 5000
    }
];

// エクスポート用（グローバル変数として使用）
if (typeof window !== 'undefined') {
    window.GAME_DATA = {
        RODS,
        FISH,
        SKILLS,
        BAITS,
        GAUGE_CONFIG,
        FISHING_CONFIG,
        RARITY_WEIGHTS,
        TITLE_CONFIG,
        GACHA_CONFIG,
        RECYCLE_RATES,
        TREASURE_CONFIG,
        SKINS,
        SKIES,
        SHIPS,
        FUELS,
        SPECIAL_RECIPES,
        RANK_SYSTEM
    };
}
