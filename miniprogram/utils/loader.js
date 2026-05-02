// utils/loader.js · 关卡 JSON 加载器
// 小程序限制:不能动态 require 路径,必须提前列出所有 JSON
// 主包只放第一幕 8 个关卡,其余幕走分包按需加载

// ============ 主包关卡 · 第一幕(T1-T5 + C1-C3)============
// 小程序 require 用绝对路径(从 miniprogram 根算)更稳,避免 '..' 解析问题
const mainPackLevels = {
  T1: require('/levels/T1.js'),
  T2: require('/levels/T2.js'),
  T3: require('/levels/T3.js'),
  T4: require('/levels/T4.js'),
  T5: require('/levels/T5.js'),
  C1: require('/levels/C1.js'),
  C2: require('/levels/C2.js'),
  C3: require('/levels/C3.js')
};

// ============ 分包关卡映射(act 编号 → 分包名)============
// 阶段 2 仅注册路由,真正的关卡加载在阶段 5 各分包页面里完成
const subpackMap = {
  2: 'act2',  // 第二幕:C4-C9 + X1-X3
  3: 'act3',  // 第三幕:X4-X6 + M1-M3
  4: 'act4',  // 第四幕:D1-D8 + Y1-Y3 + M4
  5: 'act5',  // 第五幕:E1-E12
  6: 'act6',  // 第六幕:F1-F4 + F6-F7
  7: 'act7'   // 第七幕:G1-G12
};

// 关卡 ID → act 编号的反向映射(用于"这关在哪个分包")
function getActOfLevel(levelId) {
  const prefix = levelId.charAt(0);
  // T/C 系列在第一/二幕,需看具体编号
  if (prefix === 'T') return 1;
  if (prefix === 'C') {
    const num = parseInt(levelId.slice(1), 10);
    return num <= 3 ? 1 : 2;
  }
  if (prefix === 'X') {
    const num = parseInt(levelId.slice(1), 10);
    return num <= 3 ? 2 : 3;
  }
  if (prefix === 'M') {
    const num = parseInt(levelId.slice(1), 10);
    return num <= 3 ? 3 : 4;
  }
  if (prefix === 'D' || prefix === 'Y') return 4;
  if (prefix === 'E') return 5;
  if (prefix === 'F') return 6;
  if (prefix === 'G') return 7;
  return null;
}

/**
 * 列出主包内所有可立即用的关卡 ID
 */
function listMainPackLevels() {
  return Object.keys(mainPackLevels).sort();
}

/**
 * 加载关卡数据(主包 / 分包通用)
 * 主包关卡同步返回;分包关卡返回 Promise(异步加载分包)
 */
function loadLevel(levelId) {
  // 主包优先
  if (mainPackLevels[levelId]) {
    return mainPackLevels[levelId];
  }

  // 不在主包内 · 需要分包(阶段 5 实现)
  const act = getActOfLevel(levelId);
  if (!act || !subpackMap[act]) {
    throw new Error(`未知关卡 ID: ${levelId}`);
  }

  // 阶段 2 占位:返回 null,表示关卡不在主包,需要分包加载
  // 阶段 5 会改成真正的 wx.loadSubpackage + require 逻辑
  console.warn(`[loader] 关卡 ${levelId} 在分包 ${subpackMap[act]},尚未实现分包加载`);
  return null;
}

/**
 * 检查关卡是否需要分包
 */
function isInSubpack(levelId) {
  return !mainPackLevels[levelId];
}

/**
 * 获取关卡所在分包名(给阶段 5 的预下载用)
 */
function getSubpackOfLevel(levelId) {
  const act = getActOfLevel(levelId);
  return act ? subpackMap[act] || null : null;
}

module.exports = {
  listMainPackLevels,
  loadLevel,
  isInSubpack,
  getSubpackOfLevel,
  getActOfLevel
};
