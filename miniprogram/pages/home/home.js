// pages/home/home.js
const manifest = require('../../data/manifest.js');
const storage = require('../../utils/storage.js');

Page({
  data: {
    acts: [],
    cleared: 0,
    total: 0,
    progressPct: 0
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const progress = storage.getProgress();
    let total = 0, cleared = 0;
    const actClearedCount = {};

    for (const a of manifest.acts) {
      total += a.levels.length;
      const c = a.levels.filter(lv => progress[lv.id] && progress[lv.id].cleared).length;
      cleared += c;
      actClearedCount[a.act] = { count: c, total: a.levels.length };
    }

    const acts = manifest.acts.map(a => {
      const stats = actClearedCount[a.act];
      const prev = actClearedCount[a.act - 1];
      const unlocked = a.act === 1 || (prev && prev.count >= prev.total);

      let foundPlaying = false;
      const levels = a.levels.map(lv => {
        let state;
        if (!unlocked) state = 'locked';
        else if (progress[lv.id] && progress[lv.id].cleared) state = 'cleared';
        else if (!foundPlaying) { state = 'playing'; foundPlaying = true; }
        else state = 'locked';
        return Object.assign({}, lv, { state });
      });

      return {
        act: a.act,
        label: a.label,
        subtitle: a.subtitle,
        unlocked,
        levels,
        clearedInAct: stats.count,
        lockReason: unlocked ? '' : `第 ${a.act - 1} 幕全通才能解锁`
      };
    });

    const progressPct = total > 0 ? Math.round((cleared / total) * 100) : 0;
    this.setData({ acts, cleared, total, progressPct });
  },

  onTapLevel(e) {
    const { id, state } = e.currentTarget.dataset;
    if (state === 'locked') {
      wx.showToast({ title: '先通关前面的', icon: 'none', duration: 1200 });
      return;
    }
    wx.navigateTo({ url: `/pages/level/level?id=${id}` });
  }
});
