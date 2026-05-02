// pages/levels/index.js · 选关页(健壮版,任何子模块挂掉都不白屏)

Page({
  data: {
    levelCount: 0,
    cleared: 0,
    lastTestResult: '',
    loadError: ''
  },

  onLoad() {
    console.log('[levels] onLoad 开始');

    let levelCount = 0;
    let cleared = 0;
    let loadError = '';

    // 关卡加载(loader 内部 require .json 是潜在风险点)
    try {
      const loader = require('../../utils/loader.js');
      const list = loader.listMainPackLevels();
      levelCount = list.length;
      console.log('[levels] loader OK · 关卡数:', levelCount);
    } catch (e) {
      console.error('[levels] loader 加载失败', e);
      loadError = 'loader: ' + (e.message || String(e));
    }

    // 进度读取
    try {
      const storage = require('../../utils/storage.js');
      const progress = storage.getProgress();
      cleared = Object.values(progress).filter(p => p && p.cleared).length;
      console.log('[levels] storage OK · 已通关:', cleared);
    } catch (e) {
      console.error('[levels] storage 加载失败', e);
      loadError = (loadError ? loadError + ' · ' : '') + 'storage: ' + (e.message || String(e));
    }

    this.setData({ levelCount, cleared, loadError });
    console.log('[levels] onLoad 完成');
  },

  onTestStorage() {
    const testKey = '__SCAFFOLD_TEST__';
    const testValue = { cleared: true, time: Date.now() };

    try {
      const storage = require('../../utils/storage.js');
      storage.setLevelProgress(testKey, testValue);
      const readBack = storage.getLevelProgress(testKey);
      const ok = readBack && readBack.cleared === true;

      this.setData({
        lastTestResult: ok
          ? `存档读写正常 ✓\n写入: ${JSON.stringify(testValue)}\n读出: ${JSON.stringify(readBack)}`
          : '存档读写异常 ✗'
      });

      storage.clearLevelProgress(testKey);
    } catch (e) {
      this.setData({
        lastTestResult: '存档异常: ' + (e.message || String(e))
      });
    }
  }
});
