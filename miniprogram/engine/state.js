// engine/state.js · 关卡运行时状态

function createState(levelData) {
  const player = levelData.entities.find(e => e.id === 'player');
  const goal = levelData.entities.find(e => e.goal);

  // 收集所有可拾取的物品(pickupable),记录在世界中的位置和"被谁拿着"
  const items = {};
  for (const e of levelData.entities) {
    if (e.pickupable || e.type === 'item') {
      items[e.id] = {
        id: e.id,
        sprite: e.sprite || e.type || 'item',
        x: e.pos ? e.pos[0] : null,
        y: e.pos ? e.pos[1] : null,
        heldBy: null    // 'player' 时表示在玩家手里
      };
    }
  }

  // 收集所有 NPC(非 player、非 goal、非 item),供渲染使用
  const npcs = [];
  for (const e of levelData.entities) {
    if (e.id === 'player') continue;
    if (e.goal) continue;
    if (e.pickupable || e.type === 'item') continue;
    npcs.push({
      id: e.id,
      type: e.type,
      x: e.pos ? e.pos[0] : 0,
      y: e.pos ? e.pos[1] : 0,
      facing: e.facing || 'down'
    });
  }

  return {
    level: levelData,
    levelId: levelData.id,

    player: {
      x: player.start_pos[0],
      y: player.start_pos[1],
      facing: player.facing || 'down',
      holding: null   // 拿着的 item id
    },

    // 终点 — 兼容 T1 的 goal entity 和 T2 的 goal_zone
    goal: goal ? {
      x: goal.pos[0],
      y: goal.pos[1],
      type: goal.type,
      requiresItem: goal.requires_item || null,
      goalId: goal.id || 'goal'
    } : null,

    // 物品和 NPC 状态
    items,
    npcs,

    // 命令队列
    queue: [],

    phase: 'intro_dialog',
    dialogIndex: 0,
    dialogList: levelData.intro_dialog || [],

    hintLevel: 0,
    hintLockUntil: Date.now() + 3 * 60 * 1000,

    executionStep: 0,
    executionAnim: null,

    clearedAt: null
  };
}

module.exports = { createState };
