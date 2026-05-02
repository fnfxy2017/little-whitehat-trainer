# Skyline 渲染引擎与 Worklet 动画

> 本文回答：怎么开 Skyline、怎么用 Worklet 写动画、为什么这是婉婉冒险的关键。

## 为什么要用 Skyline

WebView 渲染下，逻辑层一卡，渲染层就跟着卡。Skyline 把渲染分到独立线程：

- 界面**不会**被 JS 逻辑阻塞
- 内存和启动时间都更小（不为每页新建 JS 引擎实例）
- 配合 Worklet，动画完全不走 setData

对婉婉冒险这种"互动 + 动画 + 拖拽"的场景，Skyline 是**强烈推荐的默认渲染引擎**。

## 开启 Skyline

### app.json 全局开启
```json
{
  "renderer": "skyline",
  "rendererOptions": {
    "skyline": {
      "defaultDisplayBlock": true,
      "disableABTest": true,
      "sdkVersionBegin": "3.0.0",
      "sdkVersionEnd": "15.255.255"
    }
  },
  "lazyCodeLoading": "requiredComponents",
  "componentFramework": "glass-easel"
}
```

### 单页开启（推荐先按页验证）
某个 page.json：
```json
{
  "renderer": "skyline",
  "componentFramework": "glass-easel"
}
```

### 兼容性兜底
开发者工具调试栏可以切换 Skyline / WebView，对比效果。如果某页在 Skyline 下出问题，先单独把那页切回 WebView，不影响其他页。

## Skyline 与 WebView 的差异（婉婉冒险会遇到的）

- Skyline 默认 display: block，更接近原生
- 部分 CSS 不支持或行为不同（详见微信文档「WXSS 样式」）
- 触摸事件系统更接近原生（推荐用 Pointer 事件）
- WXS 移到 AppService，用法类似但变成异步（这就是为什么需要 Worklet 替代）

**婉婉冒险使用的所有 UI 元素**（view, text, image, scroll-view, button）在 Skyline 下都完全支持。

## Worklet：动画的核心

Worklet 是跑在**渲染线程**的轻量 JS 函数，专为动画和高频更新设计。它能直接读写 **shared value**（共享值），不需要走 setData。

### 共享值是什么
共享值是逻辑层和渲染层都能访问的"特殊变量"：
- 逻辑层用 `wx.worklet.shared(initialValue)` 创建
- 渲染层（在 Worklet 函数中）通过 `.value` 读写
- 改变它会立刻触发 Worklet，**完全不走 setData**

### 卡片拖拽的完整示例

```js
// card.js (Component)
import { shared, useAnimatedStyle, GestureDetector } from 'wx://animation'

Component({
  lifetimes: {
    attached() {
      // 创建共享值
      this._x = shared(0)
      this._y = shared(0)
      
      // 把动画样式绑到 wxml
      this.applyAnimatedStyle('.card', () => {
        'worklet'
        return {
          transform: `translate(${this._x.value}px, ${this._y.value}px)`
        }
      })
    }
  },
  methods: {
    handleTouchMove(e) {
      'worklet'   // 标记此函数跑在渲染线程
      this._x.value = e.deltaX
      this._y.value = e.deltaY
    },
    handleTouchEnd() {
      // 拖拽结束才回到逻辑层做"放进队列"的判定
      // 这一步可以走 setData 因为只触发一次
      this.triggerEvent('cardDropped', { x: this._x.value, y: this._y.value })
    }
  }
})
```

### Worklet 函数的限制

- 函数内必须有 `'worklet'` 字符串（顶部）
- 不能调用 wx.* API
- 不能访问普通的 Component 属性，只能访问共享值
- 调试方式比普通 JS 弱（建议先在普通 JS 实现一版逻辑，再迁过去）

完整文档：<https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/worklet.html>

## 婉婉冒险中 Worklet 的应用清单

| 场景 | 用法 |
|---|---|
| 卡片从卡片库拖到队列槽 | 上面的示例 |
| 卡片从队列拿回卡片库 | 同上反向 |
| 队列中的卡片重排 | shared value 配合 spring 动画 |
| 婉婉沿队列走（方案 A） | 一段段 timing 动画驱动 transform |
| 通关时的角色弹跳 | spring 动画 |
| 对话气泡的"咔哒"出场 | timing + 缓动 |

## 动画函数

Skyline 提供了几个常用动画函数：

- `wx.worklet.timing(toValue, options)` — 线性/缓动到目标值
- `wx.worklet.spring(toValue, options)` — 弹簧动画
- `wx.worklet.delay(timeout, animation)` — 延迟
- `wx.worklet.sequence(...animations)` — 串行
- `wx.worklet.repeat(animation, times)` — 重复

例如婉婉走 3 格，每格 300ms：
```js
'worklet'
this._x.value = wx.worklet.sequence(
  wx.worklet.timing(100, { duration: 300 }),
  wx.worklet.timing(200, { duration: 300 }),
  wx.worklet.timing(300, { duration: 300 }),
)
```

## 何时不用 Worklet

- 静态 UI（无动画）— 普通 WXML/WXSS 即可
- 一次性动画（按钮按下变色）— CSS transition 就够了
- 需要复杂物理 / 大量粒子 — 还是 Canvas 合适
