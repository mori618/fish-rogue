// メインエントリーポイント
// 画面の初期化とイベントリスナーの設定

document.addEventListener('DOMContentLoaded', () => {
    UIManager.initStartScreen();
    UIManager.initHelp();

    const on = (id, handler) => document.getElementById(id).addEventListener('click', handler);

    // ブラウザは最初のタップまで音を出せないので、タップのたびに音声を有効にする（2回目以降は何もしない）
    document.addEventListener('pointerdown', () => SoundManager.unlock(), true);

    // ========================================
    // スタート画面
    // ========================================
    on('start-btn', () => {
        if (SaveManager.hasSaveData() &&
            !window.confirm('進行中の釣り旅があります。破棄して新しく始めますか？')) {
            return;
        }
        RunManager.startNewRun();
    });

    on('continue-btn', () => {
        if (!RunManager.resumeRun()) UIManager.initStartScreen();
    });

    on('encyclopedia-btn', () => {
        // 釣り旅を始める前でも図鑑を見られるよう、メタデータから読み込む
        GameState.encyclopedia = { ...SaveManager.loadMeta().encyclopedia };
        UIManager.showScreen('encyclopedia');
    });

    on('encyclopedia-back-btn', () => UIManager.showScreen('start'));
    on('sound-btn', () => UIManager.toggleSound());

    // ========================================
    // 釣り画面
    // ========================================
    // 画面タップで釣りを進める（ボタン上のタップは除く）
    document.getElementById('fishing-screen').addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        FishingGame.onClick();
    });

    on('build-btn', () => HarborUI.showBuild());
    on('return-btn', () => RunManager.returnToHarbor());
    on('help-btn', () => UIManager.openHelp());


    // ========================================
    // キーボード（スペースキーでタップの代わり）
    // ========================================
    document.addEventListener('keydown', (e) => {
        if (e.key !== ' ' || UIManager.currentScreen !== 'fishing') return;
        if (document.querySelector('.modal-overlay:not(.hidden)')) return;
        e.preventDefault();
        FishingGame.onClick();
    });
});
