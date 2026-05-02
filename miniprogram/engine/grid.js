// engine/grid.js · 网格坐标 + 碰撞检测

const DIR_VEC = {
  up:    { dx: 0,  dy: -1 },
  down:  { dx: 0,  dy: 1 },
  left:  { dx: -1, dy: 0 },
  right: { dx: 1,  dy: 0 }
};

/**
 * 检查格子是否可走
 */
function isWalkable(state, x, y) {
  const map = state.level.map;
  const [w, h] = map.size;

  // 越界
  if (x < 0 || y < 0 || x >= w || y >= h) return false;

  // 撞墙
  for (const wall of map.walls || []) {
    if (x >= wall.x && x < wall.x + wall.w &&
        y >= wall.y && y < wall.y + wall.h) {
      return false;
    }
  }

  // 撞家具(decorative 不挡路)
  for (const obj of map.objects || []) {
    if (obj.decorative) continue;
    const [ox, oy] = obj.pos;
    const [ow, oh] = obj.size || [1, 1];
    if (x >= ox && x < ox + ow && y >= oy && y < oy + oh) {
      return false;
    }
  }

  return true;
}

/**
 * 尝试走一步,返回 { moved, blocked, newX, newY }
 */
function tryStep(state, dir) {
  const vec = DIR_VEC[dir];
  if (!vec) return { moved: false, blocked: true, newX: state.player.x, newY: state.player.y };

  const nx = state.player.x + vec.dx;
  const ny = state.player.y + vec.dy;

  if (isWalkable(state, nx, ny)) {
    return { moved: true, blocked: false, newX: nx, newY: ny };
  }
  return { moved: false, blocked: true, newX: state.player.x, newY: state.player.y };
}

/**
 * 检查是否到达目标
 */
function reachedGoal(state) {
  if (!state.goal) return false;
  return state.player.x === state.goal.x && state.player.y === state.goal.y;
}

module.exports = { DIR_VEC, isWalkable, tryStep, reachedGoal };
