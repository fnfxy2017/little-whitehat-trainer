# WeChat 分支 · 微信小程序版

> 这是 main 分支(网页版)的微信小程序移植版本,运行需微信开发者工具。

## 当前状态

🚧 **阶段 1+2 完成** · 脚手架 + 数据层就绪
- ✅ 小程序 app 入口(app.{js,wxss,json})
- ✅ 选关页 + 主游戏页占位骨架
- ✅ 7 个分包配置 + 预下载策略
- ✅ 进度持久化封装(`utils/storage.js`)
- ✅ 关卡加载器(`utils/loader.js`)
- ✅ 第一幕 8 个关卡 JSON 复制到主包(T1-T5 + C1-C3)
- ⬜ 阶段 3-7 待实现

## 怎么在微信开发者工具里打开

1. 下载并安装[微信开发者工具(稳定版)](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开工具,选择"小程序" → "导入项目"
3. 项目目录:**选择 little-whitehat-trainer 仓库根目录**(不是 miniprogram 子目录)
4. AppID:第一次试用可选"测试号"(无需注册)
5. 项目名称:任意填,比如"白帽小队训练营"
6. 点"导入"

工具会自动读取 `project.config.json`,识别 `miniprogram/` 为根目录。

## 此版的运行能力

- 选关页可打开,显示"已加载 8 个关卡"和"测试存档"按钮
- 点"测试存档"会写一条进度到本地,读出来,验证 storage 工具链能用
- 选关页和主游戏页之间通过 `wx.navigateTo` 跳转(目前主游戏页只是占位)
- **真正的关卡渲染、指令交互、Canvas 地图,在阶段 4-5 实现**

## 真机调试

在微信开发者工具点"预览",扫码即可在自己的手机微信中体验。

## 跟 main 分支的关系

- `levels/*.json` 在两个分支冷同步(main 分支改完,WeChat 分支用 `git cherry-pick` 拉过来)
- 网页版的 `index.html` / `levels.html` / `game.js` 在 WeChat 分支保留但不参与小程序构建(被 `project.config.json` 的 `packOptions.ignore` 排除)
- 设计系统 v7.2 是 WeChat 分支专属,定义在 `.claude/skills/wechatGame/SKILL.md`

## 后续阶段路线图

| 阶段 | 任务 | 状态 |
|---|---|---|
| 1 | 脚手架 | ✅ |
| 2 | 数据层(storage / loader) | ✅ |
| 3 | 引擎逻辑(从 game.js 剥离) | 🚧 |
| 4 | Canvas 渲染层 | 🚧 |
| 5 | UI 组件(选关 / 指令栏 / 队列 / 对话) | 🚧 |
| 6 | 语音包工具链(腾讯云 TTS 离线生成 mp3) | 🚧 |
| 7 | 真机回归 + 全 65 关测试 | 🚧 |
