// app.js - 白帽小队训练营 · 微信小程序入口

App({
  onLaunch() {
    // 启动时读取本地进度,保持跨会话连续性
    try {
      const progress = wx.getStorageSync('wanwan_progress') || {};
      this.globalData.progress = progress;
    } catch (e) {
      console.error('读取本地进度失败', e);
      this.globalData.progress = {};
    }

    // 输出运行环境信息,方便真机调试
    const sys = wx.getSystemInfoSync();
    console.log('[wanwan] 启动 · 平台:', sys.platform, '· 设备:', sys.model, '· 屏宽:', sys.screenWidth);
  },

  onShow() {
    // 小程序从后台切回前台时触发
  },

  onHide() {
    // 切到后台时,把进度落盘一次,防丢
    try {
      wx.setStorageSync('wanwan_progress', this.globalData.progress);
    } catch (e) {
      console.error('保存进度失败', e);
    }
  },

  globalData: {
    progress: {},
    // 设计系统的 5 个核心色,所有 JS 中绘制 Canvas 时统一从这里取
    colors: {
      bgDeep:    '#F5DEB3',  // 陶土黄(顶部背景)
      bgLight:   '#FFE9B8',  // 暖米黄(底部背景)
      cardWarm:  '#FFF1C9',  // 奶油黄(卡片底)
      cardPale:  '#FFFCF2',  // 极淡米(大容器底)
      ink:       '#2C2C2A',  // 墨黑
      action:    '#FF6B47',  // 朱砂橙
      textMute:  '#5F5E5A',  // 次要文字
      textFaint: '#888780'   // 灰显文字
    }
  }
});
