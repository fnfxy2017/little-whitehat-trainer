// utils/storage.js · 进度持久化

const KEY = 'wanwan_progress';

function getProgress() {
  try { return wx.getStorageSync(KEY) || {}; } catch (e) { return {}; }
}

function setProgress(progress) {
  try {
    wx.setStorageSync(KEY, progress);
    const app = getApp();
    if (app && app.globalData) app.globalData.progress = progress;
  } catch (e) { /* swallow */ }
}

function getLevel(levelId) {
  return getProgress()[levelId] || null;
}

function recordCleared(levelId, payload) {
  const all = getProgress();
  const prev = all[levelId] || {};
  all[levelId] = Object.assign({}, prev, payload, {
    cleared: true,
    time: Date.now(),
    attempts: (prev.attempts || 0) + 1
  });
  setProgress(all);
}

module.exports = {
  getProgress,
  setProgress,
  getLevel,
  recordCleared
};
