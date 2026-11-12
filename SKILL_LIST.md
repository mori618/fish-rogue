# スキル一覧表

ゲーム内に登場する全スキルの詳細データ一覧です。

## パワーアップ系 (Power Up)
釣りパワーを底上げし、魚のHPを削りやすくします。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `power_up_1` | パワーUP I | 1 | 200 | 釣りパワー+5 | `power_boost`: +5 |
| `power_up_2` | パワーUP II | 2 | 800 | 釣りパワー+15 | `power_boost`: +15 |
| `power_up_3` | パワーUP III | 3 | 2,500 | 釣りパワー+30 | `power_boost`: +30 |

## ゲージ減速系 (Gauge Slow)
釣りゲージの移動速度を遅くし、制御しやすくします。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `gauge_slow_1` | ゲージ減速 I | 1 | 300 | ゲージ速度-10% | `gauge_slow`: -10% |
| `gauge_slow_2` | ゲージ減速 II | 2 | 1,000 | ゲージ速度-20% | `gauge_slow`: -20% |

## 価格アップ系 (Price Up)
魚を売却する際の価格を上昇させます。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `price_up_1` | 売値UP I | 1 | 400 | 魚の売却価格+10% | `price_boost`: +10% |
| `price_up_2` | 売値UP II | 2 | 1,500 | 魚の売却価格+25% | `price_boost`: +25% |

## 成功率アップ系 (Catch Rate)
ゲージバトルでの捕獲成功確率（基礎成功率）を上げます。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `catch_rate_1` | キャッチ率UP I | 1 | 500 | 捕獲確率+5% | `catch_boost`: +5% |
| `catch_rate_2` | キャッチ率UP II | 2 | 2,000 | 捕獲確率+15% | `catch_boost`: +15% |

## レア度アップ系 (Rare Up)
レアな魚が出現する確率を上げます。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `rare_up_1` | レア魚UP I | 1 | 600 | レア魚出現率+20% | `rare_boost`: +20% |

## ユーティリティ系
釣りを快適にする様々な補助スキルです。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `nibble_fix` | 予兆察知 | 2 | 1,200 | ウキの揺れが常に2回になる | `nibble_fix`: 2回固定 |
| `technician_1` | テクニシャン I | 1 | 600 | 赤ゾーンの幅が20%拡大 | `red_zone_boost`: +20% |
| `technician_2` | テクニシャン II | 2 | 2,500 | 赤ゾーンの幅が40%拡大 | `red_zone_boost`: +40% |
| `technician_3` | テクニシャン III | 3 | 7,000 | 赤ゾーンの幅が60%拡大 | `red_zone_boost`: +60% |

## 集中力 (Concentration)
HIT受付時間（ウキが沈んでから逃げるまでの時間）を延長します。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `concentration_1` | 集中力 I | 1 | 300 | HIT受付時間を1.5倍に延長 | `hit_window_mult`: x1.5 |
| `concentration_2` | 集中力 II | 2 | 1,200 | HIT受付時間を2倍に延長 | `hit_window_mult`: x2.0 |
| `concentration_3` | 集中力 III | 3 | 5,000 | HIT受付時間を3倍に延長 | `hit_window_mult`: x3.0 |

## 忍耐力 (Patience)
魚がかかるまでの待ち時間を短縮します。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `patience_1` | 忍耐力 I | 1 | 400 | 待ち時間を10%短縮 | `wait_time_reduction`: -10% |
| `patience_2` | 忍耐力 II | 2 | 1,500 | 待ち時間を25%短縮 | `wait_time_reduction`: -25% |
| `patience_3` | 忍耐力 III | 3 | 4,000 | 待ち時間を40%短縮 | `wait_time_reduction`: -40% |

## 餌の達人 (Bait Master)
釣り成功時に餌を消費しない確率（エコ率）を上げます。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `bait_master_1` | 餌の達人 I | 1 | 500 | 15%の確率で餌を消費しない | `bait_save`: 15% |
| `bait_master_2` | 餌の達人 II | 2 | 2,000 | 30%の確率で餌を消費しない | `bait_save`: 30% |
| `bait_master_3` | 餌の達人 III | 3 | 6,000 | 50%の確率で餌を消費しない | `bait_save`: 50% |

## 起死回生 (Second Chance)
失敗（白ゾーン停止）時に、確率で成功扱いに逆転します。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `second_chance_1` | 起死回生 I | 1 | 800 | 失敗時 10%で成功 | `second_chance`: 10% |
| `second_chance_2` | 起死回生 II | 2 | 3,000 | 失敗時 20%で成功 | `second_chance`: 20% |
| `second_chance_3` | 起死回生 III | 3 | 8,000 | 失敗時 35%で成功 | `second_chance`: 35% |

## 鑑定眼 (Appraisal)
称号付き（高額売却）の魚が出現する確率を上げます。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `appraisal_1` | 鑑定眼 I | 1 | 1,000 | 称号出現率 2倍 | `title_boost`: x2 |
| `appraisal_2` | 鑑定眼 II | 2 | 3,500 | 称号出現率 3倍 | `title_boost`: x3 |
| `appraisal_3` | 鑑定眼 III | 3 | 9,000 | 称号出現率 4倍 | `title_boost`: x4 |

## 大物狙い (Big Game Hunter)
ランクの高い魚が出現する確率（重み）を上げます。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `big_game_hunter_1` | 大物狙い I | 1 | 1,200 | 上位ランク率 小UP | `big_game_boost`: x1.5 |
| `big_game_hunter_2` | 大物狙い II | 2 | 4,500 | 上位ランク率 UP | `big_game_boost`: x2.5 |
| `big_game_hunter_3` | 大物狙い III | 3 | 12,000 | 上位ランク率 大幅UP | `big_game_boost`: x5.0 |

## トレジャーハンター (Treasure Hunter)
宝箱が出現する確率を上げます。（ベース確率は5%）

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `treasure_hunter_1` | トレジャーハンター I | 1 | 1,500 | 宝箱出現率 +2% | `treasure_boost`: +2% |
| `treasure_hunter_2` | トレジャーハンター II | 2 | 5,000 | 宝箱出現率 +5% | `treasure_boost`: +5% |
| `treasure_hunter_3` | トレジャーハンター III | 3 | 15,000 | 宝箱出現率 +10% | `treasure_boost`: +10% |

## フォーチュン・ラグジュアリー (Treasure Quality/Quantity)
宝箱の中身を強化します。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `fortune_hunter_1` | フォーチュンハンター I | 1 | 3,000 | 報酬量 +20% | `treasure_quantity`: +20% |
| `fortune_hunter_2` | フォーチュンハンター II | 2 | 10,000 | 報酬量 +50% | `treasure_quantity`: +50% |
| `fortune_hunter_3` | フォーチュンハンター III | 3 | 30,000 | 報酬量 +100% | `treasure_quantity`: +100% |
| `luxury_hunter_1` | ラグジュアリーハンター I | 1 | 5,000 | 報酬の質 小UP | `treasure_quality`: x1.2 |
| `luxury_hunter_2` | ラグジュアリーハンター II | 2 | 20,000 | 報酬の質 中UP | `treasure_quality`: x1.5 |
| `luxury_hunter_3` | ラグジュアリーハンター III | 3 | 50,000 | 報酬の質 大UP | `treasure_quality`: x2.0 |

## フィーバー系 (Passion / Mania)
フィーバーモードに関連するスキルです。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `passion_1` | 情熱 I | 1 | 2,000 | ゲージ蓄積 +5% | `fever_charge`: +5% |
| `passion_2` | 情熱 II | 2 | 8,000 | ゲージ蓄積 +10% | `fever_charge`: +10% |
| `passion_3` | 情熱 III | 3 | 25,000 | ゲージ蓄積 +15% | `fever_charge`: +15% |
| `mania_1` | 熱狂 I | 1 | 3,000 | フィーバー終了率 -10% | `fever_long`: -10% |
| `mania_2` | 熱狂 II | 2 | 12,000 | フィーバー終了率 -20% | `fever_long`: -20% |
| `mania_3` | 熱狂 III | 3 | 40,000 | フィーバー終了率 -30% | `fever_long`: -30% |

## 加護系 (Blessing)
特定のフィーバータイプが出やすくなります。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `fever_bias_sun_1` | 太陽の加護 I | 1 | 2,000 | おたからフィーバー率 +10% | `fever_bias_sun`: +10% |
| `fever_bias_sun_2` | 太陽の加護 II | 2 | 8,000 | おたからフィーバー率 +20% | `fever_bias_sun`: +20% |
| `fever_bias_sun_3` | 太陽の加護 III | 3 | 25,000 | おたからフィーバー率 +35% | `fever_bias_sun`: +35% |
| `fever_bias_sun_4` | 太陽の加護 極 | 4 | 80,000 | おたからフィーバー率 +60% | `fever_bias_sun`: +60% |
| `fever_bias_moon_1` | 月の加護 I | 1 | 2,000 | おさかなフィーバー率 +10% | `fever_bias_moon`: +10% |
| `fever_bias_moon_2` | 月の加護 II | 2 | 8,000 | おさかなフィーバー率 +20% | `fever_bias_moon`: +20% |
| `fever_bias_moon_3` | 月の加護 III | 3 | 25,000 | おさかなフィーバー率 +35% | `fever_bias_moon`: +35% |
| `fever_bias_moon_4` | 月の加護 極 | 4 | 80,000 | おさかなフィーバー率 +60% | `fever_bias_moon`: +60% |

## 特殊効果系 (Unique)

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `perfect_master_1` | 達人の針 I | 3 | 100,000 | 赤ゾーン停止で捕獲率100% | `perfect_catch`: 100%確定 |
| `sailor_intuition_1` | 船乗りの勘 I | 1 | 2,000 | 船イベント率 +5% | `boat_event_boost`: +5% |
| `sailor_intuition_2` | 船乗りの勘 II | 2 | 8,000 | 船イベント率 +10% | `boat_event_boost`: +10% |
| `sailor_intuition_3` | 船乗りの勘 III | 3 | 25,000 | 船イベント率 +15% | `boat_event_boost`: +15% |
| `bird_watcher_1` | バードウォッチャー I | 1 | 2,000 | 鳥イベント率 +5% | `bird_event_boost`: +5% |
| `bird_watcher_2` | バードウォッチャー II | 2 | 8,000 | 鳥イベント率 +10% | `bird_event_boost`: +10% |
| `bird_watcher_3` | バードウォッチャー III | 3 | 25,000 | 鳥イベント率 +15% | `bird_event_boost`: +15% |

## マルチキャッチ系 (Multi Catch)
一度に複数の魚が釣れるようになります。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `dual_catcher_1` | ダブルキャッチ I | 1 | 3,000 | 10%で2匹釣り | `multi_catch_2`: 10% |
| `dual_catcher_2` | ダブルキャッチ II | 2 | 10,000 | 25%で2匹釣り | `multi_catch_2`: 25% |
| `dual_catcher_3` | ダブルキャッチ III | 3 | 30,000 | 50%で2匹釣り | `multi_catch_2`: 50% |
| `triple_catcher_1` | トリプルキャッチ I | 1 | 5,000 | 5%で3匹釣り | `multi_catch_3`: 5% |
| `triple_catcher_2` | トリプルキャッチ II | 2 | 20,000 | 10%で3匹釣り | `multi_catch_3`: 10% |
| `triple_catcher_3` | トリプルキャッチ III | 3 | 50,000 | 20%で3匹釣り | `multi_catch_3`: 20% |
| `multi_catch_prob_1` | 群れ追い I | 1 | 2,000 | 複数釣り確率 +10% | `multi_catch_prob`: +10% |
| `multi_catch_prob_2` | 群れ追い II | 2 | 8,000 | 複数釣り確率 +20% | `multi_catch_prob`: +20% |
| `multi_catch_num_1` | 大量捕獲 I | 1 | 5,000 | 複数釣り数 +1 | `multi_catch_num`: +1匹 |
| `multi_catch_num_2` | 大量捕獲 II | 2 | 20,000 | 複数釣り数 +2 | `multi_catch_num`: +2匹 |

## 港・航海系 (Port & Ship)
漁船の操業に関連するスキルです。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `ship_interval_down_1` | 高速エンジン I | 1 | 5,000 | 漁獲間隔 -10% | `ship_interval_down`: -10% |
| `ship_interval_down_2` | 高速エンジン II | 2 | 20,000 | 漁獲間隔 -25% | `ship_interval_down`: -25% |
| `ship_interval_down_3` | 高速エンジン III | 3 | 60,000 | 漁獲間隔 -45% | `ship_interval_down`: -45% |
| `ship_amount_up_1` | 大型網 I | 1 | 6,000 | 漁獲量 +1〜2匹 | `ship_amount_up`: +1~2 |
| `ship_amount_up_2` | 大型網 II | 2 | 25,000 | 漁獲量 +3〜5匹 | `ship_amount_up`: +3~5 |
| `ship_amount_up_3` | 大型網 III | 3 | 80,000 | 漁獲量 +6〜10匹 | `ship_amount_up`: +6~10 |
| `ship_fuel_eco_1` | エコ航行 I | 1 | 4,000 | 20%で燃料消費なし | `ship_fuel_eco`: 20% |
| `ship_fuel_eco_2` | エコ航行 II | 2 | 15,000 | 40%で燃料消費なし | `ship_fuel_eco`: 40% |
| `ship_fuel_eco_3` | エコ航行 III | 3 | 45,000 | 60%で燃料消費なし | `ship_fuel_eco`: 60% |
| `ship_fuel_discount_1` | 港の顔馴染み I | 1 | 3,000 | 燃料費 15%割引 | `ship_fuel_discount`: 15%OFF |
| `ship_fuel_discount_2` | 港の顔馴染み II | 2 | 10,000 | 燃料費 30%割引 | `ship_fuel_discount`: 30%OFF |
| `ship_fuel_discount_3` | 港の顔馴染み III | 3 | 30,000 | 燃料費 50%割引 | `ship_fuel_discount`: 50%OFF |

## ミッション・報酬強化系 (Mission & Reward)

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `amplifier_1` | 増幅の心得 I | 1 | 5,000 | 他スキル効果 x1.2 | `skill_amplifier`: +20% |
| `amplifier_2` | 増幅の心得 II | 2 | 15,000 | 他スキル効果 x1.35 | `skill_amplifier`: +35% |
| `amplifier_3` | 増幅の心得 III | 3 | 40,000 | 他スキル効果 x1.5 | `skill_amplifier`: +50% |
| `client_connection_1` | 依頼人のコネ I | 1 | 3,000 | ミッション報酬 x1.5 | `mission_reward`: x1.5 |
| `client_connection_2` | 依頼人のコネ II | 2 | 10,000 | ミッション報酬 x1.75 | `mission_reward`: x1.75 |
| `client_connection_3` | 依頼人のコネ III | 3 | 30,000 | ミッション報酬 x2.0 | `mission_reward`: x2.0 |
| `stoic_1` | ストイック I | 1 | 5,000 | 目標x2 / 報酬x3 | `stoic`: x2 target, x3 rwd |
| `stoic_2` | ストイック II | 2 | 15,000 | 目標x3 / 報酬x5 | `stoic`: x3 target, x5 rwd |
| `stoic_3` | ストイック III | 3 | 40,000 | 目標x4 / 報酬x8 | `stoic`: x4 target, x8 rwd |
| `casual_fisher_1` | 気楽な釣り人 I | 1 | 2,000 | 目標x0.7 / 報酬x0.7 | `casual`: x0.7 |
| `casual_fisher_2` | 気楽な釣り人 II | 2 | 6,000 | 目標x0.6 / 報酬x0.8 | `casual`: x0.6 |
| `casual_fisher_3` | 気楽な釣り人 III | 3 | 20,000 | 目標x0.5 / 報酬等倍 | `casual`: x0.5 |
| `mission_reward_up_1` | 報酬アップ I | 1 | 500 | ミッション報酬 +20% | `mission_reward_up`: +20% |
| `mission_reward_up_2` | 報酬アップ II | 2 | 2,000 | ミッション報酬 +40% | `mission_reward_up`: +40% |
| `mission_reward_up_3` | 報酬アップ III | 3 | 6,000 | ミッション報酬 +60% | `mission_reward_up`: +60% |
| `gacha_mission_up_1` | チケットハンター I | 1 | 1,000 | チケミッション率 +10% | `gacha_mission_up`: +10% |
| `gacha_mission_up_2` | チケットハンター II | 2 | 3,500 | チケミッション率 +20% | `gacha_mission_up`: +20% |
| `gacha_mission_up_3` | チケットハンター III | 3 | 9,000 | チケミッション率 +30% | `gacha_mission_up`: +30% |

## 免許系 (License)
特定のランク以下の魚が釣れなくなります。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `rank_license_c` | 免許【C級】 | 1 | 2,000 | Cランク以上のみ出現 | `rank_sniper`: Min Rarity C |
| `rank_license_b` | 免許【B級】 | 2 | 6,000 | Bランク以上のみ出現 | `rank_sniper`: Min Rarity B |
| `rank_license_a` | 免許【A級】 | 3 | 20,000 | Aランク以上のみ出現 | `rank_sniper`: Min Rarity A |
| `rank_license_s` | 免許【S級】 | 4 | 60,000 | Sランク以上のみ出現 | `rank_sniper`: Min Rarity S |

## 愛好家系 (Enthusiast)
特定のランクの魚が出現しやすくなります。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `rank_collector_c` | Cランク愛好家 | 1 | 2,000 | Cランク出現率 大幅UP | `rank_collector`: C x10 |
| `rank_collector_b` | Bランク愛好家 | 2 | 6,000 | Bランク出現率 大幅UP | `rank_collector`: B x10 |
| `rank_collector_a` | Aランク愛好家 | 3 | 20,000 | Aランク出現率 大幅UP | `rank_collector`: A x10 |
| `rank_collector_s` | Sランク愛好家 | 4 | 60,000 | Sランク出現率 大幅UP | `rank_collector`: S x10 |

## ペナルティ系 (High Risk)
強力な効果の代わりにペナルティがあります。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `overdrive_2` | オーバードライブ II | 2 | 4,000 | パワー+30% / 速度+10% | `overdrive`: Pow+30%, Spd+10% |
| `overdrive_3` | オーバードライブ III | 3 | 10,000 | パワー+50% / 速度+20% | `overdrive`: Pow+50%, Spd+20% |
| `high_risk_sell_2` | 闇取引 II | 2 | 5,000 | 売値x1.5 / 失敗時ペナ(小) | `high_risk_sell`: x1.5, Pen 10% |
| `high_risk_sell_3` | 闇取引 III | 3 | 15,000 | 売値x3 / 失敗時ペナ(大) | `high_risk_sell`: x3.0, Pen 30% |
| `quick_hit_penalty_2` | 早打ち II | 2 | 3,000 | 待ち-30% / 売値-20% | `quick_hit_penalty`: Wait-30%, Price-20% |
| `quick_hit_penalty_3` | 早打ち III | 3 | 8,000 | 待ち-50% / 売値-40% | `quick_hit_penalty`: Wait-50%, Price-40% |
| `ultimate_risk` | 究極の賭け | 3 | 50,000 | パワー+100% / 失敗時全ロスト | `ultimate_risk`: Pow+100%, Lost All |

## その他便利系 (Misc)

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `auto_hit_2` | 自動合わせ II | 2 | 8,000 | ウキ沈下時 30%で自動ヒット | `auto_hit`: 30% |
| `auto_hit_3` | 自動合わせ III | 3 | 25,000 | ウキ沈下時 50%で自動ヒット | `auto_hit`: 50% |
| `shop_discount_1` | 常連の証 I | 1 | 2,000 | ショップ 5%割引 | `shop_discount`: 5% |
| `shop_discount_2` | 常連の証 II | 2 | 8,000 | ショップ 10%割引 | `shop_discount`: 10% |
| `shop_discount_3` | 常連の証 III | 3 | 30,000 | ショップ 15%割引 | `shop_discount`: 15% |
| `upgrade_discount_1` | 鍛冶屋の友 I | 1 | 2,000 | 強化費 10%軽減 | `upgrade_discount`: 10% |
| `upgrade_discount_2` | 鍛冶屋の友 II | 2 | 8,000 | 強化費 20%軽減 | `upgrade_discount`: 20% |
| `upgrade_discount_3` | 鍛冶屋の友 III | 3 | 30,000 | 強化費 30%軽減 | `upgrade_discount`: 30% |
| `new_fish_finder_1` | 未知への探求 I | 1 | 5,000 | 未登録魚率UP(小) & 待ち+40% | `new_fish_finder`: x1.5, Wait+40% |
| `new_fish_finder_2` | 未知への探求 II | 2 | 15,000 | 未登録魚率UP(中) & 待ち+25% | `new_fish_finder`: x2.0, Wait+25% |
| `new_fish_finder_3` | 未知への探求 III | 3 | 40,000 | 未登録魚率UP(大) & 待ち+10% | `new_fish_finder`: x3.0, Wait+10% |
| `sell_ticket_chance_1` | ラッキーセール I | 1 | 3,000 | 売却時0.5%でチケ | `sell_ticket_chance`: 0.5% |
| `sell_ticket_chance_2` | ラッキーセール II | 2 | 10,000 | 売却時1.0%でチケ | `sell_ticket_chance`: 1.0% |
| `sell_ticket_chance_3` | ラッキーセール III | 3 | 30,000 | 売却時2.0%でチケ | `sell_ticket_chance`: 2.0% |
| `casino_high_roller` | ハイローラー | 3 | 50,000 | カジノ倍率 2倍 | `casino_high_roller`: x2.0 |

## エクストラドロップ系 (Extra Loot)

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `extra_gacha_prob_1` | チケットの釣り人 I | 1 | 3,000 | 魚とチケ釣り +1% | `extra_gacha_prob`: +1% |
| `extra_gacha_prob_2` | チケットの釣り人 II | 2 | 10,000 | 魚とチケ釣り +3% | `extra_gacha_prob`: +3% |
| `extra_gacha_num_1` | チケットボーナス I | 1 | 5,000 | 追加チケ数 +1 | `extra_gacha_num`: +1枚 |
| `extra_gacha_num_2` | チケットボーナス II | 2 | 20,000 | 追加チケ数 +2 | `extra_gacha_num`: +2枚 |
| `extra_coin_prob_1` | 小銭拾い I | 1 | 1,000 | 魚とコイン釣り +10% | `extra_coin_prob`: +10% |
| `extra_coin_prob_2` | 小銭拾い II | 2 | 4,000 | 魚とコイン釣り +25% | `extra_coin_prob`: +25% |
| `extra_coin_amount_1` | 臨時収入 I | 1 | 3,000 | 追加コイン量 +50% | `extra_coin_amount`: +50% |
| `extra_coin_amount_2` | 臨時収入 II | 2 | 10,000 | 追加コイン量 +100% | `extra_coin_amount`: +100% |
| `fever_treasure_boost_2` | フィーバーリッチ II | 2 | 8,000 | フィーバー宝箱中身 +20% | `fever_treasure_boost`: +20% |
| `fever_treasure_boost_3` | フィーバーリッチ III | 3 | 25,000 | フィーバー宝箱中身 +50% | `fever_treasure_boost`: +50% |

## 特別条件系 (Conditional / Collector)
特定の条件や所持数に応じて効果が変動するスキルです。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `moon_rare_up` | 月光の導き | 3 | 40,000 | 月の加護時 レア+40% | `moon_rare_up`: +40% |
| `sun_chest_up` | 太陽の恵み | 3 | 40,000 | 太陽の加護時 宝箱+40% | `sun_chest_up`: +40% |
| `count_skill_multi` | スキルコレクター (連) | 3 | 40,000 | 所持スキル数で複数釣UP | `count_skill_multi`: 係数0.1 |
| `count_fish_gacha` | 魚コレクター (券) | 3 | 40,000 | 所持魚数で追加チケUP | `count_fish_gacha`: 係数0.1 |
| `count_gacha_coin` | チケット長者 (金) | 3 | 40,000 | 所持チケ数で追加コインUP | `count_gacha_coin`: 係数0.1 |
| `count_fish_title` | 魚コレクター (名) | 3 | 40,000 | 所持魚数で称号率UP | `count_fish_title`: 係数0.05 |
| `count_skill_power_1` | マナの共鳴 I | 1 | 3,000 | 所持スキル数でパワーUP(小) | `count_skill_power`: 係数0.5 |
| `count_skill_power_2` | マナの共鳴 II | 2 | 12,000 | 所持スキル数でパワーUP(中) | `count_skill_power`: 係数1.0 |
| `count_skill_power_3` | マナの共鳴 III | 3 | 40,000 | 所持スキル数でパワーUP(大) | `count_skill_power`: 係数2.0 |
| `count_gacha_sell_1` | 券の価値 I | 1 | 3,000 | 所持チケ数で売値UP(小) | `count_gacha_sell`: 係数0.05 |
| `count_gacha_sell_2` | 券の価値 II | 2 | 12,000 | 所持チケ数で売値UP(中) | `count_gacha_sell`: 係数0.1 |
| `count_gacha_sell_3` | 券の価値 III | 3 | 40,000 | 所持チケ数で売値UP(大) | `count_gacha_sell`: 係数0.2 |

## スロット拡張 (Slot Expansion)
宝箱からのみ入手可能な特別スキルです。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `slot_expansion_1` | 拡張モジュール I | 1 | 5,000 | スキルスロット+2 (実質+1) | `skill_slot_expansion`: +2 |
| `slot_expansion_2` | 拡張モジュール II | 2 | 20,000 | スキルスロット+3 (実質+2) | `skill_slot_expansion`: +3 |
| `slot_expansion_3` | 拡張モジュール III | 3 | 50,000 | スキルスロット+4 (実質+3) | `skill_slot_expansion`: +4 |

## ランク関連系 (Rank & XP)
ランクアップや経験値に関連するスキルです。

| ID | 名前 | Tier | 価格 | 説明 | 効果詳細 |
|---|---|---|---|---|---|
| `xp_boost_1` | 経験値アップ I | 1 | 2,000 | 経験値 +10% | `xp_boost`: +10% |
| `xp_boost_2` | 経験値アップ II | 2 | 8,000 | 経験値 +20% | `xp_boost`: +20% |
| `xp_boost_3` | 経験値アップ III | 3 | 25,000 | 経験値 +50% | `xp_boost`: +50% |
| `xp_boost_4` | 知識の探求者 極 | 4 | 80,000 | 経験値 +100% | `xp_boost`: +100% |
| `rank_power_boost_1` | ランク熟練 I | 1 | 5,000 | ランクパワーボーナス +50% | `rank_power_boost`: +50% |
| `rank_power_boost_2` | ランク熟練 II | 2 | 15,000 | ランクパワーボーナス +100% | `rank_power_boost`: +100% |
| `rank_power_boost_3` | ランク熟練 III | 3 | 50,000 | ランクパワーボーナス +200% | `rank_power_boost`: +200% |
| `rank_power_boost_4` | 王者の風格 極 | 4 | 150,000 | ランクパワーボーナス +400% | `rank_power_boost`: +400% |

## 特殊合成スキル (Special Synthesis)
特定のスキル同士を合成することで生まれる、非常に強力なスキルです。Tierは素材と同じになりますが、効果は格段に高まります。

| ID | 名前 | Tier | 説明 | 効果詳細 |
|---|---|---|---|---|
| `master_needle_X` | 達人の針 | 1-4 | 赤ゾーン停止で捕獲率100% | `master_needle` |
| `mobile_shop_X` | 出張売店 | 1-4 | 魚を釣った瞬間に自動売却 | `mobile_shop` |
| `master_angler_special_X` | 太公望 | 1-4 | 常に2匹分釣り上げ & ドロップ2倍 | `master_angler_special` |
| `eternal_mania_X` | 永遠の熱狂 | 1-4 | フィーバー延長 & 終了時ゲージ維持 | `eternal_mania` |
| `cosmic_blessing_X` | 宇宙の加護 | 1-4 | フィーバー中、30%でゲージLv6に戻る | `cosmic_blessing` |
| `rank_sniper_c_X` | ピンポイント【C】 | 1-4 | Cランクの魚しか釣れなくなる | `rank_sniper_fixed`: C |
| `rank_sniper_b_X` | ピンポイント【B】 | 1-4 | Bランクの魚しか釣れなくなる | `rank_sniper_fixed`: B |
| `rank_sniper_a_X` | ピンポイント【A】 | 1-4 | Aランクの魚しか釣れなくなる | `rank_sniper_fixed`: A |
| `rank_sniper_s_X` | ピンポイント【S】 | 1-4 | Sランクの魚しか釣れなくなる | `rank_sniper_fixed`: S |
| `infinite_bait_X` | 無限餌 | 1-4 | 餌を一切消費しなくなる | `infinite_bait` |
| `good_feel_X` | 手応え | 1-4 | パワー2倍 & ガチャチケット確定 | `good_feel` |
| `hard_mode_X` | ハードモード | 1-4 | パワーx5 / 売値x8 | `hard_mode` |
| `perpetual_engine_X` | 永久機関 | 1-4 | 漁船の燃料を一切消費しなくなる | `perpetual_engine` |
| `magnet_X` | マグネット | 1-4 | 宝箱から「木の宝箱」が出なくなる | `magnet` |
