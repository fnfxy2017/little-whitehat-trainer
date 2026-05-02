// utils/npc-catalog.js
// NPC 视觉档案 — 严格对应用户提供的角色草图(2026-05-02 版)
// 草图参考自 .claude/skills/aiGame/references/character_roster.md 第一节
// 每个角色:主色 + 装饰色 + 头顶装饰物
// 困困脸 + 梯形身体是统一基底,区分只在配色和头顶

const NPC_CATALOG = {
  // ========================================
  // 第一组(草图第 1 行):平基 / 维尼里亚 / 奥伦 / 布鲁德
  // ========================================

  pinki: {
    label: '平基',
    mainColor: '#FF6BB5',
    accentColor: '#E03070',
    decoration: 'rabbit-ears-bow',
    mood: 'chill',
    showBlush: false
  },

  // 藤蔓妹妹 / 维尼里亚 — 长绿发垂下,头顶花
  tengman: {
    label: '维尼里亚',
    mainColor: '#3DCD58',
    accentColor: '#FF8FB8',
    decoration: 'vine-hair',
    mood: 'smile',
    showBlush: false
  },
  vineria: {  // 新名兼容
    label: '维尼里亚',
    mainColor: '#3DCD58',
    accentColor: '#FF8FB8',
    decoration: 'vine-hair',
    mood: 'smile',
    showBlush: false
  },

  // 奥伦 — 橙色头 + 头戴耳机(两个橙色圆罩在头两侧)+ 头顶尖发
  oren: {
    label: '奥伦',
    mainColor: '#F5862C',
    accentColor: '#3D2A1F',
    decoration: 'headphones-tuft',
    mood: 'chill',
    showBlush: false
  },

  // 布鲁德 — 棕色 + 灰色倒梯形桶帽
  brud: {
    label: '布鲁德',
    mainColor: '#8B5A3C',
    accentColor: '#9C9C9C',
    decoration: 'bucket-hat',
    mood: 'chill',
    showBlush: false
  },

  // ========================================
  // 第二组(草图第 2 行):格雷 / 西蒙 / 温达 / 德普勒
  // ========================================

  // 格雷 — 灰色三角猫耳 + 脸上胡须线
  gray: {
    label: '格雷',
    mainColor: '#9C9C9C',
    accentColor: '#9C9C9C',
    decoration: 'cat-ears-whiskers',
    mood: 'chill',
    showBlush: false
  },

  // 西蒙 — 黄色 + 头顶两根天线带球 + 尖发
  simon: {
    label: '西蒙',
    mainColor: '#F5C724',
    accentColor: '#F5C724',
    decoration: 'antennae-balls',
    mood: 'smile-o',
    showBlush: false
  },

  // 温达 — 白色 + 头顶尖刺(像皇冠/雪花)
  wenda: {
    label: '温达',
    mainColor: '#FFFFFF',
    accentColor: '#FFFFFF',
    decoration: 'crown-spikes',
    mood: 'smile',
    showBlush: false
  },

  // 德普勒 — 紫色 + 双尖刺角 + 内侧粉色
  durple: {
    label: '德普勒',
    mainColor: '#A04CCC',
    accentColor: '#FF8FB8',
    decoration: 'horns-pink-inner',
    mood: 'chill',
    showBlush: false
  },

  // ========================================
  // 第三组(草图第 3 行):莱姆 / 杰文 / 机器人 / 克拉克
  // ========================================

  // 莱姆 — 嫩绿 + 大火焰尖发
  lime: {
    label: '莱姆',
    mainColor: '#7CCB3E',
    accentColor: '#7CCB3E',
    decoration: 'flame-hair',
    mood: 'chill',
    showBlush: false
  },

  // 杰文 — 深蓝 + 头巾披到肩
  jevin: {
    label: '杰文',
    mainColor: '#2538B5',
    accentColor: '#2538B5',
    decoration: 'turban',
    mood: 'chill',
    showBlush: false
  },

  // 机器人(群演) — 黄身体 + 棕方屏幕脸 + 双天线带球
  fun_bot: {
    label: '机器人',
    mainColor: '#F5C724',
    accentColor: '#5D4E37',
    decoration: 'robot-screen-antennae',
    mood: 'screen-eyes',
    showBlush: false
  },

  // 克拉克 — 灰色 + 头顶水龙头(银色)
  cikur: {
    label: '克拉克',
    mainColor: '#9C9C9C',
    accentColor: '#C4C4C4',
    decoration: 'faucet',
    mood: 'chill',
    showBlush: false
  },

  // ========================================
  // 第四组(草图第 4 行):阿诺德 / 瑞迪 / 天空 / 特纳
  // ========================================

  // 阿诺德/加诺德 — 黄身体 + VR 头盔 + 蓝色镜面 + 双天线
  garnold: {
    label: '阿诺德',
    mainColor: '#F5C724',
    accentColor: '#5DD9E5',
    decoration: 'vr-headset',
    mood: 'visor',
    showBlush: false
  },

  // 瑞迪 — 红色 + 多根尖刺 + 两侧小耳尖
  raddy: {
    label: '瑞迪',
    mainColor: '#E73C2E',
    accentColor: '#E73C2E',
    decoration: 'multi-spikes',
    mood: 'chill',
    showBlush: false
  },

  // 天空 — 浅蓝 + 小熊耳 + 一根头发翘起
  sky: {
    label: '天空',
    mainColor: '#5DD9E5',
    accentColor: '#5DD9E5',
    decoration: 'bear-ears-tuft',
    mood: 'chill',
    showBlush: false
  },

  // 特纳 — 米色 + 圆顶礼帽 + 一字嘴
  tunner: {
    label: '特纳',
    mainColor: '#E5C99E',
    accentColor: '#8B5A3C',
    decoration: 'bowler-hat',
    mood: 'chill',
    showBlush: false
  },

  // ========================================
  // 草图未列但 SKILL 在角色花名册有的:水母妹妹 / 大树先生 / 电脑先生
  // ========================================

  shuimu: {
    label: '水母妹妹',
    mainColor: '#FFB6D5',
    accentColor: '#FF6B9D',
    decoration: 'water-drop-top',
    mood: 'smile',
    showBlush: true
  },

  dashu: {
    label: '大树先生',
    mainColor: '#8B5A3C',
    accentColor: '#3DCD58',
    decoration: 'leaves-branch',
    mood: 'chill',
    showBlush: false
  },

  diannao_xiansheng: {
    label: '电脑先生',
    mainColor: '#E5C99E',
    accentColor: '#5D4E37',
    decoration: 'crt-screen',
    mood: 'chill',
    showBlush: false
  },

  // 通用 NPC(C1 收银员等没具体身份的角色)
  npc: {
    label: 'NPC',
    mainColor: '#E5C99E',
    accentColor: '#8B5A3C',
    decoration: 'bowler-hat',
    mood: 'chill',
    showBlush: false
  },

  // ========================================
  // 兼容映射(关卡 JSON 用 mom/brother 等通用名 → 映射到具体角色)
  // ========================================

  mom: {
    label: '水母妹妹',
    mainColor: '#FFB6D5',
    accentColor: '#FF6B9D',
    decoration: 'water-drop-top',
    mood: 'smile',
    showBlush: true
  },
  brother: {
    label: '德普勒',
    mainColor: '#A04CCC',
    accentColor: '#FF8FB8',
    decoration: 'horns-pink-inner',
    mood: 'chill',
    showBlush: false
  },
  guard: {
    label: '守卫',
    mainColor: '#3498DB',
    accentColor: '#3498DB',
    decoration: 'crown-spikes',
    mood: 'chill',
    showBlush: false
  },
  wizard: {
    label: '法师',
    mainColor: '#A04CCC',
    accentColor: '#5D4E37',
    decoration: 'bowler-hat',
    mood: 'chill',
    showBlush: false
  },
  traveler: {
    label: '旅人',
    mainColor: '#7CCB3E',
    accentColor: '#9C9C9C',
    decoration: 'bucket-hat',
    mood: 'smile',
    showBlush: false
  }
};

function getNpcProfile(type) {
  return NPC_CATALOG[type] || {
    label: type,
    mainColor: '#9C9C9C',
    accentColor: '#9C9C9C',
    decoration: 'crown-spikes',
    mood: 'chill',
    showBlush: false
  };
}

module.exports = {
  NPC_CATALOG: NPC_CATALOG,
  getNpcProfile: getNpcProfile
};
