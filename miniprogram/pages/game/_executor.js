// engine/executor.js · 执行引擎,逐步消费 queue,产生动画事件

const grid = require('./_grid.js');

/**
 * 把 queue 展开成一系列"原子动作"
 * 例:[{ action: 'move', dir: 'right', steps: 6 }] → 6 个 step 动作
 */
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
 * 执行一个原子动作,返回 { ok, blocked, message }
 * 失败时不修改 state
 */
function execAtom(state, atom) {
  if (atom.action === 'move') {
    const r = grid.tryStep(state, atom.dir);
    if (r.moved) {
      state.player.x = r.newX;
      state.player.y = r.newY;
      state.player.facing = atom.dir;
      return { ok: true };
    } else {
      return { ok: false, blocked: true, message: '撞墙了' };
    }
  }
  return { ok: false, message: `未知动作: ${atom.action}` };
}

/**
 * 检查是否通关
 */
function checkSuccess(state) {
  const cond = state.level.success_condition;
  if (!cond) return false;
  if (cond.type === 'reach_goal') {
    return grid.reachedGoal(state);
  }
  return false;
}

module.exports = { expandQueue, execAtom, checkSuccess };
