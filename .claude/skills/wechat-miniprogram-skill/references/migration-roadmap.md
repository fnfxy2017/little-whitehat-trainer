# 迁移路线图（H5 → 小程序）

> 本文回答：从已有的 H5 版本到能上线的小程序版本，每一步做什么、做完算成功。

## 总览

```
当前: H5 版本（GitHub Pages 已上线）
       │
       ▼
[第 1 步] 项目骨架        ────► hello world 跑通
       │
       ▼
[第 2 步] 关卡选择页      ────► 静态读 JSON 列表
       │
       ▼
[第 3 步] 对话系统组件    ────► 介绍弹窗 + 跳过 + 打字机
       │
       ▼
[第 4 步] T1 跑通         ────► 卡片→队列→婉婉移动→通关
       │   （方案 A 优先：纯 DOM + Worklet）
       │
       ▼ [若方案 A 不流畅]
[第 4.5 步] 切到 Canvas
       │
       ▼
[第 5 步] T2-T5 套模板    ────► 复制现有 JSON
       │
       ▼
[第 6 步] C1 + preset_queue   ────► 测试 retry/replay/clear
       │
       ▼
[第 7 步] 分包 + 启动优化  ────► 启动 ≤ 2s
       │
       ▼
[第 8 步] 真机 Bug fix    ────► 孩子玩 3 关不卡
```

## 每一步详细说明

---

### 第 1 步：项目骨架（半天）

**做什么：**
1. 在 mp.weixin.qq.com 注册小程序账号，拿到 AppID
2. 安装微信开发者工具（最新稳定版）
3. 用工具创建空项目，AppID 填你自己的
4. 在 `app.json` 里启用 Skyline + glass-easel
5. 配置 project.config.json 的 setting

**关键配置：**
```json
// app.json
{
  "pages": ["pages/home/home"],
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "lazyCodeLoading": "requiredComponents",
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTitleText": "白帽小队训练营",
    "navigationBarTextStyle": "black"
  }
}
```

**完成判断：**
- 开发者工具能跑起项目
- 能看到 hello world 页
- 真机预览（扫码）能跑

---

### 第 2 步：关卡选择页（半天）

**做什么：**
1. 从 H5 项目复制现有的 `data/levels/*.json` 到小程序的 `data/levels/`
2. 写 `manifest.json`（参考 level-json-schema.md）
3. 实现 `pages/home/home`：scroll-view + 网格布局
4. 点击关卡卡片 → 跳转 `/pages/level/level?id=t1`

**完成判断：**
- 能看到所有关卡的图标和名字
- 点击能跳转到关卡页（关卡页此时是空的也行）
- 列表流畅滚动

---

### 第 3 步：对话系统组件（1 天）

**做什么：**
1. 实现 `components/intro-dialog/`（参考 dialog-system.md）
2. 实现"跳过 »"按钮、打字机效果
3. 在 `pages/level/level` 里使用，传入 dummy dialogs 测试

**完成判断：**
- 进入关卡能看到对白逐字显示
- 点击"跳过"能跳过整组对白
- 点击对白可以跳过当前条进入下一条
- 离开关卡再进入，对白重播
- 真机看：每条对白 ≤ 20 字、不溢出

---

### 第 4 步：T1 关跑通（1-2 天）

**做什么：**
1. 实现 `components/wa-stage/`（婉婉舞台，方案 A：image + Worklet）
2. 实现 `components/card-tray/`（卡片栏）
3. 实现 `components/queue-display/`（队列槽）
4. 实现 `components/card-item/`（单张卡片，可拖拽）
5. 实现"运行"按钮 + 队列执行逻辑
6. 实现通关判定 + 结算弹窗

**完成判断：**
- 能拖卡片到队列里
- 能从队列拖回卡片栏
- 点击"运行"，婉婉按队列移动
- 到达终点提示通关
- 整个过程帧率 ≥ 30 FPS（真机）

**如果不流畅：**
进入 4.5 步——把 wa-stage 切换成 Canvas 实现（参考 canvas-2d-rules.md）。卡片栏、队列、对话系统**保持 DOM 不变**。

---

### 第 5 步：T2-T5 套模板（1 天）

**做什么：**
1. 把 H5 里的 t2/t3/t4/t5 JSON 复制过来
2. 在 wa-stage 里实现各类卡片对应的动画/状态变化
   - color 卡 → 改背景色
   - credential 卡 → 显示凭证图标
   - logic 卡 → 条件分支显示
   - function 卡 → 调用函数标记

**完成判断：**
- 五个 T 关都能从头玩到尾
- 介绍对白都正确显示
- 通关条件都能触发

---

### 第 6 步：C1 + preset_queue（1 天）

**做什么：**
1. 在 level 的 onLoad / onIntroFinish 钩子里实现 `applyPresetQueue()`
2. 实现 retry / replay / clear 三个按钮，全部走 applyPresetQueue
3. 实现 `security_concept` 的展示弹窗（关卡通关后展示）

**完成判断：**
- 进入 C1 队列已经预填好
- 点击 retry → 队列恢复 preset
- 点击 replay → 队列恢复 preset
- 用户清空队列 → 队列恢复 preset（不是变空）
- 通关后展示概念名 + 现实类比 + 防御建议

---

### 第 7 步：分包 + 启动优化（半天）

**做什么：**
1. 把 C 系列关卡移到独立分包：`subpackages/concept-levels/`
2. 启用分包预下载（用户进入首页后预下载 C 包）
3. 检查启动性能：开发者工具 → Audits 或性能面板
4. 大图压缩、用 webp 格式、移除未使用代码

**完成判断：**
- 主包大小 ≤ 2MB（理想 < 1MB）
- 真机冷启动到关卡列表 ≤ 2s
- 进入 C1 时不需要等待加载（预下载已完成）

---

### 第 8 步：真机 Bug fix（按需）

**做什么：**
- 接孩子真机测试（与现有 H5 项目同样的迭代节奏）
- 用真机调试 2.0 看 FPS 和 setData 数据
- 修 Bug 后再请孩子测

**完成判断（验收基线）：**
- 中端安卓启动 ≤ 2s
- 拖拽 ≥ 50 FPS
- 婉婉动画 ≥ 30 FPS
- 切后台再回来状态不丢
- 孩子独立玩 3 关无卡顿报告

---

## 总耗时估计

| 阶段 | 估时 | 说明 |
|---|---|---|
| 1-3 | 2 天 | 骨架 + 列表 + 对话 |
| 4 (方案 A) | 1.5 天 | T1 跑通 |
| 4.5 (兜底) | +1 天 | 仅在方案 A 不行时 |
| 5 | 1 天 | T2-T5 |
| 6 | 1 天 | C1 |
| 7 | 0.5 天 | 优化上线准备 |
| 8 | 持续 | Bug 迭代 |

**核心阶段（1-7）总计 6-7 天**，与 H5 版本的开发量基本相当。其中第 4 步是关键节点，方案 A 跑通就快，跑不通就要多花一天切 Canvas。

## 风险点与应对

| 风险 | 触发概率 | 应对 |
|---|---|---|
| 方案 A 帧率不够 | 中 | 切方案 B（仅婉婉用 Canvas） |
| Worklet 调试困难 | 中 | 退回 movable-view，接受性能损失 |
| Skyline 某 CSS 不支持 | 低 | 单页切 WebView 渲染 |
| 自定义字体加载失败 | 低 | 用系统字体兜底 |
| 真机 setData 警告 | 中 | 检查 setData 频率，加 Component 隔离 |
| 启动包过大 | 低 | 分包 + 资源压缩 |

## 不在本次迁移范围的事

- ❌ 微信支付、订阅消息、登录 — 教育游戏不需要，第二期再考虑
- ❌ 多人对战 / 排行榜 — 不在产品范围
- ❌ 服务端持久化进度 — 用本地 wx.setStorage 即可
- ❌ 真机推送通知 — 不需要
