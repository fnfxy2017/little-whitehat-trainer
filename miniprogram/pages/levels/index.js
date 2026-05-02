// pages/levels/index.js · 选关页(简化健壮版)
// 直接 require 同目录的 level-data.js,不依赖 utils/loader,避免跨目录 require 问题

const levelData = require('./level-data.js');

Page({
  data: {
    levelCount: 0,
    cleared: 0,
    lastTestResult: '',
    loadError: '',
    sampleLevel: ''
  },

  onLoad() {
    console.log('[levels] onLoad 开始');
    let levelCount = 0;
    let cleared = 0;
    let loadError = '';
    let sampleLevel = '';

    // 加载关卡数据(同目录直接 require,稳)
    try {
      const ids = Object.keys(levelData).sort();
      levelCount = ids.length;
      const t1 = levelData.T1;
      sampleLevel = t1 ? `T1: ${t1.title}` : '';
      console.log('[levels] 关卡数:', levelCount, '· 样本 T1:', sampleLevel);
    } catch (e) {
      console.error('[levels] 关卡数据加载失败', e);
      loadError = 'data: ' + (e.message || String(e));
    }

    // 进度读取
    try {
      const progress = wx.getStorageSync('wanwan_progress') || {};
      cleared = Object.values(progress).filter(p => p && p.cleared).length;
      console.log('[levels] 已通关:', cleared);
    } catch (e) {
      console.error('[levels] storage 失败', e);
      loadError = (loadError ? loadError + ' · ' : '') + 'storage: ' + (e.message || String(e));
    }

    this.setData({ levelCount, cleared, loadError, sampleLevel });
    console.log('[levels] onLoad 完成');
  },

  onTestStorage() {
    const testKey = '__SCAFFOLD_TEST__';
    const testValue = { cleared: true, time: Date.now() };

    try {
      const all = wx.getStorageSync('wanwan_progress') || {};
      all[testKey] = testValue;
      wx.setStorageSync('wanwan_progress', all);

      const readBackAll = wx.getStorageSync('wanwan_progress') || {};
      const readBack = readBackAll[testKey];
      const ok = readBack && readBack.cleared === true;

      this.setData({
        lastTestResult: ok
          ? `存档读写正常 ✓\n写入: ${JSON.stringify(testValue)}\n读出: ${JSON.stringify(readBack)}`
          : '存档读写异常 ✗'
      });

      // 测试完清除
      delete readBackAll[testKey];
      wx.setStorageSync('wanwan_progress', readBackAll);
    } catch (e) {
      this.setData({
        lastTestResult: '存档异常: ' + (e.message || String(e))
      });
    }
  }
});
