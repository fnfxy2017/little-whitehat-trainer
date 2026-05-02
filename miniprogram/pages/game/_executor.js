// engine/executor.js · 执行引擎
const grid = require('./_grid.js');

function expandQueue(state) {
  const atoms = [];
  for (const cmd of state.queue) {
    if (cmd.action === 'move') {
      const steps = Math.max(1, cmd.steps || 1);
      for (let i = 0; i < steps; i++) {
        atoms.push({ action: 'move', dir: cmd.dir });
      }
    } else {
      atoms.push(cmd);
    }
  }
  return atoms;
}

/**
 * 找出玩家"附近"(同格 / 上下左右 4 邻)的可拾取物品,返回 item id
 */
function findItemNearPlayer(state) {
  const px = state.player.x;
  const py = state.player.y;
  const cands = [
    [px, py],
    [px + 1, py], [px - 1, py],
    [px, py + 1], [px, py - 1]
  ];
  for (const [x, y] of cands) {
    for (const id of Object.keys(state.items)) {
      const it = state.items[id];
      if (it.heldBy) continue;
      if (it.x === x && it.y === y) return id;
    }
  }
  return null;
}

/**
 * 执行一个原子动作,返回 { ok, blocked, message }
 * 撞墙 / 没东西捡 / 没东西放 都不算硬失败 — 当前步'空转',继续往下执行
 */
function execAtom(state, atom) {
  if (atom.action === 'move') {
    const r = grid.tryStep(state, atom.dir);
    if (r.moved) {
      state.player.x = r.newX;
      state.player.y = r.newY;
      state.player.facing = atom.dir;
      // 若玩家手上拿着物品,物品跟着移动
      if (state.player.holding) {
        const it = state.items[state.player.holding];
        if (it) { it.x = r.newX; it.y = r.newY; }
      }
      return { ok: true, blocked: false };
    }
    state.player.facing = atom.dir;
    return { ok: true, blocked: true };
  }

  if (atom.action === 'pickup') {
    if (state.player.holding) {
      // 已经拿着东西,不能再捡
      return { ok: true, blocked: true, message: '手里有东西啦' };
    }
    const itemId = findItemNearPlayer(state);
    if (!itemId) {
      return { ok: true, blocked: true, message: '附近没东西捡' };
    }
    state.items[itemId].heldBy = 'player';
    state.items[itemId].x = state.player.x;
    state.items[itemId].y = state.player.y;
    state.player.holding = itemId;
    return { ok: true };
  }

  if (atom.action === 'drop') {
    if (!state.player.holding) {
      return { ok: true, blocked: true, message: '手里没东西' };
    }
    const it = state.items[state.player.holding];
    it.heldBy = null;
    it.x = state.player.x;
    it.y = state.player.y;
    state.player.holding = null;
    return { ok: true };
  }

  if (atom.action === 'set_color') {
    // 找玩家附近(同格 / 4 邻)的可染色实体,把颜色追加进 sequence
    const px = state.player.x;
    const py = state.player.y;
    const cands = [
      [px, py],
      [px + 1, py], [px - 1, py],
      [px, py + 1], [px, py - 1]
    ];
    let target = null;
    for (const [x, y] of cands) {
      for (const id of Object.keys(state.colorables || {})) {
        const c = state.colorables[id];
        if (c.x === x && c.y === y) { target = c; break; }
      }
      if (target) break;
    }
    if (!target) {
      return { ok: true, blocked: true, message: '附近没有可染色的东西' };
    }
    target.sequence.push(atom.color || 'red');
    return { ok: true };
  }

  return { ok: false, message: `未知动作: ${atom.action}` };
}

function checkSuccess(state) {
  const cond = state.level.success_condition;
  if (!cond) return false;

  if (cond.type === 'reach_goal') {
    return grid.reachedGoal(state);
  }

  if (cond.type === 'item_at_goal') {
    // 检查指定 item 是否在 goal 位置(不被任何人拿着)
    const item = state.items[cond.item_id];
    if (!item) return false;
    if (item.heldBy) return false;
    if (!state.goal) return false;
    return item.x === state.goal.x && item.y === state.goal.y;
  }

  if (cond.type === 'color_sequence_matches') {
    const c = state.colorables && state.colorables[cond.entity_id];
    if (!c) return false;
    if (c.sequence.length !== c.required.length) return false;
    for (let i = 0; i < c.required.length; i++) {
      if (c.sequence[i] !== c.required[i]) return false;
    }
    return true;
  }

  return false;
}

module.exports = { expandQueue, execAtom, checkSuccess };
