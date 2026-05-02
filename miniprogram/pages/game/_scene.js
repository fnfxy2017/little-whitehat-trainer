// render/scene.js · Canvas 场景渲染
// 负责绘制:地板、墙、家具、婉婉、门、网格线
// 设计系统:严格 v7.2 5 色

const COLORS = {
  bgDeep:   '#F5DEB3',
  bgLight:  '#FFE9B8',
  cardWarm: '#FFF1C9',
  cardPale: '#FFFCF2',
  ink:      '#2C2C2A',
  action:   '#FF6B47'
};

/**
 * 计算单格大小,基于 canvas 尺寸 + 关卡 grid
 */
function computeCellSize(canvasW, canvasH, gridW, gridH) {
  return Math.floor(Math.min(canvasW / gridW, canvasH / gridH));
}

/**
 * 主渲染函数
 */
function render(ctx, canvasW, canvasH, state) {
  const map = state.level.map;
  const [gridW, gridH] = map.size;
  const cell = computeCellSize(canvasW, canvasH, gridW, gridH);
  const offsetX = Math.floor((canvasW - cell * gridW) / 2);
  const offsetY = Math.floor((canvasH - cell * gridH) / 2);

  ctx.clearRect(0, 0, canvasW, canvasH);

  // 1. 地板背景
  ctx.fillStyle = COLORS.cardWarm;
  ctx.fillRect(offsetX, offsetY, cell * gridW, cell * gridH);

  // 2. 网格线(淡)
  ctx.strokeStyle = COLORS.ink;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 1;
  for (let i = 0; i <= gridW; i++) {
    const x = offsetX + i * cell;
    ctx.beginPath();
    ctx.moveTo(x, offsetY);
    ctx.lineTo(x, offsetY + cell * gridH);
    ctx.stroke();
  }
  for (let i = 0; i <= gridH; i++) {
    const y = offsetY + i * cell;
    ctx.beginPath();
    ctx.moveTo(offsetX, y);
    ctx.lineTo(offsetX + cell * gridW, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 3. 墙(深色块)
  for (const wall of map.walls || []) {
    const wx = offsetX + wall.x * cell;
    const wy = offsetY + wall.y * cell;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(wx, wy, wall.w * cell, wall.h * cell);
  }

  // 4. 家具
  for (const obj of map.objects || []) {
    drawObject(ctx, obj, offsetX, offsetY, cell);
  }

  // 5. 终点(门)
  if (state.goal) {
    drawGoal(ctx, state.goal, offsetX, offsetY, cell);
  }

  // 6. 玩家(婉婉)
  drawWanwan(ctx, state.player, offsetX, offsetY, cell);

  // 7. 大场景描边(整张地图最外圈,玩具立体感)
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  roundRect(ctx, offsetX, offsetY, cell * gridW, cell * gridH, 12);
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

/**
 * 绘制家具(简化几何 + emoji 标识)
 */
function drawObject(ctx, obj, offsetX, offsetY, cell) {
  const [ox, oy] = obj.pos;
  const [ow, oh] = obj.size || [1, 1];
  const px = offsetX + ox * cell;
  const py = offsetY + oy * cell;
  const w = ow * cell;
  const h = oh * cell;

  // 装饰物(地毯)淡色,不挡路
  if (obj.decorative) {
    ctx.fillStyle = COLORS.action;
    ctx.globalAlpha = 0.2;
    roundRect(ctx, px + 4, py + 4, w - 8, h - 8, 8);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }

  // 实体家具:奶油底 + 黑边 + emoji
  ctx.fillStyle = COLORS.cardPale;
  roundRect(ctx, px + 3, py + 3, w - 6, h - 6, 8);
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.stroke();

  // emoji 居中
  const emoji = OBJ_EMOJI[obj.type] || '?';
  ctx.font = `${Math.floor(cell * 0.5)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(emoji, px + w / 2, py + h / 2);

  // tv (电视) 是小天的化身,加发光圈
  if (obj.type === 'tv' || obj.animate === 'xiaotian_glow') {
    ctx.strokeStyle = COLORS.action;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 4;
    roundRect(ctx, px + 6, py + 6, w - 12, h - 12, 6);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

const OBJ_EMOJI = {
  bed:    '🛏',
  desk:   '📚',
  tv:     '📺',
  rug:    '',  // decorative,已处理
  window: '🪟',
  lamp:   '💡',
  plant:  '🪴'
};

/**
 * 绘制终点(门)— 朱砂橙凸显
 */
function drawGoal(ctx, goal, offsetX, offsetY, cell) {
  const px = offsetX + goal.x * cell;
  const py = offsetY + goal.y * cell;

  // 朱砂橙底
  ctx.fillStyle = COLORS.action;
  roundRect(ctx, px + 4, py + 4, cell - 8, cell - 8, 6);
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  ctx.stroke();

  // 门把手
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(px + cell * 0.7, py + cell * 0.5, cell * 0.06, 0, Math.PI * 2);
  ctx.fill();

  // "终点"文字
  ctx.font = `bold ${Math.floor(cell * 0.22)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('门', px + cell / 2, py + cell * 0.78);
}

/**
 * 绘制婉婉(简化:粉色圆头身 + 微笑脸)
 */
function drawWanwan(ctx, player, offsetX, offsetY, cell) {
  const px = offsetX + player.x * cell + cell / 2;
  const py = offsetY + player.y * cell + cell / 2;
  const r = cell * 0.36;

  // 身体(便利贴黄圆角块)
  ctx.fillStyle = COLORS.cardWarm;
  roundRect(ctx, px - r, py - r, r * 2, r * 2, 8);
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  ctx.stroke();

  // 头(白色圆 + 黑边)
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(px, py - r * 0.2, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.stroke();

  // 两只眼睛
  const eyeR = r * 0.08;
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(px - r * 0.18, py - r * 0.25, eyeR, 0, Math.PI * 2);
  ctx.arc(px + r * 0.18, py - r * 0.25, eyeR, 0, Math.PI * 2);
  ctx.fill();

  // 微笑曲线
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(px, py - r * 0.05, r * 0.18, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

module.exports = { render, computeCellSize };
