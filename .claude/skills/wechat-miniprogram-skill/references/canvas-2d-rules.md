# Canvas 2D 使用规范（仅在确实需要时）

> 本文回答：什么时候用 Canvas、怎么正确初始化、为什么旧版 API 不能用了。

## 重要：必须用 type="2d"，不是旧版 API

小程序 Canvas 经历过两代 API。**新代码只用新版**。

### ❌ 旧版（已废弃，不要用）
```js
const ctx = wx.createCanvasContext('myCanvas', this);
ctx.fillRect(0, 0, 100, 100);
ctx.draw();   // 这个 draw() 调用本身就是性能瓶颈
```

旧版的 `wx.createCanvasContext` + `ctx.draw()` 走的是跨线程序列化绘制指令，**等同于每次绘制都跨线程一次**。这是为什么很多教程里 Canvas 又卡又抖。

### ✅ 新版（必须用这个）
```html
<canvas id="stage" type="2d" style="width: 100%; height: 600rpx" />
```

```js
const query = this.createSelectorQuery();
query.select('#stage')
  .fields({ node: true, size: true })
  .exec((res) => {
    const canvas = res[0].node;
    const ctx = canvas.getContext('2d');
    
    // 处理 DPR
    const dpr = wx.getWindowInfo().pixelRatio;
    canvas.width = res[0].width * dpr;
    canvas.height = res[0].height * dpr;
    ctx.scale(dpr, dpr);
    
    // 之后就和 H5 Canvas API 完全一致
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 50, 50);
  });
```

新版的 ctx 是**真实的原生 Canvas 上下文**，调用 API 不再跨线程。这是标准 H5 Canvas 的 API（fillRect, drawImage, beginPath 等全部支持）。

## 帧动画必须用 canvas.requestAnimationFrame

```js
const draw = () => {
  ctx.clearRect(0, 0, width, height);
  // 画当前帧
  ctx.fillStyle = 'red';
  ctx.fillRect(this.gameX, 100, 50, 50);
  
  canvas.requestAnimationFrame(draw);  // ✅ 用 canvas 自己的 RAF
};
draw();
```

**禁止**用 `setInterval(draw, 16)` 或 `setTimeout(draw)` —— 不会与渲染同步，掉帧严重。

## 加载图片

```js
const image = canvas.createImage();
image.onload = () => ctx.drawImage(image, 0, 0, 100, 100);
image.src = '/assets/wanwan.png';   // 本地资源用绝对路径

// 远程图片需要在 mp 后台配置 downloadFile 合法域名
```

## 婉婉舞台 Canvas 的实现骨架

```js
// stage.js (Component)
Component({
  lifetimes: {
    attached() {
      this.gameState = {
        wa: { x: 0, y: 0 },
        path: [], // 队列指令解析后的路径点
        running: false,
      };
      this.images = {};
    },
    ready() {
      this.initCanvas();
    },
    detached() {
      this.gameState.running = false; // 停止帧循环
    }
  },
  methods: {
    async initCanvas() {
      const { canvas, ctx, width, height } = await this.queryCanvas();
      this.canvas = canvas;
      this.ctx = ctx;
      this.width = width;
      this.height = height;
      
      // 预加载图片
      this.images.wa = await this.loadImage('/assets/wa.png');
      this.images.bg = await this.loadImage('/assets/bg.png');
      
      this.startLoop();
    },
    queryCanvas() {
      return new Promise(resolve => {
        this.createSelectorQuery()
          .select('#stage')
          .fields({ node: true, size: true })
          .exec(res => {
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            const dpr = wx.getWindowInfo().pixelRatio;
            canvas.width = res[0].width * dpr;
            canvas.height = res[0].height * dpr;
            ctx.scale(dpr, dpr);
            resolve({ canvas, ctx, width: res[0].width, height: res[0].height });
          });
      });
    },
    loadImage(src) {
      return new Promise(resolve => {
        const img = this.canvas.createImage();
        img.onload = () => resolve(img);
        img.src = src;
      });
    },
    startLoop() {
      this.gameState.running = true;
      const loop = () => {
        if (!this.gameState.running) return;
        this.draw();
        this.canvas.requestAnimationFrame(loop);
      };
      loop();
    },
    draw() {
      const { ctx, width, height, gameState, images } = this;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(images.bg, 0, 0, width, height);
      ctx.drawImage(images.wa, gameState.wa.x, gameState.wa.y, 60, 60);
    },
    
    // 外部调用：队列执行完，告诉 Canvas 开始走
    runQueue(commands) {
      this.gameState.path = parseCommandsToPath(commands);
      // 接下来在 draw 里逐帧推进
    }
  }
});
```

## 与外部交互

Canvas 内部维护游戏状态，**不要把状态扔进 setData**。需要外部知道（比如通关）时用 `triggerEvent`：

```js
if (this.gameState.wa.x === target.x && this.gameState.wa.y === target.y) {
  this.gameState.running = false;
  this.triggerEvent('levelComplete', { steps: this.gameState.steps });
}
```

## 不要做的事

- ❌ 把 gameState 放进 data — 帧更新触发 setData = 灾难
- ❌ Canvas 上画对话气泡 — 用 DOM 浮在 Canvas 上层
- ❌ 多个 Canvas 叠加做层级 — 小程序 Canvas 是原生组件，z-index 受限
- ❌ Canvas 大小用 px 写死 — 用 rpx 或 100% 自适应
- ❌ 忘了 dpr 缩放 — 高分屏会模糊
- ❌ 忘了在 detached 里停止帧循环 — 内存泄漏

## 何时不用 Canvas

如果你的"舞台"动画达不到 Canvas 才能解决的复杂度（粒子数 < 20、元素数量 < 30、不需要像素级自由位置），**用 DOM + Worklet 即可**，简单得多。
