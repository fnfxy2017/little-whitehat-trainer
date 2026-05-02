// pages/game/index.js · 主游戏页(T1 可玩版)
// 目前支持的动作:move(方向移动)
// 后续 commit 会逐步增加 pickup/drop/set_color/take_credential/water/repeat 等

const stateMod = require('./_state.js');
const queueMod = require('./_queue.js');
const executor = require('./_executor.js');
const sceneRender = require('./_scene.js');
const levelData = require('./_level-data.js');

// 角色头像 emoji 映射
const SPEAKER_AVATAR = {
  '小天':   '🤖',
  '婉婉':   '😊',
  '旁白':   '📖',
  '布莱克': '👤',
  '平基':   '🐰',
  '藤蔓妹妹': '🌱',
  '奥伦':   '🎧'
};

// 命令卡 emoji icon
const CMD_ICON = {
  arrow_up:    '↑',
  arrow_down:  '↓',
  arrow_left:  '←',
  arrow_right: '→',
  pickup:      '📦',
  drop:        '📤',
  hand_grab:   '📦',  // T2 等关卡的捡起图标
  hand_drop:   '📤',  // T2 等关卡的放下图标
  set_color:   '🎨',
  take_credential: '🔑',
  water:       '💧',
  repeat:      '🔁'
};

Page({
  data: {
    levelId: '',
    levelTitle: '',
    levelChapter: '',
    levelAct: 1,

    // 渲染相关
    canvasWidth: 0,
    canvasHeight: 0,

    // 阶段:'intro_dialog' / 'playing' / 'executing' / 'cleared' / 'failed'
    phase: 'intro_dialog',

    // 对话
    currentDialog: null,
    dialogIsLast: false,

    // 命令栏
    commandCards: [],

    // 队列
    queue: [],
    queueStepCount: 0,

    // 提示
    showHint: false,
    hintLevel: 0,
    hintText: '',
    hintReady: false,
    hintCountdown: '3:00',

    // 失败
    failMessage: '',

    // 庆祝特效
    showCelebration: false,

    // 步数选择面板
    showStepPicker: false,
    pickerCard: null,
    pickerSteps: []
  },

  onLoad(options) {
    const lid = options.level || 'T1';
    const data = levelData[lid];

    if (!data) {
      wx.showToast({ title: '关卡未找到: ' + lid, icon: 'none', duration: 2000 });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 创建运行时状态
    this._state = stateMod.createState(data);

    // 初始化 UI 数据
    this.setData({
      levelId: data.id,
      levelTitle: data.title || '',
      levelChapter: data.chapter || '',
      levelAct: data.act || 1,
      commandCards: this._prepareCommandCards(data.available_command_cards || []),
    });

    // 启动提示倒计时
    this._startHintCountdown();

    // 显示首句开场对话
    this._showCurrentDialog();
  },

  onReady() {
    // Canvas 必须在 onReady 才能拿到 DOM,因为 wx.createSelectorQuery 此时才有效
    this._initCanvas();
  },

  onUnload() {
    if (this._hintTimer) clearInterval(this._hintTimer);
    if (this._execTimer) clearTimeout(this._execTimer);
    if (this._celebrationTimer) clearTimeout(this._celebrationTimer);
  },

  // =========================================================================
  // Canvas 初始化与重绘
  // =========================================================================

  _initCanvas() {
    const sysInfo = wx.getSystemInfoSync();
    const dpr = sysInfo.pixelRatio || 2;

    const query = wx.createSelectorQuery();
    query.select('#game-canvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        console.error('[game] canvas DOM 获取失败');
        return;
      }
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');

      // 用 .map-wrap 容器宽度算 canvas 实际尺寸
      // T1 grid 10x8,期望地图占用屏宽的 92% 左右
      const screenW = sysInfo.screenWidth;
      const canvasCssW = Math.floor(screenW * 0.88);

      const map = this._state.level.map;
      const [gridW, gridH] = map.size;
      const cellPx = Math.floor(canvasCssW / gridW);
      const canvasCssH = cellPx * gridH;

      canvas.width = canvasCssW * dpr;
      canvas.height = canvasCssH * dpr;
      ctx.scale(dpr, dpr);

      this._canvas = canvas;
      this._ctx = ctx;
      this._canvasCssW = canvasCssW;
      this._canvasCssH = canvasCssH;

      // 设置 wxml 中 .map-wrap 的高度,匹配 canvas
      // canvasCssH 是 px,转 rpx:rpx = px * (750 / screenWidth)
      const mapHeightRpx = Math.round((canvasCssH + 16) * 750 / sysInfo.screenWidth);
      this.setData({ mapHeight: mapHeightRpx });

      this._redraw();
    });
  },

  _redraw() {
    if (!this._ctx) return;
    sceneRender.render(this._ctx, this._canvasCssW, this._canvasCssH, this._state, this._celebrationT || null);
  },

  /**
   * 启动 800ms 庆祝动画:婉婉跳起 + 举手 + 撒花瓣
   * 每帧推进 t,触发 _redraw
   */
  _runCelebrationAnimation(durationMs) {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / durationMs);
      this._celebrationT = t;
      this._redraw();
      if (t < 1) {
        this._celebrationTimer = setTimeout(tick, 16);  // ~60fps
      } else {
        // 动画结束,清除标记,做一次"普通站立"重绘
        this._celebrationT = null;
        this._redraw();
      }
    };
    tick();
  },

  // =========================================================================
  // 命令卡准备
  // =========================================================================

  _prepareCommandCards(rawCards) {
    return rawCards.map(c => ({
      id: c.id,
      label: c.label,
      iconText: CMD_ICON[c.icon] || CMD_ICON[c.action] || '·',  // 降级到 action 图标,再降级到中点
      action: c.action,
      dir: c.dir,
      stepsInput: c.steps_input || false,
      defaultSteps: c.default_steps || 1
    }));
  },

  // =========================================================================
  // 对话流程
  // =========================================================================

  _showCurrentDialog() {
    const list = this._state.dialogList || [];
    const idx = this._state.dialogIndex;
    if (idx >= list.length) {
      this.setData({ currentDialog: null });
      // 对话结束,如果是 intro 就进 playing,如果是 on_clear 就完成通关流程
      if (this._state.phase === 'intro_dialog') {
        this._state.phase = 'playing';
        this.setData({ phase: 'playing' });
      }
      return;
    }
    const d = list[idx];
    const isLast = idx === list.length - 1;
    this.setData({
      currentDialog: {
        speaker: d.speaker,
        text: d.text,
        avatar: SPEAKER_AVATAR[d.speaker] || '💬'
      },
      dialogIsLast: isLast
    });
  },

  onDialogNext() {
    this._state.dialogIndex++;
    this._showCurrentDialog();
  },

  // =========================================================================
  // 提示倒计时
  // =========================================================================

  _startHintCountdown() {
    const update = () => {
      const left = Math.max(0, this._state.hintLockUntil - Date.now());
      const sec = Math.ceil(left / 1000);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      const text = `${m}:${s.toString().padStart(2, '0')}`;
      const ready = left === 0;
      if (ready !== this.data.hintReady || text !== this.data.hintCountdown) {
        this.setData({ hintReady: ready, hintCountdown: text });
      }
      if (ready && this._hintTimer) {
        clearInterval(this._hintTimer);
        this._hintTimer = null;
      }
    };
    update();
    this._hintTimer = setInterval(update, 1000);
  },

  onTapHint() {
    if (!this.data.hintReady) {
      wx.showToast({ title: '稍等一下,先自己想想', icon: 'none', duration: 1500 });
      return;
    }
    if (this._state.hintLevel === 0) {
      this._state.hintLevel = 1;
    }
    const hints = this._state.level.hints || [];
    const h = hints.find(x => x.level === this._state.hintLevel);
    this.setData({
      showHint: true,
      hintLevel: this._state.hintLevel,
      hintText: h ? h.text : ''
    });
  },

  onTapNextHint() {
    if (this._state.hintLevel < 3) {
      this._state.hintLevel++;
      const hints = this._state.level.hints || [];
      const h = hints.find(x => x.level === this._state.hintLevel);
      this.setData({
        hintLevel: this._state.hintLevel,
        hintText: h ? h.text : ''
      });
    }
  },

  onCloseHint() {
    this.setData({ showHint: false });
  },

  // =========================================================================
  // 指令栏交互
  // =========================================================================

  onTapCmdCard(e) {
    if (this._state.phase !== 'playing') return;
    const cardId = e.currentTarget.dataset.id;
    const card = this.data.commandCards.find(c => c.id === cardId);
    if (!card) return;

    if (card.stepsInput) {
      // 弹自定义步数选择面板
      this.setData({
        showStepPicker: true,
        pickerCard: card,
        pickerSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9]
      });
    } else {
      this._pushCommand(card, 1);
    }
  },

  onPickSteps(e) {
    const n = parseInt(e.currentTarget.dataset.n, 10);
    const card = this.data.pickerCard;
    if (card) this._pushCommand(card, n);
    this.setData({ showStepPicker: false, pickerCard: null });
  },

  onCancelPicker() {
    this.setData({ showStepPicker: false, pickerCard: null });
  },

  _pushCommand(card, steps) {
    const cmd = {
      cardId: card.id,
      action: card.action,
      dir: card.dir,
      steps,
      label: steps > 1 ? `${card.label} ${steps} 步` : card.label
    };
    queueMod.pushCommand(this._state, cmd);
    this._refreshQueue();
  },

  onTapQueueItem(e) {
    const idx = e.currentTarget.dataset.index;
    queueMod.removeCommand(this._state, idx);
    this._refreshQueue();
  },

  onClearQueue() {
    queueMod.clearQueue(this._state);
    this._refreshQueue();
  },

  _refreshQueue() {
    this.setData({
      queue: this._state.queue.slice(),
      queueStepCount: queueMod.totalSteps(this._state)
    });
  },

  // =========================================================================
  // 重来 + 执行
  // =========================================================================

  /**
   * 失败后"继续调整":婉婉保持在当前位置,队列清空让玩家继续输入下一段
   * 不重置游戏状态
   */
  onContinueEditing() {
    this._state.phase = 'playing';
    queueMod.clearQueue(this._state);
    this.setData({
      phase: 'playing',
      queue: [],
      queueStepCount: 0,
      failMessage: ''
    });
    this._redraw();
  },

  onReset() {
    // 重新初始化状态(保留对话进度,只重置玩家位置 + 队列 + 失败状态)
    const data = this._state.level;
    const newState = stateMod.createState(data);
    // 保留提示锁状态(不能重来就刷新 3 分钟锁)
    newState.hintLockUntil = this._state.hintLockUntil;
    newState.hintLevel = this._state.hintLevel;
    // 跳过 intro_dialog 直接进 playing
    newState.phase = 'playing';
    newState.dialogIndex = (this._state.level.intro_dialog || []).length;
    this._state = newState;

    this.setData({
      phase: 'playing',
      queue: [],
      queueStepCount: 0,
      currentDialog: null,
      failMessage: ''
    });
    this._redraw();
  },

  onExecute() {
    if (this._state.phase !== 'playing') return;
    if (this._state.queue.length === 0) return;

    this._state.phase = 'executing';
    this.setData({ phase: 'executing' });

    // 展开成原子动作
    const atoms = executor.expandQueue(this._state);
    this._runAtoms(atoms, 0);
  },

  _runAtoms(atoms, i) {
    if (i >= atoms.length) {
      if (executor.checkSuccess(this._state)) {
        // 短暂停顿,让玩家看清婉婉已到终点,再触发庆祝
        this._execTimer = setTimeout(() => {
          this._handleClear();
        }, 350);
      } else {
        this._state.phase = 'failed';
        this.setData({
          phase: 'failed',
          failMessage: '没到门口呢,看看路线再试试'
        });
      }
      return;
    }

    const atom = atoms[i];
    const r = executor.execAtom(this._state, atom);

    if (!r.ok) {
      // 真正的失败(未知动作等),罕见
      this._state.phase = 'failed';
      this.setData({
        phase: 'failed',
        failMessage: r.message || '出错了,再试试'
      });
      return;
    }

    // r.blocked 表示撞墙,但 ok=true,继续执行
    // (不再弹失败弹窗,孩子能自然感知"这步走不通")
    this._redraw();

    this._execTimer = setTimeout(() => {
      this._runAtoms(atoms, i + 1);
    }, 250);
  },

  _handleClear() {
    this._state.phase = 'cleared';
    this._state.clearedAt = Date.now();
    this._state.dialogList = this._state.level.on_clear_dialog || [];
    this._state.dialogIndex = 0;

    // 写入 storage
    try {
      const all = wx.getStorageSync('wanwan_progress') || {};
      const prev = all[this._state.levelId] || {};
      all[this._state.levelId] = {
        cleared: true,
        time: this._state.clearedAt,
        attempts: (prev.attempts || 0) + 1,
        steps: queueMod.totalSteps(this._state)
      };
      wx.setStorageSync('wanwan_progress', all);
    } catch (e) {
      console.error('[game] 进度写入失败', e);
    }

    // 1. 触发庆祝特效:CSS 火花层 + Canvas 婉婉跳起撒花
    this.setData({ showCelebration: true });
    this._runCelebrationAnimation(800);

    // 震动反馈(短促一下)
    try { wx.vibrateShort({ type: 'medium' }); } catch (e) {}

    // 2. 800ms 后特效消失,弹出通关结果卡
    setTimeout(() => {
      this.setData({
        showCelebration: false,
        phase: 'cleared'
      });
      this._showCurrentDialog();
    }, 800);
  },

  // =========================================================================
  // 返回
  // =========================================================================

  onBack() {
    wx.navigateBack();
  }
});
