// utils/level-loader.js
// 把 main 分支的 levels/*.json schema 适配成小程序内部使用的运行时模型
// main 分支字段:id / map.size / entities[].start_pos / available_command_cards / success_condition / intro_dialog (单数)
// 内部模型把这些归一化,后续模块都基于内部模型,降低代码与 JSON 字段的耦合

const { LEVELS, ORDER } = require('../data/levels/index.js');

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
  // 玩家
  const playerEntity = (raw.entities || []).find(e => e.id === 'player') || {};
  // 目标(可能是 entity.goal === true,也可能是 success_condition 间接指定)
  const goalEntity = (raw.entities || []).find(e => e.goal === true);

  // 物品(可拾取)
  const items = {};
  for (const e of raw.entities || []) {
    if (e.pickupable || e.type === 'item') {
      items[e.id] = {
        id: e.id,
        sprite: e.sprite || e.type || 'item',
        x: e.pos ? e.pos[0] : null,
        y: e.pos ? e.pos[1] : null
      };
    }
  }

  // NPCs(非 player / goal / item 的所有 entity)
  const npcs = [];
  for (const e of raw.entities || []) {
    if (e.id === 'player') continue;
    if (e.goal) continue;
    if (e.pickupable || e.type === 'item') continue;
    npcs.push({
      id: e.id,
      type: e.type,
      x: e.pos ? e.pos[0] : 0,
      y: e.pos ? e.pos[1] : 0
    });
  }

  // 卡片(标准化字段)
  const cards = (raw.available_command_cards || []).map(c => ({
    id: c.id,
    label: c.label || '',
    icon: c.icon || c.action || '',
    action: c.action,
    dir: c.dir,           // direction 卡用
    color: c.color,       // color 卡用
    stepsInput: c.steps_input || false
  }));

  return {
    id: raw.id,
    title: raw.title || '',
    act: raw.act || 0,
    chapter: raw.chapter || '',
    series: raw.id ? raw.id.charAt(0) : '?',
    introDialogs: raw.intro_dialog || [],     // 注意:JSON 字段是单数 intro_dialog
    onClearDialogs: raw.on_clear_dialog || [],
    manualTip: raw.manual_tip || '',
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
    goal: goalEntity ? {
      type: goalEntity.type,
      x: goalEntity.pos ? goalEntity.pos[0] : null,
      y: goalEntity.pos ? goalEntity.pos[1] : null,
      requiresItem: goalEntity.requires_item || null,
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

module.exports = {
  loadLevel,
  listLevelIds
};
