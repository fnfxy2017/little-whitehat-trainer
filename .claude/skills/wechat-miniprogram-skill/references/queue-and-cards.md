# 队列与卡片系统（拖拽 + preset_queue）

> 本文回答：怎么实现卡片栏、队列槽、卡片拖拽、preset_queue 应用与重置。

## 数据模型（与 H5 版本一致）

JSON 里的字段保持不变：

```json
{
  "level_id": "t3",
  "cards": [
    { "id": "fwd", "type": "direction", "label": "前进", "icon": "/assets/fwd.png" },
    { "id": "left", "type": "direction", "label": "左转" },
    { "id": "fn_a", "type": "function", "label": "动作A" }
  ],
  "preset_queue": [
    { "card_id": "fwd" },
    { "card_id": "fwd" }
  ]
}
```

内存模型：

```js
// 关卡运行时
{
  cards: [...],         // 来自 JSON，不变
  queue: [],            // 用户构建的队列，初始为空或 preset_queue
  inventoryUsed: {},    // {fwd: 2} 表示 fwd 用了 2 次（如果有数量限制）
}
```

## 三种重置场景的统一处理

```js
// level.js
applyPresetQueue() {
  const presetQueue = this.data.level.preset_queue || [];
  this.setData({ queue: [...presetQueue] });
}

onRetry() {
  // 重试：清空进度，重新应用 preset
  this.setData({ wasFinished: false });
  this.applyPresetQueue();
}

onReplay() {
  // 重玩：与 retry 类似但保留某些状态（看具体设计）
  this.applyPresetQueue();
}

onClearQueue() {
  // 清空：用户手动清空队列时，C 系列也要恢复 preset
  this.applyPresetQueue();
}
```

**关键原则：所有"重置"路径都走 applyPresetQueue()**，不要散落在各处分别 setData。这是现有 H5 版本踩过的坑。

## 卡片栏 + 队列布局

```html
<!-- level.wxml -->
<view class="stage">
  <wa-stage state="{{stage}}" />     <!-- 婉婉舞台 -->
</view>

<!-- 队列槽 -->
<view class="queue-area">
  <queue-display 
    queue="{{queue}}" 
    bindqueue-changed="onQueueChanged" />
</view>

<!-- 卡片栏 -->
<view class="card-tray" wx:if="{{level.cards.length > 0}}">
  <card-item 
    wx:for="{{level.cards}}" 
    wx:key="id"
    card="{{item}}" 
    bindcard-dropped="onCardDropped" />
</view>

<!-- 空卡片栏的 manual_tip -->
<view class="manual-tip" wx:if="{{level.cards.length === 0}}">
  {{level.manual_tip}}
</view>
```

## 卡片拖拽（Worklet 版本，推荐）

```js
// components/card-item/index.js
import { shared } from 'wx://animation'

Component({
  properties: { card: Object },
  lifetimes: {
    attached() {
      this._x = shared(0);
      this._y = shared(0);
      this._origX = 0;
      this._origY = 0;
      
      this.applyAnimatedStyle('.card', () => {
        'worklet';
        return {
          transform: `translate(${this._x.value}px, ${this._y.value}px)`,
          zIndex: this._x.value || this._y.value ? 100 : 1,
        };
      });
    }
  },
  methods: {
    onTouchStart(e) {
      'worklet';
      this._origX = e.touches[0].pageX;
      this._origY = e.touches[0].pageY;
    },
    onTouchMove(e) {
      'worklet';
      this._x.value = e.touches[0].pageX - this._origX;
      this._y.value = e.touches[0].pageY - this._origY;
    },
    onTouchEnd(e) {
      // 这一步要回到逻辑层做"是否落进队列槽"的判定
      const finalX = this._x.value;
      const finalY = this._y.value;
      
      // 通过 selectorQuery 拿到队列槽的位置范围
      this.checkDropZone(finalX, finalY).then(slotIndex => {
        if (slotIndex >= 0) {
          // 落进了队列
          this.triggerEvent('card-dropped', {
            cardId: this.properties.card.id,
            slotIndex
          });
          // 视觉上让卡片飞回原位
          this._x.value = 0;
          this._y.value = 0;
        } else {
          // 没落进，弹回原位（spring 动画）
          this._x.value = wx.worklet.spring(0);
          this._y.value = wx.worklet.spring(0);
        }
      });
    },
    async checkDropZone(x, y) {
      // 查询队列槽位置（实现略，用 createSelectorQuery）
      return -1;
    }
  }
});
```

```html
<!-- card-item.wxml -->
<view class="card"
      bindtouchstart="onTouchStart"
      bindtouchmove="onTouchMove"
      bindtouchend="onTouchEnd">
  <image src="{{card.icon}}" />
  <text>{{card.label}}</text>
</view>
```

## 队列重排

队列里的卡片可以拖来交换顺序。原理与上面相同，但目标判定换成"插入哪个位置"：

```js
onTouchEnd(e) {
  const targetIndex = computeInsertIndex(this._x.value);
  this.triggerEvent('queue-reorder', {
    fromIndex: this.properties.index,
    toIndex: targetIndex
  });
}
```

## 卡片限量（可选）

如果某些 T 关卡限制每张卡片只能用一次，在 onCardDropped 里检查：

```js
onCardDropped(e) {
  const { cardId, slotIndex } = e.detail;
  const used = this.data.inventoryUsed[cardId] || 0;
  const card = this.findCard(cardId);
  
  if (card.maxUse && used >= card.maxUse) {
    wx.showToast({ title: '这张卡片用完了', icon: 'none' });
    return;
  }
  
  const newQueue = [...this.data.queue];
  newQueue.splice(slotIndex, 0, { card_id: cardId });
  this.setData({
    queue: newQueue,
    [`inventoryUsed.${cardId}`]: used + 1
  });
}
```

## 退化方案：无 Worklet 的拖拽

如果不开 Skyline、或者 Worklet 调试有问题，可以用 movable-area + movable-view 组件做拖拽：

```html
<movable-area class="movable-area">
  <movable-view direction="all" 
                bindchange="onMove" 
                bindtouchend="onDrop">
    <image src="{{card.icon}}" />
  </movable-view>
</movable-area>
```

但 movable-view 在拖动过程中会触发 setData，频率高时会卡。**推荐还是 Worklet**。

## 队列执行（点击「运行」按钮后）

```js
async runQueue() {
  for (const item of this.data.queue) {
    await this.executeCommand(item.card_id);
  }
  this.checkComplete();
}

executeCommand(cardId) {
  // 通知舞台 Component 执行一步动画
  return new Promise(resolve => {
    this.selectComponent('#stage').step(cardId, resolve);
  });
}
```

舞台 Component 内部用 transition 或 Worklet 完成单步动画，结束时 resolve。
