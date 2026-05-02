# setData 使用纪律（必读）

> 本文是从微信官方「合理使用 setData」文档浓缩 + 项目实战。

## 核心原则（默写一遍）

1. **data 只放渲染相关的字段**
2. **不要在 data 里放业务状态**
3. **不要高频调用**
4. **每次只传变化的字段**
5. **后台态页面不要 setData**

## 数据怎么放（婉婉冒险案例）

### ❌ 错误做法：所有东西扔 data
```js
Page({
  data: {
    levelId: 't1',
    cards: [...],
    queue: [...],
    waPosition: { x: 100, y: 200 },
    waIsMoving: true,
    audioInstance: null,        // ❌ 不渲染
    levelStartTime: 1234567890, // ❌ 不渲染
    debugMode: false,           // ❌ 不渲染
    introShown: false,          // ❌ 业务状态
  }
})
```

### ✅ 正确做法
```js
Page({
  data: {
    // 真正在 wxml 里出现的字段
    cards: [],
    queue: [],
    waTransform: 'translate3d(0,0,0)',
    showIntroDialog: true,
    introText: '',
  },
  onLoad() {
    // 业务状态挂在 this 上，不进 data
    this.audioInstance = null;
    this.levelStartTime = Date.now();
    this.debugMode = false;
    this.introShown = false;  // 注意：现有项目要求每次进入都重播，所以这个字段实际上不需要
  }
})
```

## 频率控制

- ✅ 用户主动操作（点击、拖拽结束）触发 setData
- ✅ 动画完成（finish callback）触发 setData
- ✅ 游戏状态变化（通关、失败）触发 setData
- ⚠️ 计时器更新：节流到 200ms 一次，做成独立 Component
- ❌ 每帧（16.6ms）调 setData
- ❌ onPageScroll 里直接 setData

## 数据路径精确更新

更新数组中第 N 张卡片，**不要这样**：
```js
// ❌ 重传整个数组
const cards = this.data.cards.slice();
cards[2].selected = true;
this.setData({ cards });
```

**应该这样**：
```js
// ✅ 数据路径
this.setData({ 'cards[2].selected': true });
```

数据量更小，传输更快，diff 也更精确。

## Component 隔离（婉婉冒险关键）

每个频繁更新的 UI 区域**做成独立的自定义 Component**，因为：

- Component 的 setData **只影响自己和子组件**，不会触发整页 diff
- 多个 Component 可以并行更新

婉婉冒险建议拆分：

```
关卡页 Page (level)
  ├── <intro-dialog>    Component  对话淡入淡出独立 setData
  ├── <step-counter>    Component  步数变化独立 setData
  ├── <queue-display>   Component  队列变化独立 setData
  ├── <wa-stage>        Component  婉婉移动独立 setData (或 Worklet)
  ├── <card-tray>       Component  卡片库独立 setData
  └── <result-overlay>  Component  通关/失败弹窗独立 setData
```

每个 Component 自己管自己的 setData，互不打扰。

## 后台页面陷阱

切到后台后还在 setData，会抢前台资源、引发其他页面卡顿。

```js
Page({
  onShow() { this.isVisible = true; this.startTimer(); },
  onHide() { this.isVisible = false; this.stopTimer(); },
  
  startTimer() {
    this.timer = setInterval(() => {
      if (!this.isVisible) return;  // ✅ 后台不更新
      this.setData({ ... });
    }, 200);
  },
  stopTimer() { clearInterval(this.timer); }
})
```

## 性能验证

- 真机调试 2.0 → 性能面板看 setData 调用频次和数据量
- 单次 setData 数据量超过 256KB 会被警告，应控制在 < 50KB
- 单次 setData 调用频率超过 5 次/秒就要重新检视

## 速查表

| 场景 | 怎么写 |
|---|---|
| 改对话文字 | Component 内 `setData({ text: ... })` |
| 卡片拖拽中 | Worklet（不 setData） |
| 拖拽结束 | 一次 setData 更新队列 |
| 婉婉走一格 | 动画 transition 完成后 setData 更新坐标 |
| 步数+1 | Component setData 数据路径 `'count': N` |
| 通关 | 一次 setData，多字段一起 |
| 倒计时 | 节流到 200ms，做成独立 Component，后台暂停 |
