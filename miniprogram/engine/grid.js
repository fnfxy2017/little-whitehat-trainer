// engine/grid.js · 网格坐标 + 碰撞检测

const DIR_VEC = {
  up:    { dx: 0,  dy: -1 },
  down:  { dx: 0,  dy: 1 },
  left:  { dx: -1, dy: 0 },
  right: { dx: 1,  dy: 0 }
};

/**
 * 检查格子是否可走
 * 设计决策:只有墙挡路,家具不挡路
 *  · 卧室关卡里婉婉就是要从床边走出去,家具挡路会让关卡无解
 *  · 视觉上婉婉路过家具时,会暂时被家具图层覆盖一部分(无伤大雅)
 *  · 后期如果某些关卡需要"撞家具失败"机制,可在 JSON 加 `solid: true` 标志
 */
function isWalkable(state, x, y) {
  const map = state.level.map;
  const [w, h] = map.size;

  // 越界
  if (x < 0 || y < 0 || x >= w || y >= h) return false;

  // 撞墙(永远阻挡)
  for (const wall of map.walls || []) {
    if (x >= wall.x && x < wall.x + wall.w &&
        y >= wall.y && y < wall.y + wall.h) {
      return false;
    }
  }

  // 家具默认可走;仅当 obj.solid === true 时才阻挡
  for (const obj of map.objects || []) {
    if (!obj.solid) continue;
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
