// pages/game/_scene.js · Canvas 渲染层 · v7.2 设计 + 手绘儿童风
// 核心:粗黑描边 + 平涂色 + 微微抖动感
// 所有家具尺寸用 cell 比例计算,不硬编码

const COLORS = {
  bgDeep:   '#F5DEB3',
  bgLight:  '#FFE9B8',
  cardWarm: '#FFF1C9',
  cardPale: '#FFFCF2',
  ink:      '#2C2C2A',
  action:   '#FF6B47',
  // 角色专用色(婉婉服装,严格控制在视觉系统内)
  skin:     '#FDE3C3',  // 肤色
  pants:    '#3498DB',  // 蓝裤
  shirt:    '#FFFFFF',  // 白T
  cheek:    '#FF6B9D',  // 粉腮红
  // 场景点缀(只用于植物绿叶)
  leaf:     '#7BC76A'
};

// ===== 工具函数 =====

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

function strokedRoundRect(ctx, x, y, w, h, r, fill, strokeW) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = strokeW;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function strokedCircle(ctx, cx, cy, r, fill, strokeW) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = strokeW;
  ctx.stroke();
}

// ===== 主渲染 =====

function computeCellSize(canvasW, canvasH, gridW, gridH) {
  return Math.floor(Math.min(canvasW / gridW, canvasH / gridH));
}

function render(ctx, canvasW, canvasH, state, celebrationT) {
  const map = state.level.map;
  const [gridW, gridH] = map.size;
  const cell = computeCellSize(canvasW, canvasH, gridW, gridH);
  const offsetX = Math.floor((canvasW - cell * gridW) / 2);
  const offsetY = Math.floor((canvasH - cell * gridH) / 2);

  ctx.clearRect(0, 0, canvasW, canvasH);

  // 1. 整体底色(深米黄,代表"非地板区"基色)
  ctx.fillStyle = COLORS.bgDeep;
  ctx.fillRect(offsetX, offsetY, cell * gridW, cell * gridH);

  // 2. 计算每个格子的可走性
  const walkable = computeWalkableMap(map, gridW, gridH);

  // 3. 画可走格(每格独立的浅色"地板贴片",带淡描边)
  const tilePad = Math.max(2, Math.floor(cell * 0.04));
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      if (!walkable[y][x]) continue;
      const tx = offsetX + x * cell + tilePad;
      const ty = offsetY + y * cell + tilePad;
      const tw = cell - tilePad * 2;
      const th = cell - tilePad * 2;
      // 米黄底
      ctx.fillStyle = COLORS.cardWarm;
      roundRect(ctx, tx, ty, tw, th, 6);
      ctx.fill();
      // 淡描边(让格子之间有分界感)
      ctx.strokeStyle = COLORS.ink;
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // 4. 墙(实心黑块 + 砖纹,占满整格不留间隙)
  for (const wall of map.walls || []) {
    const wx = offsetX + wall.x * cell;
    const wy = offsetY + wall.y * cell;
    const ww = wall.w * cell;
    const wh = wall.h * cell;
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(wx, wy, ww, wh);
    // 砖纹
    ctx.strokeStyle = COLORS.bgLight;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    const brickH = Math.max(8, cell * 0.25);
    for (let by = wy + brickH; by < wy + wh; by += brickH) {
      ctx.beginPath();
      ctx.moveTo(wx, by);
      ctx.lineTo(wx + ww, by);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // 5. 装饰物(地毯)— 画在地板格上面
  for (const obj of map.objects || []) {
    if (obj.decorative) drawDecorative(ctx, obj, offsetX, offsetY, cell);
  }

  // 6. 家具
  for (const obj of map.objects || []) {
    if (!obj.decorative) drawObject(ctx, obj, offsetX, offsetY, cell);
  }

  // 7. 终点(门)— 在可走格上,用朱砂橙凸显
  if (state.goal) {
    drawDoor(ctx, state.goal, offsetX, offsetY, cell);
  }

  // 8. 婉婉
  drawWanwan(ctx, state.player, offsetX, offsetY, cell, celebrationT);

  // 庆祝时:婉婉头顶撒花瓣
  if (celebrationT != null && celebrationT > 0) {
    drawCelebrationPetals(ctx, state.player, offsetX, offsetY, cell, celebrationT);
  }

  // 9. 整体外圈描边
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  roundRect(ctx, offsetX + 1, offsetY + 1, cell * gridW - 2, cell * gridH - 2, 10);
  ctx.stroke();
}

/**
 * 算出每个格子的可走性 — 与 grid.js 的 isWalkable 一致
 * 墙永远阻挡;家具默认可走(只有 solid=true 才阻挡)
 */
function computeWalkableMap(map, gridW, gridH) {
  const grid = [];
  for (let y = 0; y < gridH; y++) {
    grid.push(new Array(gridW).fill(true));
  }
  for (const wall of map.walls || []) {
    for (let y = wall.y; y < wall.y + wall.h; y++) {
      for (let x = wall.x; x < wall.x + wall.w; x++) {
        if (y >= 0 && y < gridH && x >= 0 && x < gridW) grid[y][x] = false;
      }
    }
  }
  for (const obj of map.objects || []) {
    if (!obj.solid) continue;
    const [ox, oy] = obj.pos;
    const [ow, oh] = obj.size || [1, 1];
    for (let y = oy; y < oy + oh; y++) {
      for (let x = ox; x < ox + ow; x++) {
        if (y >= 0 && y < gridH && x >= 0 && x < gridW) grid[y][x] = false;
      }
    }
  }
  return grid;
}

// ===== 装饰物(地毯)=====

function drawDecorative(ctx, obj, offsetX, offsetY, cell) {
  const [ox, oy] = obj.pos;
  const [ow, oh] = obj.size || [1, 1];
  const px = offsetX + ox * cell;
  const py = offsetY + oy * cell;
  const w = ow * cell;
  const h = oh * cell;

  if (obj.type === 'rug') {
    // 朱砂橙底圆角矩形 + 米黄镶边
    ctx.globalAlpha = 0.28;
    roundRect(ctx, px + 4, py + 4, w - 8, h - 8, 12);
    ctx.fillStyle = COLORS.action;
    ctx.fill();
    // 镶边
    ctx.strokeStyle = COLORS.action;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    roundRect(ctx, px + 10, py + 10, w - 20, h - 20, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
}

// ===== 家具分发 =====

const OBJ_DRAWERS = {
  bed:    drawBed,
  desk:   drawDesk,
  tv:     drawXiaoTian,    // 电视位置 = 小天的发光球
  window: drawWindow,
  lamp:   drawLamp,
  plant:  drawPlant
};

function drawObject(ctx, obj, offsetX, offsetY, cell) {
  const [ox, oy] = obj.pos;
  const [ow, oh] = obj.size || [1, 1];
  const px = offsetX + ox * cell;
  const py = offsetY + oy * cell;
  const w = ow * cell;
  const h = oh * cell;

  const drawer = OBJ_DRAWERS[obj.type];
  if (drawer) {
    drawer(ctx, px, py, w, h, cell);
  } else {
    // fallback:简单卡片
    strokedRoundRect(ctx, px + 4, py + 4, w - 8, h - 8, 8, COLORS.cardPale, 3);
  }
}

// ===== 床 =====
function drawBed(ctx, px, py, w, h, cell) {
  const pad = 4;
  // 床体(白色被子)
  strokedRoundRect(ctx, px + pad, py + pad, w - 2 * pad, h - 2 * pad, 14, '#FFFFFF', 4);

  // 床头板(左侧 1/3,深一点)
  strokedRoundRect(ctx, px + pad, py + pad, (w - 2 * pad) * 0.32, h - 2 * pad, 10, COLORS.cardPale, 4);

  // 枕头(在床头板里)
  const pillowX = px + pad + 8;
  const pillowY = py + pad + 8;
  const pillowW = (w - 2 * pad) * 0.32 - 16;
  const pillowH = (h - 2 * pad) * 0.4;
  strokedRoundRect(ctx, pillowX, pillowY, pillowW, pillowH, 6, '#FFFFFF', 2.5);

  // 被子条纹(右侧)
  const stripeX = px + pad + (w - 2 * pad) * 0.4;
  const stripeY = py + pad + 12;
  const stripeW = (w - 2 * pad) * 0.55;
  ctx.strokeStyle = COLORS.action;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const y = stripeY + i * (h - pad * 2 - 24) / 3 + 8;
    ctx.beginPath();
    ctx.moveTo(stripeX + 4, y);
    ctx.lineTo(stripeX + stripeW - 4, y);
    ctx.stroke();
  }
}

// ===== 桌子 =====
function drawDesk(ctx, px, py, w, h, cell) {
  const pad = 5;
  // 桌面(浅色板子)
  strokedRoundRect(ctx, px + pad, py + pad, w - 2 * pad, h - 2 * pad, 10, COLORS.cardPale, 4);

  // 桌上一本书(朱砂橙)
  const bookX = px + w * 0.25;
  const bookY = py + h * 0.3;
  const bookW = w * 0.25;
  const bookH = h * 0.45;
  strokedRoundRect(ctx, bookX, bookY, bookW, bookH, 3, COLORS.action, 3);
  // 书脊线
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bookX + 4, bookY + bookH * 0.3);
  ctx.lineTo(bookX + bookW - 4, bookY + bookH * 0.3);
  ctx.moveTo(bookX + 4, bookY + bookH * 0.6);
  ctx.lineTo(bookX + bookW - 4, bookY + bookH * 0.6);
  ctx.stroke();

  // 桌右侧一个咖啡杯
  const cupX = px + w * 0.62;
  const cupY = py + h * 0.4;
  const cupR = h * 0.18;
  strokedCircle(ctx, cupX, cupY, cupR, COLORS.cardWarm, 3);
  // 杯把
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cupX + cupR + 2, cupY, cupR * 0.4, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
}

// ===== 小天(发光球)=====
function drawXiaoTian(ctx, px, py, w, h, cell) {
  const cx = px + w / 2;
  const cy = py + h / 2;
  const baseR = Math.min(w, h) * 0.3;

  // 外圈光晕(浅色,半透明)
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = COLORS.action;
  ctx.beginPath();
  ctx.arc(cx, cy, baseR * 1.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.arc(cx, cy, baseR * 1.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 主体球(白色 + 描边)
  strokedCircle(ctx, cx, cy, baseR, '#FFFFFF', 3);

  // 内部小高光
  ctx.fillStyle = COLORS.cardPale;
  ctx.beginPath();
  ctx.arc(cx - baseR * 0.3, cy - baseR * 0.3, baseR * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // 微表情(两点眼睛 + 微笑)
  const eyeR = baseR * 0.10;
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(cx - baseR * 0.3, cy - baseR * 0.05, eyeR, 0, Math.PI * 2);
  ctx.arc(cx + baseR * 0.3, cy - baseR * 0.05, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy + baseR * 0.1, baseR * 0.32, 0.18 * Math.PI, 0.82 * Math.PI);
  ctx.stroke();

  // 周围 4 个发光小点
  ctx.fillStyle = COLORS.action;
  const sparkR = baseR * 0.08;
  const sparkD = baseR * 1.5;
  [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(cx + dx * sparkD, cy + dy * sparkD, sparkR, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ===== 窗户 =====
function drawWindow(ctx, px, py, w, h, cell) {
  const pad = 5;
  // 窗框(白色底)
  strokedRoundRect(ctx, px + pad, py + pad, w - 2 * pad, h - 2 * pad, 6, '#D9F0FF', 4);

  // 十字框
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(px + w / 2, py + pad + 4);
  ctx.lineTo(px + w / 2, py + h - pad - 4);
  ctx.moveTo(px + pad + 4, py + h / 2);
  ctx.lineTo(px + w - pad - 4, py + h / 2);
  ctx.stroke();
}

// ===== 灯 =====
function drawLamp(ctx, px, py, w, h, cell) {
  const cx = px + w / 2;
  // 灯罩(梯形,朱砂橙)
  ctx.fillStyle = COLORS.action;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.32, py + h * 0.18);
  ctx.lineTo(cx + w * 0.32, py + h * 0.18);
  ctx.lineTo(cx + w * 0.42, py + h * 0.55);
  ctx.lineTo(cx - w * 0.42, py + h * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // 灯杆
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, py + h * 0.55);
  ctx.lineTo(cx, py + h * 0.85);
  ctx.stroke();
  // 底座
  strokedRoundRect(ctx, cx - w * 0.22, py + h * 0.82, w * 0.44, h * 0.10, 4, COLORS.cardPale, 3);
}

// ===== 植物 =====
function drawPlant(ctx, px, py, w, h, cell) {
  const cx = px + w / 2;
  const potTop = py + h * 0.55;
  // 花盆
  ctx.fillStyle = COLORS.action;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.32, potTop);
  ctx.lineTo(cx + w * 0.32, potTop);
  ctx.lineTo(cx + w * 0.26, py + h * 0.88);
  ctx.lineTo(cx - w * 0.26, py + h * 0.88);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // 盆口高光
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.32, potTop + 2);
  ctx.lineTo(cx + w * 0.32, potTop + 2);
  ctx.stroke();

  // 三片叶子
  const leafColors = [COLORS.leaf, COLORS.leaf, COLORS.leaf];
  const leafPositions = [
    { cx: cx - w * 0.18, cy: py + h * 0.30, r: w * 0.20, rot: -0.3 },
    { cx: cx,             cy: py + h * 0.20, r: w * 0.22, rot: 0 },
    { cx: cx + w * 0.18, cy: py + h * 0.32, r: w * 0.18, rot: 0.3 }
  ];
  leafPositions.forEach((leaf, i) => {
    ctx.save();
    ctx.translate(leaf.cx, leaf.cy);
    ctx.rotate(leaf.rot);
    ctx.fillStyle = leafColors[i];
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, leaf.r * 0.7, leaf.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 叶脉
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -leaf.r);
    ctx.lineTo(0, leaf.r);
    ctx.stroke();
    ctx.restore();
  });
}

// ===== 门(终点)=====
function drawDoor(ctx, goal, offsetX, offsetY, cell) {
  const px = offsetX + goal.x * cell;
  const py = offsetY + goal.y * cell;
  const pad = 4;

  // 门框(黑色描边大圆角)
  strokedRoundRect(ctx, px + pad, py + pad, cell - 2 * pad, cell - 2 * pad, 10, COLORS.action, 4);

  // 门内的板纹(竖直 2 条)
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(px + cell * 0.38, py + pad + 8);
  ctx.lineTo(px + cell * 0.38, py + cell - pad - 8);
  ctx.moveTo(px + cell * 0.62, py + pad + 8);
  ctx.lineTo(px + cell * 0.62, py + cell - pad - 8);
  ctx.stroke();

  // 门把手(白色小圆)
  strokedCircle(ctx, px + cell * 0.78, py + cell * 0.5, cell * 0.06, '#FFFFFF', 2);

  // 上方"出口"指示带
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(px + pad + 4, py + pad + 4, cell - 2 * pad - 8, 6);
}

// ===== 婉婉(主角,3 头身儿童)=====
// 严格约束:整体所有元素必须在 cell × 0.92 范围内,不超出格子
// celebrationT: 0..1 庆祝动画进度,null 时为静止站姿
function drawWanwan(ctx, player, offsetX, offsetY, cell, celebrationT) {
  // 庆祝时的"跳起来"位移:用一个抛物线,t=0 在地面,t=0.5 顶点,t=1 落回
  let jumpOffset = 0;
  let armRaise = 0;       // 0 = 双手垂下,1 = 双手举到头顶
  if (celebrationT != null && celebrationT > 0) {
    // 抛物线 4t(1-t),t=0.5 时为 1
    jumpOffset = -cell * 0.30 * 4 * celebrationT * (1 - celebrationT);
    // 手臂从 0 升到 1,在 t=0.3 时达到峰值,然后保持
    armRaise = Math.min(1, celebrationT * 3);
  }

  // 格子的中心和有效绘图区
  const cellLeft = offsetX + player.x * cell;
  const cellTop = offsetY + player.y * cell + jumpOffset;
  const cx = cellLeft + cell / 2;
  const totalH = cell * 0.92;
  const top = cellTop + cell * 0.04;
  const bottom = top + totalH;
  const totalW = cell * 0.62;

  const headH = totalH * 0.40;
  const headR = headH * 0.50;
  const headCy = top + headR + headH * 0.05;
  const bodyH = totalH * 0.30;
  const bodyTop = headCy + headR * 0.85;
  const bodyW = totalW * 0.70;
  const legZoneH = bottom - (bodyTop + bodyH);
  const legH = legZoneH * 0.65;
  const shoeH = legZoneH * 0.35;
  const legTop = bodyTop + bodyH;
  const shoeTop = legTop + legH;

  // ----- 抖动线(收紧,确保不超出格子)-----
  ctx.strokeStyle = COLORS.action;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  // 只画 3 条小斜线,完全在 cell × 0.85 内
  const wobbleR = totalW * 0.55; // 距 cx 的距离上限
  const wobbles = [
    { x1: cx - wobbleR * 0.95, y1: headCy - headR * 0.3, x2: cx - wobbleR * 1.05, y2: headCy - headR * 0.5 },
    { x1: cx + wobbleR * 0.95, y1: headCy - headR * 0.3, x2: cx + wobbleR * 1.05, y2: headCy - headR * 0.5 },
    { x1: cx + wobbleR * 0.85, y1: bodyTop + bodyH * 0.5, x2: cx + wobbleR * 1.0, y2: bodyTop + bodyH * 0.7 }
  ];
  // 边界检查:超出 cell 就不画
  wobbles.forEach(w => {
    if (Math.max(w.x1, w.x2) > cellLeft + cell - 2) return;
    if (Math.min(w.x1, w.x2) < cellLeft + 2) return;
    ctx.beginPath();
    ctx.moveTo(w.x1, w.y1);
    ctx.lineTo(w.x2, w.y2);
    ctx.stroke();
  });

  // ----- 腿(蓝裤)-----
  const legW = bodyW * 0.30;
  strokedRoundRect(ctx, cx - bodyW * 0.30 - legW / 2, legTop, legW, legH, 3, COLORS.pants, 2);
  strokedRoundRect(ctx, cx + bodyW * 0.30 - legW / 2, legTop, legW, legH, 3, COLORS.pants, 2);

  // ----- 鞋(白色,稍宽)-----
  const shoeW = legW * 1.15;
  strokedRoundRect(ctx, cx - bodyW * 0.30 - shoeW / 2, shoeTop, shoeW, shoeH, 3, '#FFFFFF', 2);
  strokedRoundRect(ctx, cx + bodyW * 0.30 - shoeW / 2, shoeTop, shoeW, shoeH, 3, '#FFFFFF', 2);

  // ----- 躯干(白T)-----
  strokedRoundRect(ctx, cx - bodyW / 2, bodyTop, bodyW, bodyH, 5, COLORS.shirt, 2.5);

  // ----- 手臂(肤色)-----
  // 静止时垂在躯干两侧;庆祝时举到头顶两侧(欢呼姿势)
  const armW = bodyW * 0.16;
  const armH = bodyH * 0.65;
  if (armRaise > 0) {
    // 举手姿势:手臂转 60 度斜向上,锚点在肩膀
    const shoulderLY = bodyTop + 4;
    const shoulderLX = cx - bodyW / 2 + armW * 0.4;
    const shoulderRY = bodyTop + 4;
    const shoulderRX = cx + bodyW / 2 - armW * 0.4;
    // 手臂末端位置(从肩斜向上)
    const angle = (1 - armRaise) * 0   // 0 度 = 完全举起
                + armRaise * (-Math.PI / 3); // -60 度
    // 实际:armRaise 决定旋转角度,从 90deg(垂下)到 -45deg(斜向上)
    const fromAngle = Math.PI / 2;     // 垂直向下
    const toAngle   = -Math.PI / 4;    // 斜向上举
    const a = fromAngle + (toAngle - fromAngle) * armRaise;
    // 左臂:相对垂直向下 90 度的镜像,所以另一个 a
    const aL = Math.PI - a;
    // 绘制手臂(扁矩形从肩出发)
    [{ sx: shoulderLX, sy: shoulderLY, ang: aL },
     { sx: shoulderRX, sy: shoulderRY, ang: a }].forEach(s => {
      ctx.save();
      ctx.translate(s.sx, s.sy);
      ctx.rotate(s.ang - Math.PI / 2);
      strokedRoundRect(ctx, -armW / 2, 0, armW, armH, 3, COLORS.skin, 2);
      ctx.restore();
    });
  } else {
    strokedRoundRect(ctx, cx - bodyW / 2 - armW * 0.5, bodyTop + 2, armW, armH, 3, COLORS.skin, 2);
    strokedRoundRect(ctx, cx + bodyW / 2 - armW * 0.5, bodyTop + 2, armW, armH, 3, COLORS.skin, 2);
  }

  // ----- 头(肤色圆)-----
  strokedCircle(ctx, cx, headCy, headR, COLORS.skin, 2.5);

  // ----- 黑色短发 -----
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.ellipse(cx, headCy - headR * 0.10, headR * 1.0, headR * 0.65, 0, Math.PI, 0);
  ctx.fill();

  // ----- 白色棒球鸭舌帽 -----
  // 帽冠(半圆,严格在头宽内)
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(cx, headCy - headR * 0.50, headR * 0.95, headR * 0.50, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  // 帽舌(向前小梯形,**收紧**:从 1.3 改成 1.0,完全在格子内)
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(cx + headR * 0.20, headCy - headR * 0.18);
  ctx.lineTo(cx + headR * 1.0,  headCy - headR * 0.05);
  ctx.lineTo(cx + headR * 1.0,  headCy + headR * 0.08);
  ctx.lineTo(cx + headR * 0.20, headCy + headR * 0.0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 帽前粉色心
  ctx.fillStyle = COLORS.cheek;
  const heartCy = headCy - headR * 0.50;
  const heartSize = headR * 0.20;
  ctx.beginPath();
  ctx.arc(cx - heartSize * 0.4, heartCy - heartSize * 0.1, heartSize * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + heartSize * 0.4, heartCy - heartSize * 0.1, heartSize * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - heartSize * 0.85, heartCy);
  ctx.lineTo(cx + heartSize * 0.85, heartCy);
  ctx.lineTo(cx, heartCy + heartSize * 0.7);
  ctx.closePath();
  ctx.fill();

  // ----- 脸部 -----
  // 两只大眼睛
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.ellipse(cx - headR * 0.32, headCy + headR * 0.10, headR * 0.10, headR * 0.14, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + headR * 0.32, headCy + headR * 0.10, headR * 0.10, headR * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  // 眼睛高光
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx - headR * 0.30, headCy + headR * 0.06, headR * 0.04, 0, Math.PI * 2);
  ctx.arc(cx + headR * 0.34, headCy + headR * 0.06, headR * 0.04, 0, Math.PI * 2);
  ctx.fill();

  // 微笑
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, headCy + headR * 0.30, headR * 0.18, 0.18 * Math.PI, 0.82 * Math.PI);
  ctx.stroke();

  // 腮红(向脸内收一点,不超出脸轮廓)
  ctx.fillStyle = COLORS.cheek;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(cx - headR * 0.50, headCy + headR * 0.28, headR * 0.12, 0, Math.PI * 2);
  ctx.arc(cx + headR * 0.50, headCy + headR * 0.28, headR * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

module.exports = { render, computeCellSize };

// ===== 庆祝撒花瓣 =====
// 婉婉头顶撒出 8 个朱砂橙小花瓣,放射状飞出 + 重力下落
function drawCelebrationPetals(ctx, player, offsetX, offsetY, cell, t) {
  if (t <= 0) return;
  const cx = offsetX + player.x * cell + cell / 2;
  // 头顶位置(婉婉在跳起,但花瓣从原始头顶位置起算更稳)
  const cy0 = offsetY + player.y * cell + cell * 0.20;

  const PETALS = 8;
  const radius = cell * 0.6;
  for (let i = 0; i < PETALS; i++) {
    // 每个花瓣的飞行方向(均匀分布在上半圆)
    const angle = -Math.PI + (i + 0.5) * (Math.PI / PETALS);
    // 飞行距离随 t 线性增长
    const dist = radius * t * 1.4;
    // 重力:t² 让后期向下加速
    const gravity = cell * 1.0 * t * t;
    const px = cx + Math.cos(angle) * dist;
    const py = cy0 + Math.sin(angle) * dist + gravity;
    // 大小:从大缩小,但末期不至于消失到看不见
    const size = cell * 0.10 * (1 - t * 0.4);
    // 旋转
    const rot = angle + t * 4;
    // 透明度:渐隐
    const alpha = Math.max(0, 1 - Math.pow(t, 1.3));

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(px, py);
    ctx.rotate(rot);
    // 花瓣:小椭圆,朱砂橙底 + 黑描边
    ctx.fillStyle = COLORS.action;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
