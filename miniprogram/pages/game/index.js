// pages/game/index.js · 主游戏页(阶段 1 占位骨架)
Page({
  data: {
    levelId: ''
  },

  onLoad(options) {
    const levelId = options.level || 'T1';
    this.setData({ levelId });
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  }
});
