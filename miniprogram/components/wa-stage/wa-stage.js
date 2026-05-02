// components/wa-stage/wa-stage.js
// 婉婉舞台 Component · 方案 A:DOM + transform 动画
// 管理:玩家位置、网格碰撞、execute(card) 走一步、isComplete()

const npcCatalog = require('../../utils/npc-catalog.js');

const FURNITURE_ICONS = {
  bed: '🛏', desk: '🗒', tv: '📺', window: '⊞', lamp: '💡',
  plant: '🌿', table: '🟦', stove: '🍳', other: '·'
};

const ITEM_ICONS = {
  breakfast: '🍳', letter: '✉', key: '🔑', book: '📖',
  card: '🪪', item: '🎁'
};

// 货架/物件 sprite → 中文名 + emoji
const SHELF_LABELS = {
  milk: '牛奶', ice_cream: '冰淇淋',
  bread: '面包', apple: '苹果', juice: '果汁', cookie: '饼干',
  book: '书', shelf: '货架',
  // 场景物件
  blocked_door: '门', info_stone: '石碑', safe_box: '保险箱',
  mirror: '镜子', mailbox: '邮箱', gift_box: '礼物',
  button: '按钮', virus_tile: '病毒', deploy_button: '部署',
  fake_check_door: '检查门', color_gate: '色门', timed_gate: '定时门',
  loop_npc: '循环者', reply_guard: '守门员'
};
const SHELF_EMOJI = {
  milk: '🥛', ice_cream: '🍦',
  bread: '🍞', apple: '🍎', juice: '🧃', cookie: '🍪',
  book: '📚', shelf: '📦',
  blocked_door: '🚪', info_stone: '🪨', safe_box: '🔒',
  mirror: '🪞', mailbox: '📮', gift_box: '🎁',
  button: '🔘', virus_tile: '☠', deploy_button: '🚀',
  fake_check_door: '⚠', color_gate: '🚧', timed_gate: '⏱',
  loop_npc: '🔁', reply_guard: '🛡'
};

Component({
  options: { multipleSlots: false },

  properties: {
    levelData: { type: Object, value: null }
  },

  data: {
    // 渲染相关
    cellSize: 60,
    stageW: 600,
    stageH: 480,

    // 静态布局
    walkables: [],
    walls: [],
    decoratives: [],
    furniture: [],
    npcs: [],

    // 动态
    playerX: 0,
    playerY: 0,
    stepDuration: 280,
    heldItemIcon: '',
    heldItemSprite: '',
    groundItems: [],
    colorables: [],
    flowers: [],
    shelves: [],     // C1 等:[{ id, sprite, x, y, trap }]
    goal: null,
    takingItem: null,
    wateringEffect: null,

    celebrating: false
  },

  observers: {
    'levelData': function (level) {
      if (level) this._setupLevel(level);
    }
  },

  lifetimes: {
    attached() {
      this._initSize();
    }
  },

  methods: {
    /**
     * 计算 cellSize 和 stage 尺寸
     */
    _initSize() {
      const sys = wx.getSystemInfoSync();
      const screenW = sys.screenWidth;
      // 舞台占屏宽 88%(留 6% padding 两边)
      const maxStageW = Math.floor(screenW * 0.88);
      // 舞台高度不超过屏高 50%
      const screenH = sys.windowHeight || sys.screenHeight;
      const maxStageH = Math.floor(screenH * 0.50);

      const lv = this.properties.levelData;
      if (!lv || !lv.map) return;

      const size = lv.map.size;
      const gridW = size[0];
      const gridH = size[1];
      const cellByW = Math.floor(maxStageW / gridW);
      const cellByH = Math.floor(maxStageH / gridH);
      const cellSize = Math.min(cellByW, cellByH);
      const stageW = cellSize * gridW;
      const stageH = cellSize * gridH;

      this.setData({ cellSize, stageW, stageH });
    },

    /**
     * 根据 levelData 初始化所有渲染数据
     */
    _setupLevel(level) {
      this._initSize();

      const size = level.map.size;
      const gridW = size[0];
      const gridH = size[1];
      const walls = (level.map.walls || []).map((w, i) => {
        const stripeCount = Math.max(1, Math.floor((w.h * this.data.cellSize) / 24));
        return {
          key: 'wall-' + i,
          x: w.x, y: w.y, w: w.w, h: w.h,
          stripeCount: Array(stripeCount).fill(0)
        };
      });

      // 计算可走格(墙之外的所有格,家具默认不挡路)
      const wallSet = new Set();
      for (const w of level.map.walls || []) {
        for (let yy = w.y; yy < w.y + w.h; yy++) {
          for (let xx = w.x; xx < w.x + w.w; xx++) {
            wallSet.add(xx + ',' + yy);
          }
        }
      }
      const walkables = [];
      for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
          if (wallSet.has(x + ',' + y)) continue;
          walkables.push({ key: 'fl-' + x + '-' + y, x, y });
        }
      }

      const decoratives = [];
      const furniture = [];
      (level.map.objects || []).forEach((obj, i) => {
        const ox = obj.pos[0];
        const oy = obj.pos[1];
        const sz = obj.size || [1, 1];
        const ow = sz[0];
        const oh = sz[1];
        const item = {
          key: 'obj-' + i,
          type: obj.type,
          x: ox, y: oy, w: ow, h: oh,
          icon: FURNITURE_ICONS[obj.type] || FURNITURE_ICONS.other
        };
        if (obj.decorative) decoratives.push(item);
        else furniture.push(item);
      });

      const npcs = (level.npcs || []).map(function (n) {
        return {
          id: n.id, type: n.type,
          x: n.x, y: n.y,
          profile: npcCatalog.getNpcProfile(n.type)
        };
      });

      // 物品:运行时把 items 拆成"地上 items" + 婉婉手持
      const groundItems = [];
      this._items = {};
      for (const id of Object.keys(level.items || {})) {
        const it = level.items[id];
        this._items[id] = {
          id, x: it.x, y: it.y, sprite: it.sprite, heldBy: null,
          type: it.type || 'item',
          credentialType: it.credentialType || null
        };
        groundItems.push({
          id,
          x: it.x, y: it.y,
          sprite: it.sprite,
          type: it.type || 'item',
          credentialType: it.credentialType || null,
          icon: ITEM_ICONS[it.sprite] || ITEM_ICONS.item
        });
      }

      // 信号灯
      const colorables = [];
      this._colorables = {};
      for (const id of Object.keys(level.colorables || {})) {
        const c = level.colorables[id];
        this._colorables[id] = {
          id: id, x: c.x, y: c.y,
          required: c.required, sequence: []
        };
        colorables.push({
          id: id, x: c.x, y: c.y,
          litRed: false, litYellow: false, litGreen: false
        });
      }

      // 花朵 (T5)
      const flowers = [];
      this._flowers = {};
      for (const id of Object.keys(level.targets || {})) {
        const t = level.targets[id];
        if (t.type !== 'flower') continue;
        this._flowers[id] = {
          id: id, x: t.x, y: t.y, watered: !!t.watered
        };
        flowers.push({
          id: id, x: t.x, y: t.y, watered: !!t.watered
        });
      }

      // 货架 (C1 等)
      const shelves = [];
      this._shelves = {};
      for (const id of Object.keys(level.shelves || {})) {
        const s = level.shelves[id];
        this._shelves[id] = {
          id: id, x: s.x, y: s.y, sprite: s.sprite, trap: !!s.trap
        };
        shelves.push({
          id: id, x: s.x, y: s.y,
          sprite: s.sprite,
          trap: !!s.trap,
          label: SHELF_LABELS[s.sprite] || s.sprite,
          emoji: SHELF_EMOJI[s.sprite] || '📦'
        });
      }

      // 目标
      let goal = null;
      if (level.goal) {
        let kind = 'zone';
        let icon = '🚪';
        if (level.goal.type === 'door') { kind = 'door'; icon = '🚪'; }
        else if (level.goal.type === 'goal_zone') { kind = 'zone'; icon = '✦'; }
        else if (level.goal.type === 'credential_door') { kind = 'cred-door'; icon = '🔒'; }
        else if (level.goal.type === 'traffic_light') { kind = null; }
        if (kind) {
          goal = {
            kind, icon,
            x: level.goal.x, y: level.goal.y,
            requiresCredential: level.goal.requiresCredential || null,
            unlocked: false
          };
        }
      }

      this._gridW = gridW;
      this._gridH = gridH;
      this._wallSet = wallSet;

      this.setData({
        walls: walls,
        walkables: walkables,
        decoratives: decoratives,
        furniture: furniture,
        npcs: npcs,
        playerX: level.player.startX,
        playerY: level.player.startY,
        groundItems: groundItems,
        colorables: colorables,
        flowers: flowers,
        shelves: shelves,
        goal: goal,
        heldItemIcon: '',
        heldItemSprite: '',
        wateringEffect: null,
        celebrating: false
      });

      this._holding = null;
      this._purchased = {};
      this._stepCount = 0;
    },

    /**
     * 检查格子是否可走
     * - 墙永远阻挡
     * - 家具默认可走
     * - credential_door:未解锁时阻挡(没拿对应凭证),解锁后通过
     */
    _isWalkable(x, y) {
      if (x < 0 || y < 0 || x >= this._gridW || y >= this._gridH) return false;
      if (this._wallSet.has(x + ',' + y)) return false;
      // 凭证门检查
      const goal = this.data.goal;
      if (goal && goal.kind === 'cred-door' && goal.x === x && goal.y === y) {
        return !!goal.unlocked;
      }
      return true;
    },

    /**
     * 找玩家附近(同格 + 4 邻)的可拾取物品 id
     */
    _findItemNearPlayer() {
      const px = this.data.playerX, py = this.data.playerY;
      const cands = [[px, py], [px+1, py], [px-1, py], [px, py+1], [px, py-1]];
      for (let i = 0; i < cands.length; i++) {
        const x = cands[i][0];
        const y = cands[i][1];
        const ids = Object.keys(this._items);
        for (let j = 0; j < ids.length; j++) {
          const it = this._items[ids[j]];
          if (it.heldBy) continue;
          if (it.x === x && it.y === y) return ids[j];
        }
      }
      return null;
    },

    /**
     * 找玩家附近的可染色实体
     */
    _findColorableNearPlayer() {
      const px = this.data.playerX, py = this.data.playerY;
      const cands = [[px, py], [px+1, py], [px-1, py], [px, py+1], [px, py-1]];
      for (let i = 0; i < cands.length; i++) {
        const x = cands[i][0];
        const y = cands[i][1];
        const ids = Object.keys(this._colorables);
        for (let j = 0; j < ids.length; j++) {
          const c = this._colorables[ids[j]];
          if (c.x === x && c.y === y) return ids[j];
        }
      }
      return null;
    },

    /**
     * 执行一张卡片的一步 — 由父级在 runQueue 时调用
     * 返回 Promise,动画结束后 resolve
     */
    execute(card, stepsOverride) {
      const self = this;
      return new Promise(function (resolve) {
        const action = card.action;
        if (action === 'move') {
          const steps = stepsOverride || card.steps || 1;
          self._executeMove(card.dir, steps, resolve);
          return;
        }
        if (action === 'pickup') {
          self._executePickup();
          setTimeout(resolve, 200);
          return;
        }
        if (action === 'drop') {
          self._executeDrop();
          setTimeout(resolve, 200);
          return;
        }
        if (action === 'set_color') {
          self._executeSetColor(card.color);
          setTimeout(resolve, 280);
          return;
        }
        if (action === 'take_credential') {
          self._executeTakeCredential(resolve);
          return;
        }
        if (action === 'water') {
          self._executeWater(resolve);
          return;
        }
        if (action === 'buy') {
          self._executeBuy(card.item || card.sprite, resolve);
          return;
        }
        console.warn('[wa-stage] 未支持的 action:', action);
        resolve();
      });
    },

    _executeMove(dir, steps, resolve) {
      const DIR_VEC = { up:{dx:0,dy:-1}, down:{dx:0,dy:1}, left:{dx:-1,dy:0}, right:{dx:1,dy:0} };
      const v = DIR_VEC[dir];
      if (!v) { resolve(); return; }
      let i = 0;
      const stepOne = () => {
        if (i >= steps) { resolve(); return; }
        const nx = this.data.playerX + v.dx;
        const ny = this.data.playerY + v.dy;
        if (!this._isWalkable(nx, ny)) {
          // 撞墙:不动,继续下一步
          i++;
          setTimeout(stepOne, 80);
          return;
        }
        // 移动到新位置
        const updates = { playerX: nx, playerY: ny };
        // 手持物品跟着走
        if (this._holding) {
          this._items[this._holding].x = nx;
          this._items[this._holding].y = ny;
        }
        this.setData(updates);
        i++;
        this._stepCount++;
        setTimeout(stepOne, this.data.stepDuration);
      };
      stepOne();
    },

    _executePickup() {
      if (this._holding) return;
      const id = this._findItemNearPlayer();
      if (!id) return;
      this._items[id].heldBy = 'player';
      this._items[id].x = this.data.playerX;
      this._items[id].y = this.data.playerY;
      this._holding = id;
      const item = this._items[id];
      const groundItems = this.data.groundItems.filter(function (g) { return g.id !== id; });
      this.setData({
        groundItems: groundItems,
        heldItemIcon: ITEM_ICONS[item.sprite] || ITEM_ICONS.item,
        heldItemSprite: item.sprite || ''
      });
    },

    _executeDrop() {
      if (!this._holding) return;
      const id = this._holding;
      const it = this._items[id];
      it.heldBy = null;
      it.x = this.data.playerX;
      it.y = this.data.playerY;
      const groundItems = this.data.groundItems.concat([{
        id: id, x: it.x, y: it.y,
        sprite: it.sprite,
        type: it.type || 'item',
        credentialType: it.credentialType || null,
        icon: ITEM_ICONS[it.sprite] || ITEM_ICONS.item
      }]);
      this._holding = null;
      this.setData({
        groundItems: groundItems,
        heldItemIcon: '',
        heldItemSprite: ''
      });
    },

    /**
     * 取凭证 · 找附近 type=credential 的物品 → 飞行动画 → 拿在手里
     * 飞行动画通过 takingItem 字段驱动 CSS 动画(物品从原位置缩放飞到婉婉手上)
     */
    _executeTakeCredential(resolve) {
      const self = this;
      // 找附近的 credential 物品
      const px = this.data.playerX, py = this.data.playerY;
      const cands = [[px, py], [px+1, py], [px-1, py], [px, py+1], [px, py-1]];
      let id = null;
      for (let i = 0; i < cands.length; i++) {
        const cx = cands[i][0], cy = cands[i][1];
        const ids = Object.keys(this._items);
        for (let j = 0; j < ids.length; j++) {
          const it = this._items[ids[j]];
          if (it.heldBy) continue;
          if (it.type !== 'credential') continue;
          if (it.x === cx && it.y === cy) { id = ids[j]; break; }
        }
        if (id) break;
      }
      if (!id) {
        // 附近没卡,空转
        wx.vibrateShort && wx.vibrateShort({ type: 'light' });
        setTimeout(resolve, 200);
        return;
      }

      const item = this._items[id];
      // 触发飞行动画:把物品标记为 taking,渲染层 CSS 飞向婉婉
      this.setData({
        takingItem: {
          id: id,
          fromX: item.x,
          fromY: item.y,
          toX: this.data.playerX,
          toY: this.data.playerY,
          sprite: item.sprite || '',
          icon: ITEM_ICONS[item.sprite] || ITEM_ICONS.item
        }
      });
      // 同时从地面物品列表里移除(此时飞行物在 takingItem 里独立渲染)
      const groundItems = this.data.groundItems.filter(function (g) { return g.id !== id; });
      this.setData({ groundItems: groundItems });

      // 600ms 飞行 + 反馈动画结束后,标记 holding
      setTimeout(function () {
        item.heldBy = 'player';
        item.x = self.data.playerX;
        item.y = self.data.playerY;
        self._holding = id;
        // 显示手持图标
        self.setData({
          heldItemIcon: ITEM_ICONS[item.sprite] || ITEM_ICONS.item,
          heldItemSprite: item.sprite || '',
          takingItem: null
        });
        // 凭证拿到后,如果地图上有 credential_door 且需求匹配,标记解锁
        const goal = self.data.goal;
        if (goal && goal.requiresCredential && goal.requiresCredential === item.credentialType) {
          self.setData({
            goal: Object.assign({}, goal, { unlocked: true })
          });
        }
        // 震动反馈
        wx.vibrateShort && wx.vibrateShort({ type: 'medium' });
        resolve();
      }, 600);
    },

    _executeSetColor(color) {
      const id = this._findColorableNearPlayer();
      if (!id) return;
      this._colorables[id].sequence.push(color);
      const colorables = this.data.colorables.map(function (c) {
        if (c.id !== id) return c;
        const seq = this._colorables[id].sequence;
        return Object.assign({}, c, {
          litRed: seq.indexOf('red') >= 0,
          litYellow: seq.indexOf('yellow') >= 0,
          litGreen: seq.indexOf('green') >= 0
        });
      }.bind(this));
      this.setData({ colorables: colorables });
    },

    /**
     * 浇水 · 找附近(同格 + 4 邻)未浇过的花,标记浇水 + 短动画
     */
    _executeWater(resolve) {
      const self = this;
      const px = this.data.playerX, py = this.data.playerY;
      const cands = [[px, py], [px+1, py], [px-1, py], [px, py+1], [px, py-1]];
      let id = null;
      for (let i = 0; i < cands.length; i++) {
        const cx = cands[i][0], cy = cands[i][1];
        const ids = Object.keys(this._flowers);
        for (let j = 0; j < ids.length; j++) {
          const f = this._flowers[ids[j]];
          if (f.watered) continue;
          if (f.x === cx && f.y === cy) { id = ids[j]; break; }
        }
        if (id) break;
      }
      if (!id) {
        // 附近没花或花都浇过了 — 空转
        wx.vibrateShort && wx.vibrateShort({ type: 'light' });
        setTimeout(resolve, 200);
        return;
      }

      // 触发水滴动画(花的位置)
      const f = this._flowers[id];
      this.setData({
        wateringEffect: { x: f.x, y: f.y, key: 'w-' + Date.now() }
      });

      // 350ms 后:标记 watered + 更新视觉,清除水滴
      setTimeout(function () {
        self._flowers[id].watered = true;
        const flowers = self.data.flowers.map(function (fl) {
          if (fl.id !== id) return fl;
          return Object.assign({}, fl, { watered: true });
        });
        self.setData({ flowers: flowers, wateringEffect: null });
        wx.vibrateShort && wx.vibrateShort({ type: 'light' });
        resolve();
      }, 350);
    },

    /**
     * 购买 · C1 用 · 找匹配 sprite 的货架,标记为已购买,记录到 _purchased
     * 不改变玩家位置;视觉上货架做一次"高亮闪烁"
     */
    _executeBuy(itemSprite, resolve) {
      const self = this;
      if (!this._purchased) this._purchased = {};

      // 找匹配的 shelf
      let shelfId = null;
      const ids = Object.keys(this._shelves || {});
      for (let i = 0; i < ids.length; i++) {
        const s = this._shelves[ids[i]];
        if (s.sprite === itemSprite) { shelfId = ids[i]; break; }
      }
      if (!shelfId) {
        // 找不到对应商品,空转
        wx.vibrateShort && wx.vibrateShort({ type: 'light' });
        setTimeout(resolve, 200);
        return;
      }

      // 标记购买 + 高亮该货架
      this._purchased[itemSprite] = true;
      const shelves = this.data.shelves.map(function (sh) {
        if (sh.id !== shelfId) return sh;
        return Object.assign({}, sh, { purchased: true });
      });
      this.setData({ shelves: shelves });
      wx.vibrateShort && wx.vibrateShort({ type: 'medium' });

      // 400ms 后回调(给视觉一点停留)
      setTimeout(resolve, 400);
    },

    /**
     * 父级调用,检查通关条件
     */
    isComplete() {
      const lv = this.properties.levelData;
      const cond = lv.successCondition || { type: 'reach_goal' };

      if (cond.type === 'reach_goal') {
        if (!lv.goal) return false;
        return this.data.playerX === lv.goal.x && this.data.playerY === lv.goal.y;
      }

      if (cond.type === 'reach_credential_door') {
        // 玩家到达 credential_door 位置且门已解锁
        if (!lv.goal) return false;
        const atDoor = this.data.playerX === lv.goal.x && this.data.playerY === lv.goal.y;
        return atDoor && this.data.goal && this.data.goal.unlocked;
      }
      if (cond.type === 'item_at_goal') {
        const item = this._items[cond.item_id];
        if (!item || item.heldBy) return false;
        if (!lv.goal) return false;
        return item.x === lv.goal.x && item.y === lv.goal.y;
      }
      if (cond.type === 'color_sequence_matches') {
        const c = this._colorables[cond.entity_id];
        if (!c) return false;
        const r = c.required, s = c.sequence;
        if (r.length !== s.length) return false;
        for (let i = 0; i < r.length; i++) if (r[i] !== s[i]) return false;
        return true;
      }

      if (cond.type === 'all_watered') {
        const ids = cond.entity_ids || Object.keys(this._flowers);
        for (let i = 0; i < ids.length; i++) {
          const f = this._flowers[ids[i]];
          if (!f || !f.watered) return false;
        }
        return true;
      }

      if (cond.type === 'execute_safe_queue') {
        // C1 等:玩家须到达 reach_goal_id 位置 + 没买恶意商品
        if (!lv.goal) return false;
        if (this.data.playerX !== lv.goal.x || this.data.playerY !== lv.goal.y) return false;
        const mustRemove = cond.must_remove_actions || [];
        const purchased = this._purchased || {};
        for (let i = 0; i < mustRemove.length; i++) {
          const act = mustRemove[i];
          // 形如 'buy:ice_cream' → 拆出 item 名
          if (act.indexOf('buy:') === 0) {
            const item = act.slice(4);
            if (purchased[item]) return false;
          }
        }
        return true;
      }

      return false;
    },

    /**
     * 触发通关庆祝动画(800ms)
     */
    celebrate() {
      this.setData({ celebrating: true });
      setTimeout(() => {
        this.setData({ celebrating: false });
      }, 800);
    },

    /**
     * 重置回起点
     */
    reset() {
      this._setupLevel(this.properties.levelData);
    },

    getStepCount() {
      return this._stepCount;
    }
  }
});
