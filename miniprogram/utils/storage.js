// utils/storage.js · 进度持久化封装
// 网页版用 localStorage,小程序里用 wx.setStorageSync,API 形状对齐 game.js 中的进度模型

const PROGRESS_KEY = 'wanwan_progress';

/**
 * 读取整个进度对象
 * 结构:{ T1: { cleared: true, time: 12345, attempts: 1 }, T2: {...}, ... }
 */
function getProgress() {
  try {
    return wx.getStorageSync(PROGRESS_KEY) || {};
  } catch (e) {
    console.error('[storage] 读取进度失败', e);
    return {};
  }
}

/**
 * 整体写入进度(谨慎使用,优先用 setLevelProgress)
 */
function setProgress(progress) {
  try {
    wx.setStorageSync(PROGRESS_KEY, progress);
    // 同步到 globalData,让其他页面立即能拿到
    const app = getApp();
    if (app && app.globalData) app.globalData.progress = progress;
  } catch (e) {
    console.error('[storage] 写入进度失败', e);
  }
}

/**
 * 读单关进度
 */
function getLevelProgress(levelId) {
  const all = getProgress();
  return all[levelId] || null;
}

/**
 * 写单关进度
 */
function setLevelProgress(levelId, levelData) {
  const all = getProgress();
  all[levelId] = levelData;
  setProgress(all);
}

/**
 * 清单关进度(用于"重置某一关"或测试)
 */
function clearLevelProgress(levelId) {
  const all = getProgress();
  delete all[levelId];
  setProgress(all);
}

/**
 * 清空全部进度(危险操作,需要二次确认后才用)
 */
function clearAllProgress() {
  try {
    wx.removeStorageSync(PROGRESS_KEY);
    const app = getApp();
    if (app && app.globalData) app.globalData.progress = {};
  } catch (e) {
    console.error('[storage] 清空进度失败', e);
  }
}

/**
 * 导出进度为字符串(给"导出备份"功能用)
 */
function exportProgress() {
  return JSON.stringify(getProgress(), null, 2);
}

/**
 * 从字符串导入进度
 */
function importProgress(str) {
  try {
    const obj = JSON.parse(str);
    if (typeof obj !== 'object' || obj === null) throw new Error('无效格式');
    setProgress(obj);
    return true;
  } catch (e) {
    console.error('[storage] 导入进度失败', e);
    return false;
  }
}

module.exports = {
  getProgress,
  setProgress,
  getLevelProgress,
  setLevelProgress,
  clearLevelProgress,
  clearAllProgress,
  exportProgress,
  importProgress
};
