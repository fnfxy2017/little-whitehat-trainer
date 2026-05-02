// app.js
App({
  onLaunch() {
    try {
      this.globalData.progress = wx.getStorageSync('wanwan_progress') || {};
    } catch (e) {
      this.globalData.progress = {};
    }
    // 算状态栏高度 + 胶囊按钮位置(用于自定义顶栏布局)
    try {
      const sys = wx.getSystemInfoSync();
      this.globalData.statusBarHeight = sys.statusBarHeight || 20;
      // 胶囊按钮(右上角"...")的安全占位
      const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
      if (menu) {
        this.globalData.menuButton = menu;
        // 自定义顶栏推荐高度 = 胶囊按钮顶部到状态栏底部的距离 × 2 + 胶囊高度
        this.globalData.navBarHeight = (menu.top - sys.statusBarHeight) * 2 + menu.height;
      } else {
        this.globalData.navBarHeight = 44;  // fallback
      }
      console.log('[wanwan] launch ·', sys.platform, sys.model,
                  'screenW=' + sys.screenWidth,
                  'statusH=' + this.globalData.statusBarHeight,
                  'navH=' + this.globalData.navBarHeight);
    } catch (e) {
      this.globalData.statusBarHeight = 20;
      this.globalData.navBarHeight = 44;
    }
  },

  onHide() {
    try {
      wx.setStorageSync('wanwan_progress', this.globalData.progress);
    } catch (e) { /* ignore */ }
  },

  globalData: {
    progress: {},
    statusBarHeight: 20,
    navBarHeight: 44,
    menuButton: null
  }
});
