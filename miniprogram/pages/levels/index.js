// pages/levels/index.js · 选关页 · 真实版

const levelMeta = require('./level-meta.js');

// 幕信息表(标题 + 副标题 + 分包提示)
const ACT_INFO = {
  1: { label: '一', subtitle: '学徒篇 · 樱桃镇' },
  2: { label: '二', subtitle: '追踪篇 · 迷雾森林', subpackHint: '分包 ~1.4 MB' },
  3: { label: '三', subtitle: '决战篇 · 中央指令塔', subpackHint: '分包 ~1.5 MB · 含三套模考' },
  4: { label: '四', subtitle: '实战篇 · 星野站危机', subpackHint: '分包 ~1.8 MB' },
  5: { label: '五', subtitle: '余烬反扑', subpackHint: '分包 ~1.6 MB' },
  6: { label: '六', subtitle: '新秩序', subpackHint: '分包 ~0.9 MB' },
  7: { label: '七', subtitle: '看不见的钥匙', subpackHint: '分包 ~1.7 MB · 密码学三件套' }
};

Page({
  data: {
    acts: [],
    cleared: 0,
    total: 0,
    progressPct: 0,
    loadError: '',
    lastTestResult: ''
  },

  onLoad() {
    this.refresh();
  },

  onShow() {
    // 从游戏页返回时刷新进度
    this.refresh();
  },

  refresh() {
    let progress = {};
    let loadError = '';

    try {
      progress = wx.getStorageSync('wanwan_progress') || {};
    } catch (e) {
      loadError = 'storage: ' + (e.message || String(e));
      console.error('[levels] 进度读取失败', e);
    }

    // 收集所有关卡 + 计算总进度
    let total = 0;
    let cleared = 0;
    const allActIds = Object.keys(levelMeta).sort();  // act1..act7

    // 计算每幕的"是否解锁":第一幕永远解锁,其余幕需前一幕全通关
    const actClearedCount = {};
    for (const actKey of allActIds) {
      const actNum = parseInt(actKey.replace('act', ''), 10);
      const list = levelMeta[actKey] || [];
      total += list.length;
      const c = list.filter(lv => progress[lv.id] && progress[lv.id].cleared).length;
      cleared += c;
      actClearedCount[actNum] = { count: c, total: list.length };
    }

    // 组装 acts 数组(供 WXML 渲染)
    const acts = allActIds.map(actKey => {
      const actNum = parseInt(actKey.replace('act', ''), 10);
      const info = ACT_INFO[actNum] || { label: actNum, subtitle: '' };
      const list = levelMeta[actKey] || [];
      const stats = actClearedCount[actNum];

      // 第一幕始终解锁;后续幕看前一幕是否全清
      const prev = actClearedCount[actNum - 1];
      const unlocked = actNum === 1 || (prev && prev.count >= prev.total);

      // 计算每个关卡的状态:cleared / playing / locked
      // playing = 在前一关已通且本关未通的"下一道关";简化为"第一道未通关 = playing"
      let foundPlaying = false;
      const levels = list.map(lv => {
        const state = (() => {
          if (!unlocked) return 'locked';
          if (progress[lv.id] && progress[lv.id].cleared) return 'cleared';
          if (!foundPlaying) {
            foundPlaying = true;
            return 'playing';
          }
          return 'locked';
        })();
        return { ...lv, state };
      });

      return {
        act: actNum,
        label: info.label,
        subtitle: info.subtitle,
        unlocked,
        clearedInAct: stats.count,
        levels: unlocked ? levels : list,
        lockReason: unlocked ? '' : `第 ${actNum - 1} 幕全通才能解锁`,
        subpackHint: info.subpackHint || ''
      };
    });

    const progressPct = total > 0 ? Math.round((cleared / total) * 100) : 0;

    this.setData({ acts, cleared, total, progressPct, loadError });
    console.log('[levels] 已加载', total, '关 · 已通', cleared);
  },

  onTapLevel(e) {
    const { id, state } = e.currentTarget.dataset;
    if (state === 'locked') {
      wx.showToast({ title: '先通关前面的', icon: 'none', duration: 1200 });
      return;
    }
    // 跳到游戏页(目前是占位)
    wx.navigateTo({ url: `/pages/game/index?level=${id}` });
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
          ? `存档读写正常 ✓ · 写入 ${JSON.stringify(testValue)}`
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
