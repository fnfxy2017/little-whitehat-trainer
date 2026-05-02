---
name: wechat-miniprogram-skill
description: >
  微信小程序开发技能库，专注「白帽小队训练营·婉婉的冒险」儿童 AI 安全教育游戏的小程序版本开发。
  当用户涉及以下任务时使用此 SKILL：从 H5 (Phaser) 版本迁移到小程序、为关卡场景选择渲染方案
  (Skyline DOM / Canvas 2D / WebView)、解决渲染卡顿和效率问题、设计 JSON 驱动的关卡数据结构、
  实现卡片拖拽与队列布局、实现对话气泡 / 介绍弹窗 / 跳过按钮、添加新关卡 (T 系列教学 / C 系列概念)、
  调试 setData 性能问题、处理双线程通信开销、使用 Worklet 动画、配置分包加载。
  本 SKILL 覆盖完整的渲染方案选型决策树、性能优化原则、JSON 配置规范和迁移路线图。
---

# 微信小程序开发技能库（婉婉冒险游戏专用）

> 阅读本文约 5 分钟，掌握**渲染方案选型**和**核心性能原则**。具体细节按「路由索引」查对应文档。

---

## 〇、最重要的事：先看决策树再写代码

很多 H5 → 小程序的重写**效率反而下降**，根因不是 Canvas 慢，而是**渲染方案选错**。开始任何关卡场景之前，对着下面这棵树走一遍：

```
当前要实现的内容是什么？
│
├── 关卡选择菜单 / 设置页 / 静态布局 / 对话气泡 / 卡片列表
│   → ✅ Skyline + WXML/WXSS（DOM 渲染）
│   → 用 view/scroll-view 即可，不要碰 Canvas
│
├── 卡片拖拽 / 队列重排 / 角色按格子移动
│   → ✅ Skyline + WXML + Worklet 动画 + 手势系统
│   → 拖拽位置变化用 shared value，不走 setData
│
├── 复杂粒子 / 大量自由坐标元素 / 帧循环动画
│   → ⚠️  Canvas 2D（type="2d" 必须，不是旧版）
│   → 用 canvas.requestAnimationFrame，不要 setInterval+setData
│
├── 整片 3D / 大型物理 / 完整游戏引擎
│   → 改用 小游戏 (minigame)，不是小程序
│
└── 已有 H5 完整版本，想快速上线
    → web-view 组件嵌 H5（限制：不能调用 wx.* API）
```

**关于本项目的具体判断：** 婉婉冒险大部分场景属于第 1、2 类（关卡选择、卡片队列、对话）。**只有"婉婉沿队列向前走"这种连续位移动画才需要 Canvas**，且即便如此，也建议先尝试 Skyline + Worklet 方案。详见 `references/rendering-decision.md`。

---

## 一、整体架构（用对了才不卡）

小程序是 **「双线程模型」**：

```
┌──────────────────────────────┐    ┌──────────────────────────┐
│     逻辑层 AppService         │    │       渲染层 WebView      │
│     (你的 .js 代码)            │◄──►│   (.wxml + .wxss)         │
│     setData()  ───────────────│ 通信│ 显示                      │
│                                │ 异步│                          │
└──────────────────────────────┘    └──────────────────────────┘
                                          ↑ 序列化 + 跨线程传输 ↑
                                          这是性能瓶颈所在！
```

**核心后果（这是 H5 迁移最容易踩的坑）：**
- `setData` 是异步的、要序列化、要跨线程传输——**调用越频繁、数据越大、越卡**
- 帧动画里调 `setData` 等同于自杀，FPS 会暴跌到 10 以下
- H5 里 `obj.style.left = x + 'px'` 这种直接 DOM 操作的写法，在小程序里要改成 setData，**频率不能跟上**

**两条解法（按优先级）：**

1. **首选：开启 Skyline 渲染引擎** — 把渲染线程独立出来，setData 不再阻塞动画。配合 **Worklet** 把动画逻辑下放到渲染线程，完全绕开 setData。
2. **退而求其次：Canvas 2D** — 把高频更新区域整个画在 Canvas 里，逻辑层只控制游戏状态，不调 setData。

**严禁组合：用 view + setData 做帧动画**。这是 H5 思维迁移过来的最大错误。

详细解释见 `references/two-thread-model.md` 和 `references/setdata-discipline.md`。

---

## 二、本项目目录结构（推荐）

```
miniprogram/
├── app.js / app.json / app.wxss         # 全局
├── pages/
│   ├── home/                            # 关卡菜单（Skyline DOM）
│   ├── level/                           # 关卡主舞台
│   │   ├── level.json                   # 启用 Skyline
│   │   ├── level.wxml                   # 静态UI：背景、对话框、卡片栏
│   │   ├── level.wxss
│   │   └── level.js                     # 关卡控制器
│   └── result/                          # 结算页
├── components/
│   ├── dialog-bubble/                   # 对话气泡组件（独立 setData 域）
│   ├── card-slot/                       # 队列槽位（Worklet 拖拽）
│   ├── instruction-card/                # 卡片
│   └── stage-canvas/                    # 仅在需要帧动画时使用
├── data/
│   ├── levels/                          # 沿用现有 levels JSON（无需改格式）
│   │   ├── t1.json ... t5.json
│   │   └── c1.json
│   └── manifest.json                    # 关卡清单
├── utils/
│   ├── level-loader.js                  # JSON → 内存模型
│   ├── queue-engine.js                  # 队列执行/校验（纯逻辑，可移植）
│   └── intro-dialog.js                  # 对话流控制
└── subpackages/
    └── concept-levels/                  # C 系列关卡分包（按需加载）
```

**关键决策：**
- **关卡 JSON 格式完全保留** — 现有的 `preset_queue` / `manual_tip` / `security_concept` / `dialogs` 等字段都不变，只换渲染层。这是为了保护已有内容资产。
- **C 系列关卡走分包** — 首屏只加载 T 系列，C 系列点进去再下载，启动更快。
- **每个对话框/卡片做成独立 Component** — 缩小 setData 影响范围（参考 `references/setdata-discipline.md` §3.3）。

---

## 三、四个关键模块的实现指引

### 3.1 关卡选择页（home）
纯 DOM 列表，无任何性能挑战。用 Skyline + scroll-view + 网格布局。完成时长 < 1 小时。

### 3.2 对话气泡 / 介绍弹窗 / 跳过按钮
H5 版本是 DOM 元素，迁移过来 **不要画在 Canvas 上**——继续用 WXML view + WXSS 动画。
- 文字：`<text>` 组件
- 打字机效果：单字符 setData + setTimeout（频率控制在每 60ms 一次，不要更快）
- 跳过按钮：`<button>` 或 `<view bindtap>`
- 详见 `references/dialog-system.md`

### 3.3 卡片栏 + 队列拖拽 ⭐ 重点
这是项目里最容易翻车的地方。**正确做法：**
- 卡片用 `<view>`，绝对定位
- 拖拽用 **Skyline 的 Worklet + 手势系统**——拖动时位置变化跑在渲染线程，零 setData，丝滑
- 拖拽结束（onTouchEnd）才 setData 一次更新数据模型
- C 系列的 `preset_queue` 在 `onLoad` 里一次性 setData 渲染好

详见 `references/queue-and-cards.md`，里面有 Worklet 的完整代码模板。

### 3.4 婉婉的舞台移动（唯一可能需要 Canvas 的地方）
- **方案 A（推荐先试）**：婉婉也是 view + Worklet 动画，沿格子点跳跃式平移。如果效果可接受，整个关卡场景零 Canvas。
- **方案 B（兜底）**：仅婉婉所在的舞台区域用一个 `<canvas type="2d">`，关卡其他 UI 全部 DOM。Canvas 内部用 `canvas.requestAnimationFrame` 自循环，**不要在 Page.setData 里驱动**。

详见 `references/canvas-2d-rules.md`。

---

## 四、JSON 关卡格式（保留 H5 版本约定）

现有约定全部保留，无需改造：

| 字段 | 用途 | 教学(T)/概念(C) |
|---|---|---|
| `level_id` | 唯一 ID | 都用 |
| `intro_dialogs` | 进入关卡时对白 | 都用 |
| `manual_tip` | 卡片栏空时的引导提示 | 都用 |
| `preset_queue` | 预填队列（用于篡改场景） | C 系列专用 |
| `security_concept` | 概念名 + 现实类比 + 防御建议 | C 系列专用 |
| `cards` | 可用卡片列表 | T 系列必填，C 系列可空 |
| `target` | 通关目标坐标 / 状态 | 都用 |

**关键约束（来自现有项目教训）：**
- 所有 dialog 文字 ≤ 20 字（手机屏幕 + 儿童阅读速度）
- 介绍对白每次进入关卡都重播，不要做"已看过就跳过"的 guard
- C 系列的 retry/replay/clear，**重置时必须重新应用 preset_queue**

完整字段定义和示例见 `references/level-json-schema.md`。

---

## 五、迁移路线图（建议顺序）

> 不要一上来就把所有关卡都迁。按下面的顺序，每完成一步都能跑、能孩子玩、能验收。

1. **第 1 步：项目骨架**（半天）
   - mp 注册、appid、开发者工具、Skyline 启用
   - 一个 hello-world 页跑通
2. **第 2 步：关卡选择页**（半天）
   - 静态读取 `manifest.json` + `data/levels/*.json`
   - 点击进入空白关卡页
3. **第 3 步：对话系统**（1 天）
   - 介绍弹窗、对话气泡、跳过按钮、≤20 字校验
   - 不依赖任何关卡逻辑就能跑
4. **第 4 步：T1 关（最简）跑通**（1-2 天）
   - 卡片栏 → 队列 → 婉婉移动 → 通关判定
   - 婉婉先用 view + Worklet（方案 A）
   - 如果方案 A 效果不行，第 4.5 步再切换到 Canvas
5. **第 5 步：T2-T5 套用模板**（1 天）
   - 已有 JSON 直接放进去
6. **第 6 步：C1 概念关 + preset_queue**（1 天）
   - 测试 retry/replay/clear 全部场景
7. **第 7 步：分包 + 启动优化**（半天）
   - C 系列移到独立分包
8. **第 8 步：Bug fix 循环**（按需）
   - 接孩子的真机反馈

详细里程碑和每步验收标准见 `references/migration-roadmap.md`。

---

## 六、路由索引

按需查阅，不要一次全读：

| 文件 | 何时查 |
|---|---|
| `references/rendering-decision.md` | 任何一处不知道用 Canvas 还是 DOM |
| `references/two-thread-model.md` | 解释为什么慢 / 团队成员问"为什么不能直接 setInterval" |
| `references/setdata-discipline.md` | 写 setData 时 / 帧率掉到 30 以下排查 |
| `references/skyline-and-worklet.md` | 写动画或拖拽 / 启用 Skyline |
| `references/canvas-2d-rules.md` | 确实需要 Canvas 时（注意：是 type="2d" 不是旧 API） |
| `references/dialog-system.md` | 实现介绍弹窗 / 对话气泡 / 跳过按钮 |
| `references/queue-and-cards.md` | 实现卡片栏 + 队列 + 拖拽 |
| `references/level-json-schema.md` | 写新关卡 JSON / 校验现有 JSON |
| `references/migration-roadmap.md` | 阶段性规划 / 估时 |
| `references/subpackage-and-launch.md` | 启动优化 / 分包配置 |
| `templates/level-page.wxml` `templates/level-page.js` | 起新关卡页直接复制 |
| `templates/level.json.example` | 新关卡 JSON 模板 |

---

## 七、严禁清单（踩过的坑）

- ❌ 用旧版 `wx.createCanvasContext` 写新代码（必须 `<canvas type="2d">` + `getContext('2d')`）
- ❌ 帧动画里调 `setData`
- ❌ `this.setData(this.data)` 偷懒全量刷新
- ❌ 一个 Page 包揽所有 setData（每个对话气泡、每张卡片都做成 Component）
- ❌ 关卡 JSON 直接 require 进 app.js（用 `import` 或动态加载，避免首屏全部进内存）
- ❌ 在 H5 里能跑就直接复制粘贴（双线程模型完全不同）
- ❌ 用 setInterval 做倒计时还每帧 setData（用 Component 隔离 + nextTick 节流）
- ❌ 自定义字体直接放在代码包里（用 `wx.loadFontFace` 远程加载）
- ❌ 使用真实人物或 IP 形象作为婉婉头像（版权风险）

---

## 八、验收基线（什么算"做好了"）

- 真机（中端安卓，比如红米 Note 系列）启动到关卡列表 ≤ 2 秒
- 关卡内拖拽卡片帧率 ≥ 50 FPS
- 婉婉移动动画 ≥ 30 FPS（目标 60）
- 对话打字机不掉帧
- 切后台再回来，关卡状态不丢
- 孩子（6-9 岁）独立完成 3 个关卡不报告卡顿

如果迁移完达不到这些指标，**先看 `references/setdata-discipline.md` 排查**，别急着加优化代码。

---

最后：本 SKILL 覆盖的是「微信小程序」（mini program），不是「微信小游戏」（mini game）。如果项目最终决定走完整游戏引擎路线（Cocos / Laya / Pixi），需要改用小游戏文档体系，本 SKILL 不适用。两者 API 大量重合但页面/组件模型不同。
