# 分包加载与启动优化

> 本文回答：怎么让小程序启动快、怎么用分包减少首屏体积。

## 单包大小限制

- 单个分包 / 主包：≤ 2MB
- 整个小程序所有分包合计：≤ 30MB
- 主包尽量小（启动最快），其他都进分包

## 婉婉冒险的分包建议

```json
// app.json
{
  "pages": [
    "pages/home/home",       // 主包：关卡选择菜单
    "pages/level/level",     // 主包：T 系列关卡都用这个页面
    "pages/result/result"    // 主包：结算页
  ],
  "subpackages": [
    {
      "root": "subpackages/concept-levels",
      "pages": [
        "pages/c-level/c-level"     // 分包：C 系列关卡（独立页面）
      ]
    }
  ],
  "preloadRule": {
    "pages/home/home": {
      "network": "all",
      "packages": ["subpackages/concept-levels"]
    }
  }
}
```

**preloadRule** 让用户停在首页时后台预下载 C 系列分包，孩子选到 C1 时秒开。

## 资源放在哪里

```
miniprogram/
├── images/                  # 主包：UI 图标、关卡图标（小、必须立刻用）
├── data/levels/             # 主包：T 系列 JSON
└── subpackages/concept-levels/
    ├── pages/...
    ├── data/                # 分包：C 系列 JSON
    └── images/              # 分包：C 系列专用图
```

**重图片（背景图、动画帧）放分包**或者放 CDN。代码包内只放小 UI。

## 远程图片（推荐）

```js
<image src="https://your-cdn.com/wa.png" />
```

需要在 mp 后台「开发设置」→「服务器域名」→「downloadFile 合法域名」加入你的 CDN。

**优势：**
- 主包不会因为一张图被拖大
- 资源可以随时更新而不用重新提审小程序版本
- CDN 缓存命中很快

## 字体（自定义中文字体）

中文字体动辄 3-5MB，**绝对不能放代码包**。

```js
// app.js
App({
  onLaunch() {
    wx.loadFontFace({
      family: 'KidFont',
      source: 'url("https://your-cdn.com/kidfont.woff2")',
      global: true,
      success: () => console.log('字体加载完成')
    });
  }
})
```

加载完成前用系统字体兜底，加载完成后自动切换。

## 启动性能检查清单

- [ ] 主包 ≤ 2MB（理想 < 1MB）
- [ ] 启动时不调用大量 wx.* API
- [ ] 启动时不 require 所有关卡数据（按需加载）
- [ ] app.js 的 onLaunch 不做耗时操作（写 console.log 都要节制）
- [ ] 首页（pages/home）的 onLoad 不调用 setData 多次
- [ ] 启用「按需注入」 `lazyCodeLoading: "requiredComponents"`
- [ ] 启用 Skyline（首屏渲染快）
- [ ] 启用「初始渲染缓存」（适合关卡列表这种数据稳定的页面）

## 初始渲染缓存

关卡列表第二次进入可以用上次的渲染结果直接显示，不用等 JS 加载。

```json
// pages/home/home.json
{
  "initialRenderingCache": "static"
}
```

适合数据基本不变的页面。如果关卡列表会因解锁状态变化，用 `"dynamic"` 模式。

## 体积压缩工具

开发者工具 → 详情 → 上传时勾选：
- ✅ 上传时压缩代码（混淆 + 压缩）
- ✅ 上传时压缩 wxss
- ✅ 上传时压缩 wxml
- ✅ 上传时不带 source map（提审版本）

## 启动流程图

```
用户点击小程序图标
  │
  ▼
1. 下载主包（首次约 1-3s，有缓存秒开）
  │
  ▼
2. 启动 JS 引擎、初始化基础库
  │
  ▼
3. 注入 app.js + 首页所需代码（按需注入只注入用到的组件）
  │
  ▼
4. App.onLaunch → Page.onLoad → 渲染首屏
  │
  ▼
5. 后台预下载分包（由 preloadRule 控制）
  │
  ▼
6. 用户点 C 系列关卡 → 直接打开（已预下载）
```

## 常见的启动慢原因

- ❌ 主包里塞了所有关卡 JSON 和素材
- ❌ app.js 的 onLaunch 同步处理 wx.getStorage 大量数据
- ❌ 首页 onLoad 调用了 5 个 wx.request
- ❌ 自定义字体放在主包里
- ❌ 没启用 Skyline，WebView 启动慢
- ❌ 没开按需注入，注入了所有组件代码

## 离线测试

开发者工具有「弱网模拟」开关。**接近孩子真实使用环境的网络（WiFi 信号差/4G）测一下**，没缓存第一次启动是否还能 ≤ 4 秒。
