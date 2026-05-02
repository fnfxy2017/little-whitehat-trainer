// 关卡页通用 JS 模板 - 复制后修改
// 适用于 T 系列教学关卡和 C 系列概念关卡

import { LEVELS } from '../../data/levels/index.js';
import { validate } from '../../utils/level-validator.js';

Page({
  data: {
    level: null,
    queue: [],
    inventoryUsed: {},
    stepCount: 0,
    running: false,
    showResult: false,
  },
  
  onLoad(options) {
    const level = LEVELS[options.id];
    if (!level) {
      wx.showToast({ title: '关卡未找到', icon: 'none' });
      wx.navigateBack();
      return;
    }
    
    // 开发模式下校验
    if (__DEV__) {
      const errors = validate(level);
      if (errors.length) console.warn('关卡数据问题:', errors);
    }
    
    // 业务状态挂在 this，不进 data
    this.audioInstance = null;
    this.levelStartTime = Date.now();
    
    // ⚠️ 注意：不做 introShown guard，每次进入都重播介绍
    this.setData({ level }, () => {
      // 介绍结束后再 applyPresetQueue（在 onIntroFinish）
    });
  },
  
  onUnload() {
    if (this.audioInstance) this.audioInstance.destroy();
  },
  
  // ==================== 介绍流 ====================
  onIntroFinish() {
    // C 系列：介绍结束后填充 preset_queue
    this.applyPresetQueue();
  },
  
  applyPresetQueue() {
    const presetQueue = this.data.level.preset_queue;
    if (presetQueue && presetQueue.length) {
      this.setData({ queue: [...presetQueue] });
    }
  },
  
  // ==================== 卡片操作 ====================
  onCardDropped(e) {
    const { cardId, slotIndex } = e.detail;
    const card = this.data.level.cards.find(c => c.id === cardId);
    
    // 数量上限校验
    if (card.max_use) {
      const used = this.data.inventoryUsed[cardId] || 0;
      if (used >= card.max_use) {
        wx.showToast({ title: '这张卡片用完了', icon: 'none' });
        return;
      }
    }
    
    const newQueue = [...this.data.queue];
    const insertAt = slotIndex >= 0 ? slotIndex : newQueue.length;
    newQueue.splice(insertAt, 0, { card_id: cardId });
    
    this.setData({
      queue: newQueue,
      [`inventoryUsed.${cardId}`]: (this.data.inventoryUsed[cardId] || 0) + 1
    });
  },
  
  onQueueReorder(e) {
    const { fromIndex, toIndex } = e.detail;
    const newQueue = [...this.data.queue];
    const [moved] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, moved);
    this.setData({ queue: newQueue });
  },
  
  onQueueRemove(e) {
    const { index } = e.detail;
    const removed = this.data.queue[index];
    if (removed.locked) {
      wx.showToast({ title: '这张不能移除', icon: 'none' });
      return;
    }
    
    const newQueue = [...this.data.queue];
    newQueue.splice(index, 1);
    
    const cardId = removed.card_id;
    const used = this.data.inventoryUsed[cardId] || 0;
    this.setData({
      queue: newQueue,
      [`inventoryUsed.${cardId}`]: Math.max(0, used - 1)
    });
  },
  
  // ==================== 三个重置入口（统一走 applyPresetQueue） ====================
  onClearQueue() {
    this.setData({ queue: [], inventoryUsed: {} }, () => {
      this.applyPresetQueue();  // C 系列恢复 preset，T 系列不受影响
    });
  },
  
  onRetry() {
    this.setData({ 
      showResult: false, 
      stepCount: 0, 
      queue: [], 
      inventoryUsed: {} 
    }, () => {
      this.applyPresetQueue();
      const stage = this.selectComponent('#stage');
      if (stage) stage.reset();
    });
  },
  
  onReplay() {
    // 与 retry 类似，可能有不同的状态保留策略
    this.onRetry();
  },
  
  // ==================== 队列执行 ====================
  async onRunQueue() {
    if (this.data.running) return;
    if (this.data.queue.length === 0) {
      wx.showToast({ title: '请先放入指令', icon: 'none' });
      return;
    }
    
    this.setData({ running: true });
    const stage = this.selectComponent('#stage');
    
    for (let i = 0; i < this.data.queue.length; i++) {
      const item = this.data.queue[i];
      const card = this.data.level.cards.find(c => c.id === item.card_id) 
                || this.findPresetCard(item.card_id);
      
      try {
        await stage.execute(card);
      } catch (err) {
        // 撞墙或失败
        console.error('指令执行失败:', err);
        break;
      }
    }
    
    this.setData({ running: false });
    this.checkComplete();
  },
  
  findPresetCard(cardId) {
    // C 系列的 preset_queue 可能引用不在 cards 列表里的卡片
    // 这里需要从一个全局卡片字典里找
    return require('../../data/all-cards.json')[cardId];
  },
  
  // ==================== 通关判定 ====================
  onStageStep() {
    this.setData({ stepCount: this.data.stepCount + 1 });
  },
  
  onLevelComplete() {
    this.setData({ showResult: true });
  },
  
  checkComplete() {
    const stage = this.selectComponent('#stage');
    if (stage && stage.isComplete()) {
      this.setData({ showResult: true });
    } else {
      // 没通关，提示一下
      wx.showToast({ title: '再想想', icon: 'none' });
    }
  },
  
  // ==================== 导航 ====================
  onBack() {
    wx.navigateBack();
  },
  
  onNext() {
    // 跳转到下一关，需要根据 manifest 顺序计算
    const nextId = this.computeNextLevelId();
    if (nextId) {
      wx.redirectTo({ url: `/pages/level/level?id=${nextId}` });
    } else {
      wx.redirectTo({ url: '/pages/home/home' });
    }
  },
  
  computeNextLevelId() {
    // 实现略
    return null;
  },
});
