// utils/level-loader.js
// 把 main 分支的 levels/*.json schema 适配成小程序内部使用的运行时模型
// main 分支字段:id / map.size / entities[].start_pos / available_command_cards / success_condition / intro_dialog (单数)
// 内部模型把这些归一化,后续模块都基于内部模型,降低代码与 JSON 字段的耦合

const levelsModule = require('../data/levels/index.js');
const LEVELS = levelsModule.LEVELS;
const ORDER = levelsModule.ORDER;

// 场景物件类型 — 这些不是 NPC 也不是道具,
// 而是"地图上的固定装置",用统一的贴片渲染兜底
const PROP_TYPES = {
  blocked_door: true,    // 临时锁住的门(C5 D2 等)
  info_stone: true,      // 信息石碑(D2-D8 多关)
  safe_box: true,        // 保险箱
  mirror: true,          // 镜子(C3 D4)
  mailbox: true,         // 邮箱(G1 G11)
  gift_box: true,        // 礼物盒
  button: true,          // 按钮(E5 G7)
  virus_tile: true,      // 病毒砖(E12 等)
  deploy_button: true,   // 部署按钮(E10 E12 E7)
  fake_check_door: true, // 假检查门(E10 E12 E7)
  color_gate: true,      // 颜色门(C6 X5 X6)
  timed_gate: true,      // 定时门(C9 X3 X6)
  loop_npc: true,        // 循环 NPC(E11 E4)
  reply_guard: true      // 回复守门员(E3)
};

/**
 * 加载关卡数据。levelId 形如 "T1" / "C1"
 * 返回 null 表示没找到
 */
function loadLevel(levelId) {
  const raw = LEVELS[levelId];
  if (!raw) return null;
  return adapt(raw);
}

function listLevelIds() {
  return ORDER.slice();
}

function adapt(raw) {
  const playerEntity = (raw.entities || []).find(e => e.id === 'player') || {};
  const goalEntity = (raw.entities || []).find(e => e.goal === true);

  // 物品(可拾取):pickupable 标志 / type=item / type=credential
  const items = {};
  for (const e of raw.entities || []) {
    if (e.pickupable || e.type === 'item' || e.type === 'credential') {
      items[e.id] = {
        id: e.id,
        sprite: e.sprite || e.type || 'item',
        type: e.type,                                   // 区分 credential 等子类型
        credentialType: e.credential_type || null,    // 凭证类型(如 'library_card')
        x: e.pos ? e.pos[0] : null,
        y: e.pos ? e.pos[1] : null
      };
    }
  }

  // NPCs(非 player / goal / item / 可染色实体 / 可浇灌目标 / 货架)
  const npcs = [];
  const colorables = {};
  const targets = {};
  const shelves = {};  // C1 等关卡的货架道具(milk / ice_cream 等)
  for (const e of raw.entities || []) {
    if (e.id === 'player') continue;
    if (e.pickupable || e.type === 'item' || e.type === 'credential') continue;
    if (e.type === 'traffic_light') {
      colorables[e.id] = {
        id: e.id,
        type: e.type,
        x: e.pos[0],
        y: e.pos[1],
        required: e.required_sequence || []
      };
      continue;
    }
    if (e.type === 'flower') {
      targets[e.id] = {
        id: e.id,
        type: 'flower',
        x: e.pos[0],
        y: e.pos[1],
        watered: !!e.watered
      };
      continue;
    }
    if (e.type === 'shelf') {
      shelves[e.id] = {
        id: e.id,
        sprite: e.sprite || 'shelf',
        x: e.pos[0],
        y: e.pos[1],
        trap: !!e.trap,
        label: e.label || ''
      };
      continue;
    }
    // 场景物件兜底:blocked_door / info_stone / safe_box / mirror /
    // mailbox / gift_box / button / virus_tile / loop_npc / etc.
    // 这些在多个 C/D/E 系列出现,用统一'贴片'渲染避免崩
    if (PROP_TYPES[e.type]) {
      shelves[e.id] = {
        id: e.id,
        sprite: e.type,         // 用 type 当 sprite,共享渲染
        propType: e.type,
        x: e.pos[0],
        y: e.pos[1],
        trap: !!e.trap,
        label: e.label || ''
      };
      continue;
    }
    if (e.goal) continue;
    npcs.push({
      id: e.id,
      type: e.type,
      role: e.role || null,
      follows: e.follows || null,
      label: e.label || '',
      x: e.pos ? e.pos[0] : 0,
      y: e.pos ? e.pos[1] : 0,
      // 守卫专用字段(C4 等)
      asidePos: e.aside_pos || null,        // 让开后的位置
      blockMessage: e.block_message || '',  // 拦截话
      acceptPersona: e.accept_persona || null  // 信任的身份(默认接受任何 persona)
    });
  }

  // 卡片(标准化字段)
  const cards = (raw.available_command_cards || []).map(c => ({
    id: c.id,
    label: c.label || '',
    icon: c.icon || c.action || '',
    action: c.action,
    dir: c.dir,
    color: c.color,
    stepsInput: c.steps_input || false,
    timesInput: c.times_input || false,
    isContainer: c.is_container || false,
    persona: c.persona || null,
    item: c.item || null
  }));

  return {
    id: raw.id,
    title: raw.title || '',
    act: raw.act || 0,
    chapter: raw.chapter || '',
    series: raw.id ? raw.id.charAt(0) : '?',
    introDialogs: raw.intro_dialog || [],     // 注意:JSON 字段是单数 intro_dialog
    onClearDialogs: raw.on_clear_dialog || [],
    manualTip: cleanHtmlToText(raw.manual_tip || ''),
    securityConcept: normalizeSecurityConcept(raw.security_concept),
    presetQueue: raw.preset_queue || null,
    cards,
    map: {
      size: raw.map ? raw.map.size : [10, 8],
      walls: raw.map ? (raw.map.walls || []) : [],
      objects: raw.map ? (raw.map.objects || []) : []
    },
    player: {
      startX: playerEntity.start_pos ? playerEntity.start_pos[0] : 0,
      startY: playerEntity.start_pos ? playerEntity.start_pos[1] : 0,
      facing: playerEntity.facing || 'down'
    },
    items,
    npcs,
    colorables,
    targets,
    shelves,
    goal: goalEntity ? {
      type: goalEntity.type,
      id: goalEntity.id || 'goal',
      x: goalEntity.pos ? goalEntity.pos[0] : null,
      y: goalEntity.pos ? goalEntity.pos[1] : null,
      requiresItem: goalEntity.requires_item || null,
      requiresCredential: goalEntity.requires_credential || null,
      requiredSequence: goalEntity.required_sequence || null
    } : null,
    successCondition: raw.success_condition || { type: 'reach_goal' },
    optimalSteps: raw.optimal_steps || 0,
    hints: raw.hints || []
  };
}

function normalizeSecurityConcept(sc) {
  if (!sc) return null;
  if (typeof sc === 'string') return { name: sc, real_analogy: '', defense_tip: '' };
  return {
    name: sc.name || '',
    real_analogy: sc.real_analogy || sc.analogy || '',
    defense_tip: sc.defense_tip || sc.defense || ''
  };
}

/**
 * 清洗 HTML 标签 → 纯文本
 * <br> → 换行;<strong>x</strong> → x;其他标签直接去掉
 * 关卡 JSON 里的 manual_tip 可能含 HTML 标签(网页版用),小程序 view 不渲染
 */
function cleanHtmlToText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(strong|b|em|i|u|span|p|div)[^>]*>/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

module.exports = {
  loadLevel,
  listLevelIds
};
