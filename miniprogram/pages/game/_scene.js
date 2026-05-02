// pages/game/_scene.js · Canvas 场景渲染(角色设计符合 aiGame/SKILL.md)
//
// 设计参照 assets/_prompts/wanwan.prompt.txt:
// - 婉婉:3 头身拟人,白色鸭舌帽,黑色短发,白 T,蓝裤
// - 小天:发光球(2-3 圈光晕)
// - 其他机器人:大圆头 + 梯形身,无手脚(本关卡无)
//
// 颜色受 v7.2 限制(米黄系 + 墨黑 + 朱砂橙),婉婉服装色作为例外允许

const C = {
  bgDeep:   '#F5DEB3',
  bgLight:  '#FFE9B8',
  cardWarm: '#FFF1C9',
  cardPale: '#FFFCF2',
  ink:      '#2C2C2A',
  action:   '#FF6B47',
  // 婉婉专属(skin / hair / pants / shirt 共 4 色)
  skin:     '#FDE3C3',
  pants:    '#3498DB',
  shirt:    '#FFFFFF',
  cheek:    '#FF6B9D',
  // 小天发光
  glowCore: '#FFD93D',
  glowSoft: 'rgba(255, 217, 61, 0.35)'
};

function computeCellSize(canvasW, canvasH, gridW, gridH) {
  return Math.floor(Math.min(canvasW / gridW, canvasH / gridH));
}

function render(ctx, canvasW, canvasH, state) {
  const map = state.level.map;
  const [gridW, gridH] = map.size;
  const cell = computeCellSize(canvasW, canvasH, gridW, gridH);
  const offsetX = Math.floor((canvasW - cell * gridW) / 2);
  const offsetY = Math.floor((canvasH - cell * gridH) / 2);

  ctx.clearRect(0, 0, canvasW, canvasH);

  // 1. 地板背景
  ctx.fillStyle = C.cardWarm;
  ctx.fillRect(offsetX, offsetY, cell * gridW, cell * gridH);

  // 2. 网格线(虚线感,淡)
  ctx.strokeStyle = C.ink;
  ctx.globalAlpha = 0.15;
  ctx.lineWidth = 1;
  for (let i = 1; i < gridW; i++) {
    const x = offsetX + i * cell;
    ctx.beginPath();
    ctx.moveTo(x, offsetY); ctx.lineTo(x, offsetY + cell * gridH);
    ctx.stroke();
  }
  for (let i = 1; i < gridH; i++) {
    const y = offsetY + i * cell;
    ctx.beginPath();
    ctx.moveTo(offsetX, y); ctx.lineTo(offsetX + cell * gridW, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 3. 墙(深色块,粗实线)
  for (const wall of map.walls || []) {
    const wx = offsetX + wall.x * cell;
    const wy = offsetY + wall.y * cell;
    ctx.fillStyle = C.ink;
    ctx.fillRect(wx, wy, wall.w * cell, wall.h * cell);
  }

  // 4. 家具
  for (const obj of map.objects || []) {
    drawObject(ctx, obj, offsetX, offsetY, cell);
  }

  // 5. 终点门
  if (state.goal) drawGoalDoor(ctx, state.goal, offsetX, offsetY, cell);

  // 6. 玩家(婉婉)
  drawWanwan(ctx, state.player, offsetX, offsetY, cell);

  // 7. 大场景外圈描边(玩具立体感)
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 4;
  roundRect(ctx, offsetX + 1, offsetY + 1, cell * gridW - 2, cell * gridH - 2, 10);
  ctx.stroke();
}

// ============================================================
// 工具
// ============================================================
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

function fillStroke(ctx, fillColor, strokeColor, lineWidth) {
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

// ============================================================
// 家具:全部用几何形状 + 黑描边绘制(无 emoji)
// ============================================================
function drawObject(ctx, obj, offsetX, offsetY, cell) {
  const [ox, oy] = obj.pos;
  const [ow, oh] = obj.size || [1, 1];
  const px = offsetX + ox * cell;
  const py = offsetY + oy * cell;
  const w = ow * cell;
  const h = oh * cell;

  // 装饰物(地毯)
  if (obj.decorative) {
    ctx.fillStyle = C.action;
    ctx.globalAlpha = 0.18;
    roundRect(ctx, px + 4, py + 4, w - 8, h - 8, 10);
    ctx.fill();
    // 加几条简单条纹
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = C.action;
    ctx.lineWidth = 2;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(px + 8, py + h * (i / 3));
      ctx.lineTo(px + w - 8, py + h * (i / 3));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return;
  }

  // 床
  if (obj.type === 'bed') {
    drawBed(ctx, px, py, w, h);
    return;
  }
  // 桌子
  if (obj.type === 'desk') {
    drawDesk(ctx, px, py, w, h);
    return;
  }
  // 电视(小天的化身)
  if (obj.type === 'tv' || obj.animate === 'xiaotian_glow') {
    drawXiaoTian(ctx, px, py, w, h);
    return;
  }
  // 窗户
  if (obj.type === 'window') {
    drawWindow(ctx, px, py, w, h);
    return;
  }
  // 灯
  if (obj.type === 'lamp') {
    drawLamp(ctx, px, py, w, h);
    return;
  }
  // 植物
  if (obj.type === 'plant') {
    drawPlant(ctx, px, py, w, h);
    return;
  }
  // 默认:卡片底 + 类型字
  ctx.fillStyle = C.cardPale;
  roundRect(ctx, px + 3, py + 3, w - 6, h - 6, 8);
  fillStroke(ctx, C.cardPale, C.ink, 3);
}

function drawBed(ctx, px, py, w, h) {
  // 床头(顶部 1/3 深一档)
  const headH = h * 0.35;
  // 床体
  ctx.beginPath();
  roundRect(ctx, px + 4, py + 4, w - 8, h - 8, 10);
  fillStroke(ctx, C.cardPale, C.ink, 3);
  // 床头板
  ctx.beginPath();
  roundRect(ctx, px + 4, py + 4, w - 8, headH, 8);
  fillStroke(ctx, C.bgDeep, C.ink, 3);
  // 枕头(白色矩形)
  const pwx = px + 12;
  const pwy = py + 8;
  const pww = (w - 24) * 0.5;
  const pwh = headH - 14;
  ctx.beginPath();
  roundRect(ctx, pwx, pwy, pww, pwh, 6);
  fillStroke(ctx, '#FFFFFF', C.ink, 2);
  // 被子条纹
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.4;
  for (let i = 1; i <= 3; i++) {
    const y = py + headH + 8 + (h - headH - 16) * (i / 4);
    ctx.beginPath();
    ctx.moveTo(px + 12, y);
    ctx.lineTo(px + w - 12, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawDesk(ctx, px, py, w, h) {
  // 桌面
  ctx.beginPath();
  roundRect(ctx, px + 4, py + h * 0.3, w - 8, h * 0.45, 4);
  fillStroke(ctx, C.bgDeep, C.ink, 3);
  // 桌腿(两侧细条)
  ctx.fillStyle = C.ink;
  ctx.fillRect(px + 8, py + h * 0.7, 6, h * 0.25);
  ctx.fillRect(px + w - 14, py + h * 0.7, 6, h * 0.25);
  // 桌上一本书
  ctx.beginPath();
  roundRect(ctx, px + w * 0.3, py + h * 0.1, w * 0.4, h * 0.22, 3);
  fillStroke(ctx, C.action, C.ink, 2);
}

function drawXiaoTian(ctx, px, py, w, h) {
  // 小天 = 发光球(电视机的位置代表他在房间里)
  const cx = px + w / 2;
  const cy = py + h / 2;
  const r = Math.min(w, h) * 0.36;
  // 外层光晕 3 圈
  for (let i = 3; i >= 1; i--) {
    ctx.fillStyle = `rgba(255, 217, 61, ${0.12 * i})`;
    ctx.beginPath();
    ctx.arc(cx, cy, r * (1 + i * 0.18), 0, Math.PI * 2);
    ctx.fill();
  }
  // 核心球
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  fillStroke(ctx, C.glowCore, C.ink, 3);
  // 高光
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

function drawWindow(ctx, px, py, w, h) {
  // 窗户:浅蓝底 + 十字框
  ctx.beginPath();
  roundRect(ctx, px + 4, py + 4, w - 8, h - 8, 4);
  fillStroke(ctx, '#A8D8EA', C.ink, 3);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px + w / 2, py + 6);
  ctx.lineTo(px + w / 2, py + h - 6);
  ctx.moveTo(px + 6, py + h / 2);
  ctx.lineTo(px + w - 6, py + h / 2);
  ctx.stroke();
}

function drawLamp(ctx, px, py, w, h) {
  const cx = px + w / 2;
  // 灯罩(梯形)
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.3, py + h * 0.25);
  ctx.lineTo(cx + w * 0.3, py + h * 0.25);
  ctx.lineTo(cx + w * 0.4, py + h * 0.55);
  ctx.lineTo(cx - w * 0.4, py + h * 0.55);
  ctx.closePath();
  fillStroke(ctx, C.action, C.ink, 3);
  // 灯杆
  ctx.fillStyle = C.ink;
  ctx.fillRect(cx - 3, py + h * 0.55, 6, h * 0.3);
  // 底座
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.25, py + h * 0.85);
  ctx.lineTo(cx + w * 0.25, py + h * 0.85);
  ctx.lineTo(cx + w * 0.2, py + h * 0.95);
  ctx.lineTo(cx - w * 0.2, py + h * 0.95);
  ctx.closePath();
  fillStroke(ctx, C.bgDeep, C.ink, 3);
}

function drawPlant(ctx, px, py, w, h) {
  const cx = px + w / 2;
  // 盆
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.3, py + h * 0.6);
  ctx.lineTo(cx + w * 0.3, py + h * 0.6);
  ctx.lineTo(cx + w * 0.25, py + h * 0.9);
  ctx.lineTo(cx - w * 0.25, py + h * 0.9);
  ctx.closePath();
  fillStroke(ctx, C.action, C.ink, 3);
  // 叶子(几片绿色椭圆)
  const leafColor = '#7BC76A';
  for (const off of [[-w*0.18, h*0.3], [w*0.18, h*0.32], [0, h*0.18]]) {
    ctx.beginPath();
    ctx.ellipse(cx + off[0], py + off[1], w * 0.16, h * 0.18, 0, 0, Math.PI * 2);
    fillStroke(ctx, leafColor, C.ink, 2);
  }
}

// ============================================================
// 终点门(放在墙上,朱砂橙凸显)
// ============================================================
function drawGoalDoor(ctx, goal, offsetX, offsetY, cell) {
  const px = offsetX + goal.x * cell;
  const py = offsetY + goal.y * cell;

  // 门框(朱砂橙)
  ctx.beginPath();
  roundRect(ctx, px + 4, py + 4, cell - 8, cell - 8, 6);
  fillStroke(ctx, C.action, C.ink, 4);

  // 门把手
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(px + cell * 0.72, py + cell * 0.5, cell * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // 门面竖线分隔
  ctx.strokeStyle = '#FFFFFF';
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px + cell * 0.5, py + cell * 0.15);
  ctx.lineTo(px + cell * 0.5, py + cell * 0.85);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// ============================================================
// 婉婉(3 头身拟人 · 白帽 · 黑发 · 蓝裤)
// 占据 1 格,身高 ≈ 0.85 cell
// ============================================================
function drawWanwan(ctx, player, offsetX, offsetY, cell) {
  const cx = offsetX + player.x * cell + cell / 2;
  const baseY = offsetY + (player.y + 1) * cell - cell * 0.05;  // 脚底

  // 总身高(3 头身,头占 1/3)
  const totalH = cell * 0.86;
  const headR = totalH * 0.18;        // 头半径(头总高 = 2*headR ≈ 1/3)
  const bodyTop = baseY - totalH;
  const headCY = bodyTop + headR;
  const headCX = cx;

  // 身体几个 y 坐标
  const shoulderY = headCY + headR + 2;
  const waistY    = bodyTop + totalH * 0.62;
  const hipY      = bodyTop + totalH * 0.78;

  // 阴影(脚下小椭圆)
  ctx.fillStyle = C.ink;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, totalH * 0.22, totalH * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // ============ 腿(蓝色短裤 + 露出的小腿/鞋)============
  const legW = totalH * 0.10;
  const legX1 = cx - totalH * 0.1;  // 左腿
  const legX2 = cx + totalH * 0.1;  // 右腿

  // 鞋(白色)
  ctx.beginPath();
  roundRect(ctx, legX1 - legW / 2, baseY - totalH * 0.06, legW, totalH * 0.06, 3);
  fillStroke(ctx, C.shirt, C.ink, 2);
  ctx.beginPath();
  roundRect(ctx, legX2 - legW / 2, baseY - totalH * 0.06, legW, totalH * 0.06, 3);
  fillStroke(ctx, C.shirt, C.ink, 2);

  // 小腿(肤色)
  ctx.beginPath();
  ctx.fillStyle = C.skin;
  ctx.fillRect(legX1 - legW / 2 + 1, hipY + totalH * 0.05, legW - 2, totalH * 0.13);
  ctx.fillRect(legX2 - legW / 2 + 1, hipY + totalH * 0.05, legW - 2, totalH * 0.13);

  // 蓝色短裤(覆盖腿上半段)
  const pantsW = totalH * 0.36;
  ctx.beginPath();
  roundRect(ctx, cx - pantsW / 2, waistY, pantsW, totalH * 0.20, 4);
  fillStroke(ctx, C.pants, C.ink, 3);

  // ============ 上身(白 T 恤)============
  const torsoW = totalH * 0.40;
  ctx.beginPath();
  roundRect(ctx, cx - torsoW / 2, shoulderY, torsoW, waistY - shoulderY + 4, 6);
  fillStroke(ctx, C.shirt, C.ink, 3);

  // ============ 手臂(肤色短小段)============
  const armW = totalH * 0.07;
  const armH = totalH * 0.18;
  // 左臂
  ctx.beginPath();
  roundRect(ctx, cx - torsoW / 2 - armW + 2, shoulderY + 4, armW, armH, 3);
  fillStroke(ctx, C.skin, C.ink, 2);
  // 右臂
  ctx.beginPath();
  roundRect(ctx, cx + torsoW / 2 - 2, shoulderY + 4, armW, armH, 3);
  fillStroke(ctx, C.skin, C.ink, 2);

  // ============ 头(肤色圆)============
  ctx.beginPath();
  ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
  fillStroke(ctx, C.skin, C.ink, 3);

  // ============ 黑色短发(头上半部分)============
  ctx.beginPath();
  // 上半圆 + 鬓角
  ctx.arc(headCX, headCY, headR + 1, Math.PI, Math.PI * 2);
  ctx.lineTo(headCX + headR * 0.95, headCY + headR * 0.3);
  ctx.lineTo(headCX - headR * 0.95, headCY + headR * 0.3);
  ctx.closePath();
  fillStroke(ctx, '#1A1A1A', C.ink, 2);

  // ============ 白色鸭舌帽 ============
  // 帽冠
  ctx.beginPath();
  ctx.arc(headCX, headCY - headR * 0.05, headR * 1.05, Math.PI * 1.05, Math.PI * 1.95);
  ctx.lineTo(headCX + headR, headCY - headR * 0.1);
  ctx.lineTo(headCX - headR, headCY - headR * 0.1);
  ctx.closePath();
  fillStroke(ctx, C.shirt, C.ink, 2.5);
  // 帽檐(向前伸)
  ctx.beginPath();
  ctx.ellipse(headCX, headCY - headR * 0.08, headR * 1.25, headR * 0.18, 0, 0, Math.PI);
  fillStroke(ctx, C.shirt, C.ink, 2.5);
  // 帽前的粉色小心(标志)
  ctx.beginPath();
  ctx.arc(headCX, headCY - headR * 0.45, headR * 0.13, 0, Math.PI * 2);
  fillStroke(ctx, C.cheek, C.ink, 1.5);

  // ============ 五官 ============
  // 眼睛(困困脸:大椭圆,黑瞳白底)
  const eyeY = headCY + headR * 0.05;
  const eyeOff = headR * 0.32;
  // 左
  ctx.beginPath();
  ctx.ellipse(headCX - eyeOff, eyeY, headR * 0.16, headR * 0.18, 0, 0, Math.PI * 2);
  fillStroke(ctx, '#FFFFFF', C.ink, 1.5);
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(headCX - eyeOff, eyeY + 1, headR * 0.08, 0, Math.PI * 2);
  ctx.fill();
  // 右
  ctx.beginPath();
  ctx.ellipse(headCX + eyeOff, eyeY, headR * 0.16, headR * 0.18, 0, 0, Math.PI * 2);
  fillStroke(ctx, '#FFFFFF', C.ink, 1.5);
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(headCX + eyeOff, eyeY + 1, headR * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // 微笑(小弧线)
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(headCX, headCY + headR * 0.32, headR * 0.18, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // 腮红(两边小粉点)
  ctx.fillStyle = C.cheek;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(headCX - headR * 0.55, headCY + headR * 0.35, headR * 0.1, 0, Math.PI * 2);
  ctx.arc(headCX + headR * 0.55, headCY + headR * 0.35, headR * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 周围抖动线(2 条小竖线表示"动")
  if (player.facing) {
    ctx.strokeStyle = C.action;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - totalH * 0.35, bodyTop + totalH * 0.5);
    ctx.lineTo(cx - totalH * 0.42, bodyTop + totalH * 0.5);
    ctx.moveTo(cx + totalH * 0.35, bodyTop + totalH * 0.5);
    ctx.lineTo(cx + totalH * 0.42, bodyTop + totalH * 0.5);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

module.exports = { render, computeCellSize };
