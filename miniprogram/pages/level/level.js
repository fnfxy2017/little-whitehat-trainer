// pages/level/level.js · 关卡主控制器
const levelLoader = require('../../utils/level-loader.js');
const loadLevel = levelLoader.loadLevel;
const listLevelIds = levelLoader.listLevelIds;
const storage = require('../../utils/storage.js');

const app = getApp();

// 卡片图标映射
const CARD_ICON = {
  arrow_up: '↑', arrow_down: '↓', arrow_left: '←', arrow_right: '→',
  hand_grab: '📦', pickup: '📦',
  hand_drop: '📤', drop: '📤',
  set_color: '🎨',
  color_red: '🔴', color_yellow: '🟡', color_green: '🟢', color_blue: '🔵',
  take_credential: '🪪', credential_take: '🪪',
  water: '💧', water_drop: '💧',
  repeat: '🔁', repeat_loop: '🔁',
  buy: '🛒', buy_milk: '🥛', buy_icecream: '🍦',
  buy_bread: '🍞', buy_apple: '🍎',
  break_mirror: '💢',
  social_engineer: '🎭'
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

    // 重复容器编辑(T5)
    showRepeatEditor: false,
    repeatTimes: 5,
    repeatBody: [],          // 容器内的子指令 [{ icon, label, action, dir, ... }]
    repeatEditorCard: null,  // 当前正在编辑的 repeat 卡片

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
    const self = this;
    const queue = ps.map(function (p, i) {
      const card = self.data.level.cards.find(function (c) { return c.id === p.card_id; });
      const action = card ? card.action : (p.action || 'move');
      const dir = card ? card.dir : p.dir;
      const color = card ? card.color : p.color;
      // label 优先用 preset_queue 自带(JSON 已经写好"向右 2 步"等完整文案);
      // 回退到 card.label,最后是 card_id
      const label = p.label || (card ? card.label : p.card_id);
      // icon 优先用 preset_queue 自带(可能是 buy_milk/buy_icecream 等特殊图);
      // 回退到 card.iconText / action 默认图标
      const iconText = (p.icon && CARD_ICON[p.icon]) ||
                       (card ? card.iconText : null) ||
                       CARD_ICON[action] || '·';
      // steps 用于实际执行(move 类),不参与 label 显示
      const steps = p.steps || (card && card.stepsInput ? 1 : null);
      return {
        key: 'pre-' + i,
        cardId: p.card_id || p.id,
        action: action,
        dir: dir,
        color: color,
        item: p.item || null,    // C1 buy 动作的 item 标识
        steps: steps,
        label: label,
        icon: iconText,
        locked: !!p.locked,
        malicious: !!p.malicious
      };
    });
    this.setData({ queue: queue });
  },

  // =========================================================================
  // 卡片操作
  // =========================================================================
  onTapCard(e) {
    if (this.data.running) return;
    const id = e.currentTarget.dataset.id;
    const card = this.data.level.cards.find(function (c) { return c.id === id; });
    if (!card) return;

    // 容器卡片(repeat)→ 打开重复编辑器
    if (card.isContainer) {
      this.setData({
        showRepeatEditor: true,
        repeatTimes: 5,
        repeatBody: [],
        repeatEditorCard: card
      });
      return;
    }

    // 步数输入卡 → 弹步数选择
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

  // 重复编辑器内的 mini 卡片栏 — 专用处理器,只做"加进容器"
  onTapMiniCard(e) {
    const id = e.currentTarget.dataset.id;
    const card = this.data.level.cards.find(function (c) { return c.id === id; });
    if (!card) return;
    if (card.isContainer) {
      wx.showToast({ title: '不能嵌套重复', icon: 'none', duration: 1200 });
      return;
    }
    this._addToRepeatBody(card);
  },

  // ---- 容器内添加子指令 ----
  _addToRepeatBody(card) {
    // 容器内不再支持 stepsInput(简化);如果是 stepsInput 卡,默认 1 步
    const item = {
      key: 'rb-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      cardId: card.id,
      action: card.action,
      dir: card.dir,
      color: card.color,
      steps: card.stepsInput ? 1 : null,
      label: card.label,
      icon: card.iconText
    };
    const repeatBody = this.data.repeatBody.concat([item]);
    this.setData({ repeatBody: repeatBody });
  },

  onTapRepeatBodyItem(e) {
    const idx = e.currentTarget.dataset.index;
    const repeatBody = this.data.repeatBody.slice();
    repeatBody.splice(idx, 1);
    this.setData({ repeatBody: repeatBody });
  },

  onPickRepeatTimes(e) {
    const n = e.currentTarget.dataset.n;
    this.setData({ repeatTimes: n });
  },

  onConfirmRepeat() {
    if (this.data.repeatBody.length === 0) {
      wx.showToast({ title: '里面要放点指令', icon: 'none' });
      return;
    }
    const card = this.data.repeatEditorCard;
    const times = this.data.repeatTimes;
    const body = this.data.repeatBody.slice();
    // 包成一个特殊 queue item:action='repeat',body=[],times=N
    const item = {
      key: 'q-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      cardId: card.id,
      action: 'repeat',
      times: times,
      body: body,
      label: card.label + ' ' + times + ' 次',
      icon: card.iconText,
      locked: false
    };
    const queue = this.data.queue.concat([item]);
    this.setData({
      queue: queue,
      showRepeatEditor: false,
      repeatBody: [],
      repeatEditorCard: null
    });
  },

  onCancelRepeat() {
    this.setData({
      showRepeatEditor: false,
      repeatBody: [],
      repeatEditorCard: null
    });
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
      label: (card.stepsInput && steps > 1) ? (card.label + ' ' + steps + ' 步') : card.label,
      icon: card.iconText,
      locked: false
    };
    const queue = this.data.queue.concat([item]);
    this.setData({ queue: queue });
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
  onRunQueue: function () {
    var self = this;
    if (this.data.running) return;
    if (this.data.queue.length === 0) {
      wx.showToast({ title: '先放入指令吧', icon: 'none' });
      return;
    }
    this.setData({ running: true, stepCount: 0 });
    var stage = this.selectComponent('#stage');
    if (!stage) {
      this.setData({ running: false });
      return;
    }

    // 把队列展开:把 repeat 容器拆成 N 倍的子指令序列
    var expanded = [];
    var queue = this.data.queue;
    for (var k = 0; k < queue.length; k++) {
      var cmd = queue[k];
      if (cmd.action === 'repeat') {
        var times = cmd.times || 1;
        var body = cmd.body || [];
        for (var t = 0; t < times; t++) {
          for (var b = 0; b < body.length; b++) {
            expanded.push(body[b]);
          }
        }
      } else {
        expanded.push(cmd);
      }
    }

    var i = 0;
    function runNext() {
      if (i >= expanded.length) {
        var stepCount = stage.getStepCount();
        self.setData({ running: false, stepCount: stepCount });
        self._checkComplete();
        return;
      }
      var c = expanded[i];
      i++;
      stage.execute(c, c.steps).then(runNext, function (err) {
        console.error('[level] 执行出错:', err);
        var stepCount = stage.getStepCount();
        self.setData({ running: false, stepCount: stepCount });
        self._checkComplete();
      });
    }
    runNext();
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
