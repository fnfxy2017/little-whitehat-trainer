# 双线程模型：为什么 H5 思维写小程序会卡

> 本文回答：「我把 H5 代码迁过来效率反而下降了，为什么？」

## 一句话原理

小程序的 JS 代码（你写的逻辑）跑在 **逻辑层**，UI 渲染跑在 **渲染层**——这是两个独立的线程/进程。两边通过**异步消息**通信，每次 setData 都要：

1. 把 data 序列化成字符串（JSON.stringify 量级）
2. 跨线程传输
3. 渲染层反序列化
4. diff 虚拟 DOM
5. 触发真实 DOM 更新

这五步加起来，**一次空 setData 大约 30-50ms**（中端机）。如果你想要 60 FPS（每帧 16.6ms），意味着一帧之内连一次 setData 都来不及完整处理。

> iOS/iPadOS/macOS 上数据传输还要走 evaluateJavascript，更慢。

## H5 与小程序的根本差异

H5 里这样写没问题：

```js
function tick() {
  player.style.left = (parseInt(player.style.left) + 2) + 'px';
  requestAnimationFrame(tick);
}
```

`style.left` 是直接改 DOM，浏览器内部走 GPU 合成层，60 FPS 毫无压力。

迁到小程序，新手会改成：

```js
// ❌ 灾难
tick() {
  this.setData({ playerLeft: this.data.playerLeft + 2 });
  // 用 setTimeout 或 setInterval 反复触发
}
```

每帧一次 setData。在双线程模型下，逻辑层调一次、视图层处理一次、消息队列堵一次。**FPS 通常会跌到 5-10**。这就是「重写效率反而低」的核心原因。

## 三个解法

### 解法 1（最佳）：开 Skyline + Worklet
Skyline 把渲染分到独立线程，Worklet 让动画逻辑直接跑在渲染线程，**完全绕过 setData**。
- 适合所有"用户拖拽"和"基于位置的动画"
- 详见 `skyline-and-worklet.md`

### 解法 2：把高频区域整体放 Canvas
Canvas 内部循环用 `canvas.requestAnimationFrame`，逻辑层只在游戏状态变化时通知 Canvas，不调 Page.setData。
- 适合粒子、大量小元素
- 详见 `canvas-2d-rules.md`

### 解法 3（兜底）：节流 + Component 隔离
- 必须用 setData 时，把更新限制在小范围 Component 内
- 倒计时、计步器之类的频繁更新做成独立 Component，setData 只影响该组件
- 详见 `setdata-discipline.md`

## 思维迁移检查表

迁移每段 H5 代码前，先问：

- [ ] 这段代码每秒触发多少次更新？> 5 次就要警惕
- [ ] 它改的 DOM 范围有多大？整页 setData 比小范围 Component setData 慢 10 倍
- [ ] 它能不能改成 transform 动画？用 Worklet 跑就 0 setData
- [ ] 这段逻辑是 UI 反馈还是状态变化？UI 反馈走 Worklet/CSS，状态变化才 setData

## 可视化的对比

```
H5:  [JS 逻辑] → [DOM] → [GPU]                        每步几乎免费
                  ↑ 同线程

小程序 (WebView 渲染):
     [JS 逻辑] →→→ [跨进程消息] →→→ [DOM] → [GPU]
                    ↑ 30-50ms                    ↑ 还是 GPU

小程序 (Skyline + Worklet):
     [JS 逻辑]                              [GPU]
            ↘ 状态变化时一次性通知           ↗ 渲染线程持续 60 FPS
              [Worklet 在渲染线程]         
```

## 进阶：什么时候不能用 Skyline

Skyline 不是万能的，有三种情况退回 WebView 渲染：

1. 用了 Skyline 不支持的组件或 WXSS 特性（详见 Skyline 「支持与差异」文档）
2. 项目里依赖大量第三方 npm 库，且这些库用了 WebView 专属 API
3. 复杂的滚动嵌套或边界场景

婉婉冒险作为小型自研游戏，**不会触发上述任一情况**，可以全程使用 Skyline。
