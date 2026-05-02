# Phaser → 小程序 Canvas 翻译表

> 这份文档供阶段 4(Canvas 渲染层)使用。当前 game.js 用 Phaser 调用 159 处 API,
> 需要逐一翻译成小程序原生 Canvas 2D。

## 1. 上下文获取

**Phaser**(自动管理):
```js
class MainScene extends Phaser.Scene {
  create() {
    const g = this.add.graphics();
  }
}
```

**小程序原生**(手动获取):
```js
// pages/game/index.js
onReady() {
  const query = wx.createSelectorQuery();
  query.select('#game-canvas')
    .fields({ node: true, size: true })
    .exec((res) => {
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      // 高 DPR 适配
      const dpr = wx.getSystemInfoSync().pixelRatio;
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      ctx.scale(dpr, dpr);
      this.ctx = ctx;
    });
}
```

## 2. 常用调用对应表

| Phaser API | 小程序 Canvas 等价 | 备注 |
|---|---|---|
| `this.add.graphics()` | `ctx`(直接绘制,不需要"对象") | Canvas 是命令式,无需保留对象引用 |
| `g.fillStyle(0x...)` | `ctx.fillStyle = '#...'` | Phaser 用十六进制数字,Canvas 用字符串 |
| `g.lineStyle(w, color)` | `ctx.strokeStyle = '#...';\nctx.lineWidth = w` | 分两步 |
| `g.fillRect(x,y,w,h)` | `ctx.fillRect(x,y,w,h)` | API 名字相同,参数顺序相同 |
| `g.strokeRect(x,y,w,h)` | `ctx.strokeRect(x,y,w,h)` | 同上 |
| `g.fillRoundedRect(x,y,w,h,r)` | `roundRect()` polyfill 自实现 | Canvas 2D 有些环境无 roundRect |
| `g.fillCircle(x,y,r)` | `ctx.beginPath();\nctx.arc(x,y,r,0,Math.PI*2);\nctx.fill()` | |
| `g.lineTo(x,y)` | `ctx.lineTo(x,y)` | 但需要 `beginPath` / `stroke` 包围 |
| `this.add.text(x,y,str,style)` | `ctx.font='...';\nctx.fillText(str,x,y)` | Canvas 没有"文本对象",每帧重画 |
| `text.setOrigin(0.5)` | `ctx.textAlign = 'center';\nctx.textBaseline = 'middle'` | |
| `this.add.container(x,y)` | 自己用对象记 `{x,y,children}` | Canvas 无容器概念 |
| `this.add.rectangle(...)` | `ctx.fillRect / strokeRect` 直接画 | |
| `this.add.image(x,y,key)` | `ctx.drawImage(img,x,y)` | img 需要先 `wx.createImage` 异步加载 |
| `obj.setInteractive()` | 在 WXML 上 `bindtouchstart`,坐标转换后判断点中谁 | Canvas 内部无事件 |
| `this.tweens.add({...})` | `requestAnimationFrame` + 自己写插值 | 见下面"动画"章节 |
| `this.input.on('pointerdown')` | `bindtouchstart` 在 WXML 上 | Canvas 上没原生事件 |
| `Phaser.Scene.scene.restart()` | 自己写 `clearAllAndRedraw()` | Canvas 没"场景"概念 |

## 3. 文本渲染细节

Canvas 2D 文本不支持开箱即用的"文字阴影"或"描边",但可以用两次 `fillText` 模拟:

```js
// 8 方向描边(实现"黑描边白字"效果)
function strokeText(ctx, str, x, y, color, strokeColor, strokeWidth) {
  ctx.fillStyle = strokeColor;
  for (let dx = -strokeWidth; dx <= strokeWidth; dx++) {
    for (let dy = -strokeWidth; dy <= strokeWidth; dy++) {
      if (dx === 0 && dy === 0) continue;
      ctx.fillText(str, x + dx, y + dy);
    }
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
```

## 4. 圆角矩形 polyfill

```js
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

// 用法
roundRect(ctx, 100, 100, 200, 80, 16);
ctx.fillStyle = '#FFF1C9';
ctx.fill();
ctx.lineWidth = 5;
ctx.strokeStyle = '#2C2C2A';
ctx.stroke();
```

## 5. 动画(替代 Phaser tweens)

```js
function animate(from, to, duration, onUpdate, onComplete) {
  const start = Date.now();
  function tick() {
    const t = Math.min(1, (Date.now() - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    const value = from + (to - from) * eased;
    onUpdate(value);
    if (t < 1) {
      requestAnimationFrame(tick);
    } else if (onComplete) {
      onComplete();
    }
  }
  tick();
}

// 用法:婉婉从 (1,1) 走到 (5,1)
animate(1, 5, 800, (x) => {
  redrawScene({ wanwanX: x, wanwanY: 1 });
});
```

## 6. 触摸事件

WXML 加触摸监听,把坐标转成 Canvas 坐标:

```html
<canvas
  type="2d"
  id="game-canvas"
  bindtouchstart="onCanvasTouch"
/>
```

```js
onCanvasTouch(e) {
  const { x, y } = e.touches[0];
  // x, y 是相对 canvas 左上角的 px
  // 用网格判断点中哪个格子
  const cellSize = 100;
  const gridX = Math.floor(x / cellSize);
  const gridY = Math.floor(y / cellSize);
  console.log('点中格子', gridX, gridY);
}
```

## 7. 待解决问题清单

- [ ] 高 DPR 屏幕(尤其 iPhone Pro 系列 3x)的清晰度方案
- [ ] Canvas 字体加载时机(自定义字体在 Canvas 中使用前需 `wx.loadFontFace`)
- [ ] 重绘节流:每帧 60fps 下移动+对话+提示同时存在的性能
- [ ] 多场景切换时的 Canvas 状态清理(避免残影)

阶段 4 启动时,这些问题逐项回答并补到文档。
