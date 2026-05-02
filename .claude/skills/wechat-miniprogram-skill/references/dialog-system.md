# 对话系统实现（介绍弹窗、对话气泡、跳过按钮）

> 本文回答：怎么把现有 H5 的对话系统迁到小程序，并保留所有现有特性。

## 现有特性清单（来自 H5 版本）

- 介绍对白每次进入关卡都重播（不做"已看过"guard）
- 每条对白文字 ≤ 20 字
- 每条对白有"跳过 »"按钮
- 概念关卡（C 系列）卡片栏空时显示 manual_tip
- 对话支持打字机效果（可选）

全部用 DOM 实现，**不需要 Canvas**。

## 数据结构

JSON 里的 `intro_dialogs` 字段保持不变：

```json
{
  "level_id": "t1",
  "intro_dialogs": [
    { "speaker": "wa", "text": "嗨！我是婉婉" },
    { "speaker": "wa", "text": "今天教你方向指令" },
    { "speaker": "system", "text": "拖卡片到队列里" }
  ],
  "manual_tip": "拖动卡片到下面的格子"
}
```

## 介绍弹窗 Component

```html
<!-- intro-dialog.wxml -->
<view class="mask" wx:if="{{visible}}">
  <view class="dialog">
    <image class="avatar" src="{{avatar}}" />
    <view class="bubble">
      <text class="text">{{currentText}}</text>
      <view class="skip" bindtap="onSkip">跳过 »</view>
      <view class="next" bindtap="onNext" wx:if="{{!typing}}">▶</view>
    </view>
  </view>
</view>
```

```js
// intro-dialog.js
Component({
  properties: {
    dialogs: { type: Array, value: [] },  // 父组件传入
    autoStart: { type: Boolean, value: true }
  },
  data: {
    visible: false,
    currentIndex: 0,
    currentText: '',
    avatar: '',
    typing: false,
  },
  observers: {
    'dialogs': function(dialogs) {
      if (dialogs && dialogs.length && this.data.autoStart) {
        this.start();
      }
    }
  },
  methods: {
    start() {
      this.setData({ visible: true, currentIndex: 0 });
      this.showCurrent();
    },
    showCurrent() {
      const item = this.properties.dialogs[this.data.currentIndex];
      if (!item) {
        this.finish();
        return;
      }
      
      const avatar = item.speaker === 'wa' ? '/assets/wa.png' : '/assets/system.png';
      this.setData({ avatar, currentText: '', typing: true });
      this.typewrite(item.text);
    },
    typewrite(fullText) {
      // 打字机效果：节流到 60ms 一字符
      let i = 0;
      this._typeTimer = setInterval(() => {
        if (i >= fullText.length) {
          clearInterval(this._typeTimer);
          this.setData({ typing: false });
          return;
        }
        i++;
        this.setData({ currentText: fullText.slice(0, i) });
      }, 60);
    },
    onNext() {
      if (this.data.typing) {
        // 还在打字时点击 = 立刻显示完整
        clearInterval(this._typeTimer);
        const item = this.properties.dialogs[this.data.currentIndex];
        this.setData({ currentText: item.text, typing: false });
        return;
      }
      const next = this.data.currentIndex + 1;
      if (next >= this.properties.dialogs.length) {
        this.finish();
      } else {
        this.setData({ currentIndex: next });
        this.showCurrent();
      }
    },
    onSkip() {
      clearInterval(this._typeTimer);
      this.finish();
    },
    finish() {
      this.setData({ visible: false });
      this.triggerEvent('finish');
    }
  },
  detached() {
    clearInterval(this._typeTimer);
  }
});
```

## 父级关卡页使用

```html
<!-- level.wxml -->
<intro-dialog 
  dialogs="{{level.intro_dialogs}}" 
  bindfinish="onIntroFinish" />

<view wx:if="{{level.cards.length === 0}}" class="manual-tip">
  {{level.manual_tip}}
</view>

<!-- 其他游戏 UI -->
```

```js
// level.js
Page({
  data: { level: null },
  onLoad(options) {
    const level = require(`../../data/levels/${options.id}.json`);
    this.setData({ level });
    // 注意：这里不需要任何 introShown guard，
    // dialog 的 autoStart 默认 true，每次进页面都会重播
  },
  onIntroFinish() {
    // 介绍结束后，可能需要应用 preset_queue（C 系列）
    if (this.data.level.preset_queue) {
      this.applyPresetQueue(this.data.level.preset_queue);
    }
  }
});
```

## 字数校验（推荐写到 utils）

```js
// utils/level-loader.js
function validateLevel(level) {
  for (const d of level.intro_dialogs || []) {
    if (d.text.length > 20) {
      console.error(`[关卡 ${level.level_id}] 对白超过 20 字: "${d.text}"`);
    }
  }
}
```

可以在开发模式下 onLoad 时跑一次校验，正式版去掉。

## 对话气泡（关卡进行中的旁白）

不同于介绍弹窗，关卡进行中的提示是浮动小气泡：

```html
<view class="bubble" wx:if="{{tipVisible}}" 
      style="left: {{tipX}}px; top: {{tipY}}px">
  {{tipText}}
</view>
```

```css
.bubble {
  position: absolute;
  background: white;
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  animation: pop 200ms ease-out;
}
@keyframes pop {
  from { transform: scale(0); }
  to { transform: scale(1); }
}
```

旁白的位置可以用 CSS 动画一次性弹出，不需要 Worklet。

## 易踩的坑

- ❌ 在 onLoad 里直接 `setData({ introVisible: true })` 不通过 Component — Component 隔离能让对话框 setData 不触发整页 diff
- ❌ 打字机用 `setData({ text: text + char })` 多次拼接 — 直接 slice 用索引更安全
- ❌ 跳过按钮用 button 组件 — Skyline 下 button 有原生样式，用 view bindtap 更可控
- ❌ 把 dialogs 数组扔进 page data 又每帧 setData — dialogs 应该挂在 properties，是只读的
