// pages/level/level.js · 关卡主控制器
const { loadLevel, listLevelIds } = require('../../utils/level-loader.js');
const storage = require('../../utils/storage.js');

const app = getApp();

// 卡片图标映射
const CARD_ICON = {
  arrow_up: '↑', arrow_down: '↓', arrow_left: '←', arrow_right: '→',
  hand_grab: '📦', pickup: '📦',
  hand_drop: '📤', drop: '📤',
  set_color: '🎨',
  color_red: '🔴', color_yellow: '🟡', color_green: '🟢', color_blue: '🔵',
  take_credential: '🔑',
  water: '💧', repeat: '🔁'
};

Page({
  data: {
    levelId: '',
    level: null,
    introDialogs: [],
    introVisible: true,
    queue: [],
    stepCount: 0,
    running: false,

    // 状态栏占位
    statusBarHeight: 20,
    navBarHeight: 44,

    // 步数选择
    showStepPicker: false,
    stepPickerLabel: '',
    stepPickerCard: null,

    // 结果弹窗
    showResult: false,
    resultIsClear: false,
    resultDialog: null,
    resultDialogIndex: 0,
    resultDialogHasNext: false,
    nextLevelId: null
  },

  onLoad(opts) {
    // 状态栏占位
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20,
      navBarHeight: app.globalData.navBarHeight || 44
    });

    const id = opts.id;
    if (!id) {
      wx.showToast({ title: '关卡 ID 缺失', icon: 'none' });
      wx.navigateBack();
      return;
    }
    const level = loadLevel(id);
    if (!level) {
      wx.showToast({ title: '关卡不存在: ' + id, icon: 'none' });
      wx.navigateBack();
      return;
    }

    // 准备卡片(注入 iconText)
    level.cards = level.cards.map(c => Object.assign({}, c, {
      iconText: CARD_ICON[c.icon] || CARD_ICON[c.action] || '·'
    }));

    // 下一关 id(同 act 内顺位,跨 act 不算)
    const order = listLevelIds();
    const idx = order.indexOf(id);
    const nextLevelId = (idx >= 0 && idx + 1 < order.length) ? order[idx + 1] : null;

    this.setData({
      levelId: id,
      level,
      introDialogs: level.introDialogs || [],
      nextLevelId
    });
  },

  // =========================================================================
  // 介绍对白
  // =========================================================================
  onIntroFinish() {
    this.setData({ introVisible: false });
    // C 系列:介绍结束后填充 preset_queue
    if (this.data.level.presetQueue && this.data.level.presetQueue.length) {
      this._applyPresetQueue();
    }
  },

  _applyPresetQueue() {
    const ps = this.data.level.presetQueue || [];
    const queue = ps.map((p, i) => {
      // preset_queue 的 card 可能不在 cards 列表里(C 系列特征),
      // 这里能找到就用 card,找不到只显示 label/icon
      const card = this.data.level.cards.find(c => c.id === p.card_id);
      const action = card ? card.action : (p.action || 'move');
      const dir = card ? card.dir : p.dir;
      const color = card ? card.color : p.color;
      const label = card ? card.label : (p.label || p.card_id);
      const iconText = card ? card.iconText : (CARD_ICON[p.icon] || CARD_ICON[action] || '·');
      const steps = p.steps || (card && card.stepsInput ? 1 : null);
      return {
        key: 'pre-' + i,
        cardId: p.card_id,
        action, dir, color,
        steps,
        label: steps && steps > 1 ? `${label} ${steps} 步` : label,
        icon: iconText,
        locked: !!p.locked
      };
    });
    this.setData({ queue });
  },

  // =========================================================================
  // 卡片操作
  // =========================================================================
  onTapCard(e) {
    if (this.data.running) return;
    const id = e.currentTarget.dataset.id;
    const card = this.data.level.cards.find(c => c.id === id);
    if (!card) return;

    if (card.stepsInput) {
      this.setData({
        showStepPicker: true,
        stepPickerLabel: card.label,
        stepPickerCard: card
      });
      return;
    }
    this._pushCard(card, 1);
  },

  onPickSteps(e) {
    const n = e.currentTarget.dataset.n;
    const card = this.data.stepPickerCard;
    this.setData({ showStepPicker: false, stepPickerCard: null });
    if (card) this._pushCard(card, n);
  },

  onCancelStepPicker() {
    this.setData({ showStepPicker: false, stepPickerCard: null });
  },

  _pushCard(card, steps) {
    const item = {
      key: 'q-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      cardId: card.id,
      action: card.action,
      dir: card.dir,
      color: card.color,
      steps: card.stepsInput ? steps : null,
      label: (card.stepsInput && steps > 1) ? `${card.label} ${steps} 步` : card.label,
      icon: card.iconText,
      locked: false
    };
    const queue = this.data.queue.concat([item]);
    this.setData({ queue });
  },

  onTapQueueItem(e) {
    if (this.data.running) return;
    const idx = e.currentTarget.dataset.index;
    const item = this.data.queue[idx];
    if (!item || item.locked) return;
    const queue = this.data.queue.slice();
    queue.splice(idx, 1);
    this.setData({ queue });
  },

  onClearQueue() {
    if (this.data.running) return;
    // 概念关:清空后恢复 preset_queue
    if (this.data.level.presetQueue && this.data.level.presetQueue.length) {
      this._applyPresetQueue();
    } else {
      this.setData({ queue: [] });
    }
  },

  // =========================================================================
  // 执行队列
  // =========================================================================
  async onRunQueue() {
    if (this.data.running) return;
    if (this.data.queue.length === 0) {
      wx.showToast({ title: '先放入指令吧', icon: 'none' });
      return;
    }
    this.setData({ running: true, stepCount: 0 });
    const stage = this.selectComponent('#stage');
    if (!stage) {
      this.setData({ running: false });
      return;
    }

    for (const cmd of this.data.queue) {
      try {
        await stage.execute(cmd, cmd.steps);
      } catch (e) {
        console.error('[level] 执行出错:', e);
        break;
      }
    }
    const stepCount = stage.getStepCount();
    this.setData({ running: false, stepCount });
    this._checkComplete();
  },

  _checkComplete() {
    const stage = this.selectComponent('#stage');
    if (!stage) return;
    if (stage.isComplete()) {
      // 通关
      stage.celebrate();
      try { wx.vibrateShort && wx.vibrateShort({ type: 'medium' }); } catch (e) {}
      // 持久化
      storage.recordCleared(this.data.levelId, {
        steps: this.data.stepCount,
        optimal: this.data.level.optimalSteps
      });
      // 800ms 后弹结果
      setTimeout(() => {
        const onClear = this.data.level.onClearDialogs || [];
        this.setData({
          showResult: true,
          resultIsClear: true,
          resultDialog: onClear[0] || null,
          resultDialogIndex: 0,
          resultDialogHasNext: onClear.length > 1
        });
      }, 800);
    } else {
      // 没到目标
      this.setData({
        showResult: true,
        resultIsClear: false
      });
    }
  },

  onResultDialogNext() {
    const onClear = this.data.level.onClearDialogs || [];
    const next = this.data.resultDialogIndex + 1;
    if (next >= onClear.length) {
      this.setData({ resultDialog: null, resultDialogHasNext: false });
      return;
    }
    this.setData({
      resultDialogIndex: next,
      resultDialog: onClear[next],
      resultDialogHasNext: next < onClear.length - 1
    });
  },

  // 失败:继续调整(婉婉留位置 + 队列清空让玩家继续输入下一段)
  onContinueEditing() {
    this.setData({
      showResult: false,
      queue: [],
      stepCount: 0
    });
    // 婉婉位置由 stage 自己保留,不重置 stage
  },

  // 重新开始
  onRetry() {
    if (this.data.running) return;
    const stage = this.selectComponent('#stage');
    if (stage) stage.reset();
    this.setData({
      showResult: false,
      stepCount: 0,
      queue: []
    });
    if (this.data.level.presetQueue && this.data.level.presetQueue.length) {
      this._applyPresetQueue();
    }
  },

  // =========================================================================
  // 导航
  // =========================================================================
  onBack() {
    wx.navigateBack();
  },
  onBackOrNext() {
    if (this.data.nextLevelId) {
      wx.redirectTo({ url: '/pages/level/level?id=' + this.data.nextLevelId });
    } else {
      wx.navigateBack();
    }
  }
});
