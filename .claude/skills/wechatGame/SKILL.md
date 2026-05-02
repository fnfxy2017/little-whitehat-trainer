---
name: wanwan-wechat-miniprogram
description: 把《白帽小队训练营 · 婉婉的冒险》改造为微信小程序(WeChat 分支)。当用户在 WeChat 分支开发任何代码、UI、关卡渲染、组件、语音包、分包配置时使用此 SKILL。本 SKILL 与 aiGame/SKILL.md 互补 —— 关卡数据 / 剧情 / 角色 / 概念体系沿用 aiGame,本 SKILL 只覆盖三件事:微信小程序运行环境的硬约束、v7.2 设计系统的视觉规范、原生 Canvas 渲染的实现路径。核心约束:严格 3 色(米黄系 + 墨黑 + 朱砂橙)、不引入 React/Tailwind/任何 Web 框架、关卡 JSON 通过冷同步保持与 main 分支一致、所有"代码不经我电脑"流程通过 sevensun003/fnfxy2017 仓库的 PAT 完成。
---

# 白帽小队训练营 · 微信小程序版(WeChat 分支)

把网页版的《白帽小队训练营 · 婉婉的冒险》原样移植为微信小程序,保留全部 65 关玩法、剧情、角色、安全概念,**重写整个渲染层和 UI 层**。

> 本 SKILL 是 WeChat 分支的**唯一设计权威**。
> 关卡数据 / 剧情 / 概念体系仍以 `.claude/skills/aiGame/SKILL.md` 为准。
> 本 SKILL 不重复那部分内容,只补充小程序特有的约束。

---

## 1. 一句话理解

把网页版的 Phaser 3 + DOM 双层架构,**全部重写为微信小程序原生 Canvas + WXML/WXSS**,关卡数据 / 剧情逻辑 / 概念体系保持与 main 分支一致。

**为什么要做这个分支**:网页版部署在 GitHub Pages,国内访问不稳;微信小程序在国内是孩子最熟悉的载体,也方便后续以"预览码"形式分享给亲友试玩。

**为什么独立分支而不是 monorepo**:Phaser 跟小程序原生 Canvas 完全不兼容,代码无法共享,强行 monorepo 会污染网页版迭代。两个分支独立演进,关卡 JSON 通过定期 cherry-pick 同步。

---

## 2. 架构硬约束(不可违反)

下列 8 条约束在 WeChat 分支所有开发决策中**优先级最高**:

1. **不引入任何 Web 框架**:不用 React、Vue、Tailwind、shadcn、styled-components 等任何 Web 技术栈,一律用微信原生 WXML / WXSS / JS 写。原因:小程序运行环境根本不支持。
2. **不依赖 npm build 步骤**:小程序代码直接放仓库,微信开发者工具打开即编译运行,不要任何 webpack / vite / parcel。
3. **关卡 JSON 与 main 分支冷同步**:`miniprogram/levels/` 下的 65 个 JSON 必须能 1:1 对应 `levels/`,改关卡只改 main 分支的 JSON,WeChat 分支定期 cherry-pick。**严禁在 WeChat 分支独立改关卡数据**。
4. **渲染层走原生 Canvas 2D**:`<canvas type="2d">` 标签 + 原生 Canvas API,不引入 Phaser 兼容层、不引入第三方 game engine。原因:稳定性、包体、维护成本。
5. **设计系统严格 3 色**:米黄系(3 档明度)+ 墨黑 + 朱砂橙,**任何代码 / WXSS / Canvas 绘制中不允许出现这 5 个十六进制以外的颜色值**。详见第 4 节。
6. **包体分级管理**:主包(选关页 + 第一幕 + 公共代码)≤ 2MB;每个分包(其余幕)≤ 2MB;总和 ≤ 20MB。详见第 6 节。
7. **触摸目标 ≥ 60×50pt @ 标准屏宽**:任何可点元素必须达到此最小尺寸,儿童手指点击零误触。
8. **代码不经过用户本地电脑**:所有 WeChat 分支的代码 commit / push 必须通过 Claude 沙箱 + 用户提供的 fine-grained PAT 完成。开发者本地只做"微信开发者工具预览"和"扫码真机调试",不做代码编辑。

---

## 3. 当前项目状态

**阶段**:🚧 改造规划完成 · 设计系统冻结 v7.2 · 代码尚未开始
**分支**:`WeChat`(基于 main `acb9297` 分出)
**目标仓库**:`fnfxy2017/little-whitehat-trainer`(同 main,WeChat 分支独立 push)

**已交付**:
- 设计系统 v7.2(3 色 + 字号阶梯 + 触摸目标 + 文案规范,见第 4 节)
- 选关页 + 主游戏页完整 mockup(SVG 草图,见 references/mockups.md 规划中)
- 改造模块清单 7 个阶段(见第 7 节)

**待启动**:
- 阶段 1:小程序脚手架(app.json / 分包配置 / project.config.json)
- 阶段 2:数据层(关卡 JSON 同步 + storage 封装)
- 阶段 3:引擎逻辑层(从 game.js 剥离纯算法部分)
- 阶段 4:Canvas 渲染层(替代 Phaser)
- 阶段 5:UI 层(WXML 组件)
- 阶段 6:语音包工具链 + mp3 分包
- 阶段 7:测试 + 真机预览

---

## 4. 设计系统 v7.2(冻结版)

**这是 WeChat 分支视觉的唯一标准**,任何代码生成必须严格遵守。如果生成结果与下列规范冲突,优先改代码。

### 4.1 配色 · 严格 3 色系 5 个值

```
米黄系 · 3 档明度(管"温度"和"层次"):
  --bg-deep:    #F5DEB3   陶土黄(顶部背景)
  --bg-light:   #FFE9B8   暖米黄(底部背景,与 deep 形成渐层)
  --card-warm:  #FFF1C9   奶油黄(指令卡 / 队列项 / 关卡卡片)
  --card-pale:  #FFFCF2   极淡米(大容器底 / 对话框 / 模态弹窗)

墨黑 · 1 个值(管"重量"和"激活"):
  --ink:        #2C2C2A   描边 / 主文字 / 激活态背景

朱砂橙 · 1 个值(管"行动"和"强调"):
  --action:     #FF6B47   主行动按钮 / 关键 NPC / 状态徽章
```

**辅助灰阶**(只用于次要文字,不用于色块):
```
  --text-mute:  #5F5E5A   次要文字 / 辅助说明
  --text-faint: #888780   未解锁文字 / 灰显态
```

### 4.2 朱砂橙的"使用经济学"

朱砂橙是稀缺资源。**单页朱砂橙元素 ≤ 5 个**,职能严格分配:

1. 主行动按钮(执行 / 完成 / 确认)
2. 关键 NPC(剧情主角 NPC,如 G1 的大邮筒)
3. 状态徽章(进度条填充 / "在玩"标签 / "新"小标签)
4. 朗读 🔊 按钮
5. 顶部小红点 / 强调短横线(20-120px)

**禁止**:大面积朱砂橙铺底、朱砂橙作为卡片底色、朱砂橙作为正文颜色(除非反白)。

### 4.3 字号阶梯(@1280 设计稿基准)

| 层级 | 字号 | weight | 用途 |
|---|---|---|---|
| 巨标题 | 92px | 900 | 主行动按钮文字("执行") |
| 大标题 | 76px | 800 | 关名 / 选关页幕标题 |
| 中标题 | 56-60px | 800 | 选关页幕分组标题 / 关名变体 |
| 区段标题 | 48px | 800 | "指令" / "队列" / "对话" 等 |
| 大正文 | 46px | 600 | 对话气泡内容 |
| 中正文 | 40px | 700 | 队列里的指令文字、卡片激活态 |
| 中正文 | 36px | 700 | 指令卡标签 / 地图步骤提示 / 地图角色名 |
| 小正文 | 32px | 600-800 | 幕名 / 状态信息 / 地图实体名 |
| 元信息 | 26-30px | 600-700 | 时间 / 清空按钮 / 辅助说明 |

**最小字号 26px @ 1280**,折算到 iPhone 标准屏宽 ≈ 12sp,**全页禁止低于此**。

**字体族**:
```css
font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", 
             "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif;
```
不使用衬线字体、不使用斜体、不使用条件性 webfont(增加包体)。

### 4.4 触摸目标尺寸

@ 1280 设计稿基准:

| 元素 | 最小尺寸 | 折算到 390pt 标准屏 |
|---|---|---|
| 主行动按钮(执行) | 936×220 | 285×67pt |
| 指令卡 | 280×200 | 85×60pt |
| 关卡卡片 | 280×280 | 85×85pt |
| 顶部按钮(返回 / 提示) | 180×100 / ⌀120 | 55×30 / ⌀36pt |
| 队列项 | 220-260×120 | 67-79×36pt |

**所有尺寸超过 Apple HIG 最小 44pt 和 Google Material 48dp 要求**,儿童手指点击零误触。

### 4.5 描边与阴影系统(玩具立体感)

每个可点元素的"贴纸抬起"效果:

```
卡片本体:fill = card-warm 或 card-pale
卡片描边:stroke = ink, width = 5-6px
卡片阴影:在卡片本体下方偏移 (4px, 4px) 画一个同形 ink 色块
```

WXSS 实现:
```css
.card {
  background: var(--card-warm);
  border: 5rpx solid var(--ink);
  border-radius: 24rpx;
  box-shadow: 4rpx 4rpx 0 0 var(--ink);  /* 不是 blur 阴影,是硬偏移 */
}
.card:active {
  transform: translate(2rpx, 2rpx);
  box-shadow: 2rpx 2rpx 0 0 var(--ink);  /* 按下时压扁 */
}
```

**禁止使用 blur shadow / drop-shadow / elevation**。所有"立体感"靠硬偏移实现,与设计风格一致。

### 4.6 圆角系统

| 元素 | 圆角(rpx) |
|---|---|
| 大胶囊按钮(执行) | 110 |
| 大容器(地图区 / 对话框) | 32-40 |
| 卡片(指令 / 关卡 / 对话) | 22-32 |
| 小卡(队列项 / 状态徽章) | 14-22 |
| 圆形元素(头像 / 提示按钮) | 50% |

**禁止使用 0 圆角(直角)** —— 跟"玩具感"冲突。

### 4.7 激活态(当前选中)规范

- **未激活**:奶油黄底 + 黑描边 + 黑文字
- **激活**:墨黑底 + 暖米黄字(`#FFE9B8`)+ 黑描边加粗
- 切换不用动画,直接换色

不要用"高亮发光"、"边框闪烁"、"加角标" 这些花哨方式。

### 4.8 文案规范

按行业标准,**短动词** + **零黑话**:

| 操作 | 文案 | 不用 |
|---|---|---|
| 返回上一页 | 返回 | 跑路 / 拜拜 |
| 清空队列 | 清空 | 全扔了 / 重置 |
| 重新开始 | 重来 | 再来一次 / 复位 |
| 运行队列 | 执行 | 开干 / 走起 / Go |
| 等待动作 | 等待 | 等等 / 暂停 |
| 重复动作 | 重复 | 来回 |
| 提示按钮 | 提示 | 帮助 |

**对话内容**(角色说的话)可以更口语,但 UI 控件文字必须中性、规范、与微信生态其他教育 app 一致。

### 4.9 装饰性元素(让画面"有生气")

- 背景**渐层米黄**(顶部 deep,底部 light),不要纯色铺
- 背景叠 **8% 透明度的小圆点纹理**(60rpx 间距),让大块底色不"死"
- **禁止**:背景图片 / 背景插画 / 不规则装饰元素 / 渐变色块过 1 个 / 任何动画背景

### 4.10 角色微表情("好玩感"的来源)

每个 NPC 都给一对**眼睛 + 微笑曲线**,用 SVG path 绘制,不用复杂插画:

```js
// 婉婉、邮筒、信、小天 等所有 NPC 的"脸"统一画法
function drawCuteFace(ctx, x, y, scale) {
  // 两个黑眼睛
  ctx.fillStyle = '#2C2C2A';
  ctx.beginPath();
  ctx.arc(x - 8 * scale, y - 4 * scale, 3.5 * scale, 0, 2 * Math.PI);
  ctx.arc(x + 8 * scale, y - 4 * scale, 3.5 * scale, 0, 2 * Math.PI);
  ctx.fill();
  // 微笑曲线(开口向上的弧线)
  ctx.strokeStyle = '#2C2C2A';
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y + 8 * scale, 12 * scale, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
}
```

不靠插画,靠"几笔黑线 + 微笑"让所有 NPC 都"活"过来。这是产品差异化的关键之一。

---

## 5. 渲染层架构(关键技术决策)

### 5.1 Canvas vs DOM 分工

参考网页版的"Phaser + DOM"分工,但小程序里两者都重写:

| 区域 | 实现方式 | 原因 |
|---|---|---|
| 地图(角色 / 实体 / 网格) | `<canvas type="2d">` + 原生 Canvas API | 需要逐帧动画,Canvas 性能远好于 DOM |
| 顶部导航(返回 / 关名 / 提示) | WXML | 静态,无动画 |
| 对话气泡 | WXML 组件 | 文本可选 / 朗读按钮可点 |
| 指令栏 | WXML 组件(grid 4 列) | 触摸事件 |
| 队列栏 | WXML 组件(横向滚动) | 触摸事件 + 动态增删 |
| 操作区(执行 / 重来 / 清空) | WXML 按钮 | 触摸事件 |
| 密码盘 / 字母键盘 / 三选一对话框 | WXML 模态 | 复杂交互 + 文本输入 |

### 5.2 Canvas 翻译指南(Phaser → 原生)

网页版 game.js 用 Phaser 调用了 159 处 API,改造时按以下对应表翻译:

| Phaser API | 原生 Canvas 等价 |
|---|---|
| `this.add.graphics()` | `ctx` 直接绘制(不需要"对象") |
| `this.add.text(x,y,str,style)` | `ctx.fillText(str, x, y)` + 提前 setProps |
| `this.add.container(x,y)` | 用一个对象记 `{x,y,children}`,自己管 |
| `this.add.rectangle(...)` | `ctx.fillRect / strokeRect` |
| `this.tweens.add({...})` | `requestAnimationFrame` + 自己写插值 |
| `this.input.on('pointerdown')` | 在 WXML 上 `bindtouchstart`,把坐标传给 Canvas 处理 |
| `Phaser.Scene.scene.restart()` | 自己写 `clearAllAndRedraw()` |

> 详细翻译表见 `references/canvas-adapter.md`(将在阶段 4 写出)。

### 5.3 关卡尺寸约定

所有关卡的 `map.size` 范围:**最小 10×5,最大 12×9**(见 main 分支 65 关统计)。Canvas 设计基准:

```
画布逻辑尺寸:1196 × 900 rpx(@ 1280 屏宽,见 v7.2 mockup)
最大网格 12 × 9: 单格 ≈ 100 × 100 rpx
常规网格 10 × 7: 单格 ≈ 120 × 130 rpx
```

引擎在加载关卡时,**根据 `map.size` 动态计算单格 px 尺寸**,实体绝对坐标用 `gridX * cellSize + offset` 计算,不要硬编码格子像素。

---

## 6. 包体与分包策略

微信小程序限制:主包 2MB / 单分包 2MB / 总包 20MB。

### 6.1 包体规划

```
miniprogram/                               主包(预算 1.6 MB)
├── app.{js,wxss,json}                    ~10 KB
├── pages/levels/                          选关页 ~80 KB
├── pages/game/                            主游戏页 ~150 KB
├── components/                            公共组件 ~120 KB
│   ├── cmd-card                          指令卡
│   ├── queue-bar                         队列栏
│   ├── dialog-bubble                     对话气泡
│   ├── password-dial                     密码盘
│   ├── letter-keyboard                   字母键盘
│   ├── social-modal                      三选一对话框
│   └── exam-timer                        模考计时器
├── engine/                                引擎逻辑 ~120 KB
│   ├── state.js
│   ├── queue.js
│   ├── executor.js
│   ├── level-rules.js
│   ├── hint.js
│   └── exam.js
├── render/                                Canvas 渲染 ~100 KB
│   ├── canvas-adapter.js
│   ├── scene.js
│   ├── sprites/
│   └── animations.js
├── utils/                                 工具 ~30 KB
│   ├── storage.js
│   ├── loader.js
│   └── tts.js
├── levels/                                第一幕关卡 ~80 KB(T1-T5 + C1-C3)
└── voice/                                 第一幕语音 ~600 KB

subpackages:
├── act2/    第二幕(C4-C9 + X1-X3 + 语音)        ~1.4 MB
├── act3/    第三幕(X4-X6 + M1-M3 + 语音)        ~1.5 MB
├── act4/    第四幕(D1-D8 + Y1-Y3 + M4 + 语音)   ~1.8 MB
├── act5/    第五幕(E1-E12 + 语音)               ~1.6 MB
├── act6/    第六幕(F1-F4 + F6-F7 + 语音)        ~0.9 MB
└── act7/    第七幕(G1-G12 + 语音)               ~1.7 MB

总计:~10.5 MB(留 9.5 MB 余量)
```

### 6.2 分包预下载策略

`app.json` 中配置 `preloadRule`:用户在第一幕 T3 之后,后台预下载第二幕(避免点 C4 时等下载)。

```json
"preloadRule": {
  "pages/levels/index": {
    "network": "wifi",
    "packages": ["act2", "act3"]
  }
}
```

### 6.3 语音包

- 来源:`scripts/gen-voice.mjs` 调腾讯云 TTS 离线生成
- 命名:`miniprogram/voice/{LevelID}/{hash}.mp3`,hash 取自对话文本的 SHA1 前 8 位
- 索引:`voice-manifest.json` 记录"对话文本 → mp3 路径"
- 工具链一次性写好后,**用户每次完成新关卡后跑一次脚本**,把新对话补全 mp3

---

## 7. 改造路线图

| 阶段 | 任务 | 工期估算 | 状态 |
|---|---|---|---|
| **阶段 0** | 设计系统 v7.2 冻结 + 选关 / 游戏页 mockup | 已完成 | ✅ |
| **阶段 1** | 项目脚手架(app.json / 分包 / project.config.json / sitemap.json) | 0.5 天 | 🚧 待启动 |
| **阶段 2** | 数据层(levels JSON 同步 / storage / loader) | 0.5 天 | 🚧 待启动 |
| **阶段 3** | 引擎逻辑层(从 game.js 剥离纯算法部分) | 2 天 | 🚧 待启动 |
| **阶段 4** | Canvas 渲染层(替代 Phaser 159 处调用) | 3-4 天 | 🚧 待启动 |
| **阶段 5** | UI 层(WXML 组件) | 2-3 天 | 🚧 待启动 |
| **阶段 6** | 语音包工具链 + 第一幕语音生成 | 1 天 | 🚧 待启动 |
| **阶段 7** | 真机预览 + 全 65 关回归 | 1 天 | 🚧 待启动 |

**总工期估算:10-13 个工作日**(分多次会话推进)。

每个阶段产出代码后,直接 commit + push 到 `WeChat` 分支,不经用户本地。

---

## 8. 与 main 分支的关系

### 8.1 哪些可以共享

- `levels/*.json` —— **冷同步**:main 分支改了关卡,通过 `git cherry-pick` 同步到 WeChat 分支
- `assets/_prompts/` —— **冷同步**:Banana 提示词不依赖运行环境
- `.claude/skills/aiGame/references/` —— **直接读**:剧本 / 角色名册 / 关卡规范

### 8.2 哪些必须独立

- 所有 HTML / CSS / JS 代码 —— main 分支用 Phaser + DOM,WeChat 分支用 WXML + Canvas
- `tests/smoke.html` —— main 分支用浏览器测;WeChat 分支用 Node 写关卡数据校验
- README / SKILL —— 各自维护,但可以互相引用

### 8.3 同步流程(关卡更新场景)

```
1. main 分支修改 levels/Tx.json
2. main 分支提交 + push
3. 切到 WeChat 分支:git cherry-pick {commit-hash}
4. 解决冲突(理论上没有,因为 levels/ 在两边路径不同)
5. 重新生成对应 Tx.json 的语音 mp3:node scripts/gen-voice.mjs --level Tx
6. WeChat 分支 commit + push
```

---

## 9. 给 AI 写代码的硬规则(WeChat 分支专属)

每次在 WeChat 分支生成代码,**先自检以下 8 条**,任何一条不满足都要拒绝产出:

1. ❓ 是否引入了 React / Vue / Tailwind / shadcn / styled-components 等 Web 框架?→ 拒绝
2. ❓ 是否要求 npm install / webpack / vite 等构建步骤?→ 拒绝
3. ❓ 是否使用了 4.1 规定的 5 个十六进制以外的颜色值?→ 拒绝(只有 mock 占位文字 / 调试用色除外)
4. ❓ 字号是否低于 26rpx @ 1280 设计稿?→ 拒绝
5. ❓ 触摸目标是否低于 60×50pt @ 标准屏宽?→ 拒绝
6. ❓ 是否使用了 blur shadow / drop-shadow?→ 拒绝(必须用硬偏移阴影)
7. ❓ UI 文案是否使用了"开干 / 跑路 / 全扔了"等非标准黑话?→ 拒绝(改成行业标准)
8. ❓ 是否在 WeChat 分支独立修改了 `miniprogram/levels/*.json` 关卡数据?→ 拒绝(必须从 main 分支 cherry-pick)

---

## 10. 输入输出契约

### 场景 1:新建小程序页面 / 组件
- 输入:页面/组件名 + 功能描述
- 输出:完整的 WXML / WXSS / JS / JSON 四件套,**严格遵守第 4 节设计系统**,附受影响文件清单 + 视觉自检结果

### 场景 2:翻译 game.js 中的某个 Phaser 块到 Canvas
- 输入:网页版 game.js 的某个函数 / 类
- 输出:对应的小程序 Canvas 实现,附 Phaser → 原生 API 对应表执行结果

### 场景 3:添加新动作 / 实体
- 输入:动作 / 实体名 + 行为描述
- 输出:同时改 `miniprogram/engine/level-rules.js`(逻辑)+ `miniprogram/render/sprites/`(绘制)+ `miniprogram/components/cmd-card`(如果需要新指令卡),三处一致

### 场景 4:语音包工具链
- 输入:腾讯云 TTS 凭据(用户本地 .env)
- 输出:`scripts/gen-voice.mjs` 脚本 + `voice-manifest.json` 索引格式,**用户在自己机器上跑,Claude 不接触凭据**

---

## 11. 项目核心价值观(WeChat 分支专属补充)

在 main 分支的"孩子能不能独立玩通 → 是否契合赛事 → 攻方思维 → 美观度 → 开发效率"5 条之上,WeChat 分支额外加 1 条放在最高:

**0. 视觉一致性不可妥协**——v7.2 设计系统是 WeChat 分支的灵魂,任何"为了快速实现而做的颜色 / 字号 / 排版妥协"都会在长期 review 时被打回。

如果一个改动让代码更短但破坏了 3 色规则,选后者。如果一个组件更通用但需要新色相,要么找替代方案,要么不做。

---

**本文件是 WeChat 分支唯一权威。任何开发活动必须先读完本 SKILL 全文。**
