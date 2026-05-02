// app.js
App({
  onLaunch() {
    // 业务状态挂在 globalData,不放 this.data(那是 Page 的)
    try {
      this.globalData.progress = wx.getStorageSync('wanwan_progress') || {};
    } catch (e) {
      this.globalData.progress = {};
    }
    const sys = wx.getSystemInfoSync();
    console.log('[wanwan] launch ·', sys.platform, sys.model, 'screenW=' + sys.screenWidth);
  },

  onHide() {
    try {
      wx.setStorageSync('wanwan_progress', this.globalData.progress);
    } catch (e) { /* ignore */ }
  },

  globalData: {
    progress: {}
  }
});
