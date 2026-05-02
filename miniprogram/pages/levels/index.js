// pages/levels/index.js · 选关页(阶段 1 占位骨架)
const storage = require('../../utils/storage.js');
const loader = require('../../utils/loader.js');

Page({
  data: {
    levelCount: 0,
    cleared: 0,
    lastTestResult: ''
  },

  onLoad() {
    // 加载主包内的关卡(第一幕 T1-T5 + C1-C3)
    const list = loader.listMainPackLevels();
    const progress = storage.getProgress();
    const cleared = Object.values(progress).filter(p => p.cleared).length;

    this.setData({
      levelCount: list.length,
      cleared
    });

    console.log('[levels] 已加载', list.length, '个主包关卡 ·', cleared, '已通关');
  },

  onTestStorage() {
    // 阶段 1 自检:写一条假进度,读出来,验证 storage 工具链能用
    const testKey = '__SCAFFOLD_TEST__';
    const testValue = { cleared: true, time: Date.now() };

    try {
      storage.setLevelProgress(testKey, testValue);
      const readBack = storage.getLevelProgress(testKey);
      const ok = readBack && readBack.cleared === true;

      this.setData({
        lastTestResult: ok
          ? `存档读写正常 ✓\n写入: ${JSON.stringify(testValue)}\n读出: ${JSON.stringify(readBack)}`
          : '存档读写异常 ✗'
      });

      // 测试完清掉,不污染真实进度
      storage.clearLevelProgress(testKey);
    } catch (e) {
      this.setData({
        lastTestResult: '存档异常: ' + (e.message || e)
      });
    }
  }
});
