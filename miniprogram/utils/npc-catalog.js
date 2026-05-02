// utils/npc-catalog.js
// NPC 视觉档案 — 与 .claude/skills/aiGame/references/character_roster.md 严格对应
// 每个角色:主色 + 装饰色 + 头顶装饰物
// 颜色取自 _STYLE_GUIDE allowed palette

const NPC_CATALOG = {
  // ===== 婉婉妈妈一家 =====
  shuimu: {
    label: '水母妹妹',
    mainColor: '#FFB6D5',   // 软粉(水母钟形)
    accentColor: '#FF6B9D', // 顶部水滴
    decoration: 'water-drop',
    mood: 'smile',
    showBlush: true
  },
  durple: {
    label: '德普勒',
    mainColor: '#9B59B6',   // 紫
    accentColor: '#9B59B6',
    decoration: 'spike-horns',
    mood: 'chill',
    showBlush: false
  },

  // ===== T3 =====
  raddy: {
    label: '瑞迪',
    mainColor: '#E74C3C',   // 红
    accentColor: '#E74C3C',
    decoration: 'horn-single',
    mood: 'chill',
    showBlush: false
  },
  lime: {
    label: '莱姆',
    mainColor: '#A4E04A',   // 嫩绿
    accentColor: '#A4E04A',
    decoration: 'spiky-hair',
    mood: 'smile',
    showBlush: true
  },

  // ===== T4 =====
  gray: {
    label: '格雷',
    mainColor: '#95A5A6',   // 灰
    accentColor: '#95A5A6',
    decoration: 'cat-ears',
    mood: 'chill',
    showBlush: false
  },

  // ===== T5 =====
  dashu: {
    label: '大树先生',
    mainColor: '#8B5A3C',   // 棕
    accentColor: '#2ECC71', // 树叶绿
    decoration: 'leaves',
    mood: 'chill',
    showBlush: false
  },

  // ===== 核心三人组 =====
  pinki: {
    label: '平基',
    mainColor: '#FF6B9D',   // 粉
    accentColor: '#FF6B9D',
    decoration: 'rabbit-ears',
    mood: 'smile',
    showBlush: true
  },
  tengman: {
    label: '藤蔓妹妹',
    mainColor: '#2ECC71',   // 绿
    accentColor: '#FF6B9D', // 头顶花
    decoration: 'leaves',
    mood: 'smile',
    showBlush: true
  },
  oren: {
    label: '奥伦',
    mainColor: '#E67E22',   // 橙
    accentColor: '#2C3E50', // 耳机黑
    decoration: 'headphones',
    mood: 'chill',
    showBlush: false
  },

  // ===== C 系列其余 NPC =====
  jevin: {
    label: '杰文',
    mainColor: '#2C3E80',   // 深蓝
    accentColor: '#2C3E80',
    decoration: 'bald',
    mood: 'chill',
    showBlush: false
  },
  cikur: {
    label: '克拉克',
    mainColor: '#95A5A6',   // 灰
    accentColor: '#95A5A6',
    decoration: 'faucet',
    mood: 'chill',
    showBlush: false
  },
  diannao_xiansheng: {
    label: '电脑先生',
    mainColor: '#F5DEB3',   // 米色
    accentColor: '#5D4E37', // CRT 棕黑
    decoration: 'screen',
    mood: 'chill',
    showBlush: false
  },
  brud: {
    label: '布鲁德',
    mainColor: '#8B5A3C',   // 棕
    accentColor: '#FFFFFF', // 白桶帽
    decoration: 'bucket-hat',
    mood: 'chill',
    showBlush: false
  },
  simon: {
    label: '西蒙',
    mainColor: '#F1C40F',   // 黄
    accentColor: '#F1C40F',
    decoration: 'bald',
    mood: 'chill',
    showBlush: false
  },
  tunner: {
    label: '特纳',
    mainColor: '#95A5A6',   // 灰
    accentColor: '#95A5A6',
    decoration: 'spike-horns',
    mood: 'chill',
    showBlush: false
  },
  garnold: {
    label: '加诺德',
    mainColor: '#95A5A6',   // 灰金属
    accentColor: '#1E3A8A', // 蓝屏
    decoration: 'digital',
    mood: 'chill',
    showBlush: false
  },
  wenda: {
    label: '温达',
    mainColor: '#F5DEB3',   // 米色
    accentColor: '#8B5A3C', // 棕色礼帽
    decoration: 'fedora',
    mood: 'smile',
    showBlush: false
  },

  // ===== 兼容映射(关卡 JSON 用 mom/brother/guard 等通用名) =====
  mom: {
    label: '水母妹妹',
    mainColor: '#FFB6D5',
    accentColor: '#FF6B9D',
    decoration: 'water-drop',
    mood: 'smile',
    showBlush: true
  },
  brother: {
    label: '德普勒',
    mainColor: '#9B59B6',
    accentColor: '#9B59B6',
    decoration: 'spike-horns',
    mood: 'chill',
    showBlush: false
  },
  guard: {
    label: '守卫',
    mainColor: '#3498DB',
    accentColor: '#3498DB',
    decoration: 'bald',
    mood: 'chill',
    showBlush: false
  },
  wizard: {
    label: '法师',
    mainColor: '#9B59B6',
    accentColor: '#9B59B6',
    decoration: 'fedora',
    mood: 'chill',
    showBlush: false
  },
  traveler: {
    label: '旅人',
    mainColor: '#A4E04A',
    accentColor: '#8B5A3C',
    decoration: 'bucket-hat',
    mood: 'smile',
    showBlush: false
  }
};

/**
 * 根据 NPC type 返回视觉档案,未知类型给一个默认困困灰球
 */
function getNpcProfile(type) {
  return NPC_CATALOG[type] || {
    label: type,
    mainColor: '#95A5A6',
    accentColor: '#95A5A6',
    decoration: 'bald',
    mood: 'chill',
    showBlush: false
  };
}

module.exports = {
  NPC_CATALOG: NPC_CATALOG,
  getNpcProfile: getNpcProfile
};
