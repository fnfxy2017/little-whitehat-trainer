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
    shelves: [],
    goal: null,
    takingItem: null,
    wateringEffect: null,
    guardBubble: null,  // C4:守卫拦截/放行气泡 { id, x, y, text, key }

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
      const self = this;
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

      // NPCs + 守卫(C4 等)
      this._guards = {};  // id → { x, y, asidePos, acceptPersona, asided }
      const npcs = (level.npcs || []).map(function (n) {
        const isGuard = n.role === 'guard';
        if (isGuard) {
          self._guards[n.id] = {
            id: n.id,
            x: n.x, y: n.y,
            asidePos: n.asidePos,
            acceptPersona: n.acceptPersona,
            blockMessage: n.blockMessage,
            asided: false
          };
        }
        return {
          id: n.id, type: n.type,
          x: n.x, y: n.y,
          role: n.role,
          isGuard: isGuard,
          asided: false,
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

      // 货架 (C1 等)+ 镜子视野(C3)
      const shelves = [];
      this._shelves = {};
      this._mirrors = {};  // C3:{ id: { x, y, broken, watchTiles: [[x,y],...] } }
      for (const id of Object.keys(level.shelves || {})) {
        const s = level.shelves[id];
        this._shelves[id] = {
          id: id, x: s.x, y: s.y, sprite: s.sprite, trap: !!s.trap,
          propType: s.propType || s.sprite
        };
        shelves.push({
          id: id, x: s.x, y: s.y,
          sprite: s.sprite,
          trap: !!s.trap,
          label: SHELF_LABELS[s.sprite] || s.sprite,
          emoji: SHELF_EMOJI[s.sprite] || '📦',
          broken: false
        });
        // 镜子的视野:左右各 1 格 + 正前方 1 格(假设朝上,即 y-1)
        // 这样直走 (5,3) 在视野内,绕到 (5,5) 在视野外
        if (s.propType === 'mirror' || s.sprite === 'mirror') {
          this._mirrors[id] = {
            id: id, x: s.x, y: s.y, broken: false,
            watchTiles: [
              [s.x, s.y],         // 镜子位置本身
              [s.x - 1, s.y],     // 左边一格
              [s.x + 1, s.y],     // 右边一格
              [s.x, s.y - 1]      // 正前方一格(假设朝上)
            ]
          };
        }
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
        guardBubble: null,
        celebrating: false
      });

      this._holding = null;
      this._purchased = {};
      this._eavesdroppedBy = null;  // C3:被哪面镜子监听了(mirror id),null 表示未被监听
      this._stepCount = 0;
    },

    /**
     * 检查格子是否可走
     * - 墙永远阻挡
     * - 家具默认可走
     * - credential_door:未解锁时阻挡
     * - 守卫(role=guard):未让开时阻挡
     */
    _isWalkable(x, y) {
      if (x < 0 || y < 0 || x >= this._gridW || y >= this._gridH) return false;
      if (this._wallSet.has(x + ',' + y)) return false;
      const goal = this.data.goal;
      if (goal && goal.kind === 'cred-door' && goal.x === x && goal.y === y) {
        return !!goal.unlocked;
      }
      // 守卫拦截 — 没让开就挡路
      const gids = Object.keys(this._guards || {});
      for (let i = 0; i < gids.length; i++) {
        const g = this._guards[gids[i]];
        if (g.asided) continue;
        if (g.x === x && g.y === y) return false;
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
        if (action === 'break_mirror') {
          self._executeBreakMirror(resolve);
          return;
        }
        if (action === 'social_engineer') {
          self._executeSocialEngineer(card.persona, resolve);
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
      const self = this;
      let i = 0;
      const stepOne = function () {
        if (i >= steps) { resolve(); return; }
        const nx = self.data.playerX + v.dx;
        const ny = self.data.playerY + v.dy;
        if (!self._isWalkable(nx, ny)) {
          // 撞到守卫:显示拦截气泡
          self._showGuardBlockIfAny(nx, ny);
          i++;
          setTimeout(stepOne, 80);
          return;
        }
        const updates = { playerX: nx, playerY: ny };
        if (self._holding) {
          self._items[self._holding].x = nx;
          self._items[self._holding].y = ny;
        }
        self.setData(updates);
        i++;
        self._stepCount++;

        // 检查镜子视野(C3 中间人攻击)
        self._checkMirrorWatch(nx, ny);

        setTimeout(stepOne, self.data.stepDuration);
      };
      stepOne();
    },

    /**
     * 撞到目标格如果是未让开的守卫,弹他的拦截话
     */
    _showGuardBlockIfAny(tx, ty) {
      const gids = Object.keys(this._guards || {});
      for (let i = 0; i < gids.length; i++) {
        const g = this._guards[gids[i]];
        if (g.asided) continue;
        if (g.x === tx && g.y === ty) {
          // 找到拦截的守卫
          const msg = g.blockMessage || '站住!';
          this.setData({
            guardBubble: { id: g.id, x: g.x, y: g.y, text: msg, key: 'gb-' + Date.now() }
          });
          wx.vibrateShort && wx.vibrateShort({ type: 'medium' });
          // 1.5s 后清除气泡
          const self = this;
          if (this._guardBubbleTimer) clearTimeout(this._guardBubbleTimer);
          this._guardBubbleTimer = setTimeout(function () {
            self.setData({ guardBubble: null });
          }, 1500);
          return;
        }
      }
    },

    /**
     * 检查玩家当前位置是否进入未碎镜子的视野
     * 记录是哪面镜子监听的(便于打碎该镜子后撤销监听)
     */
    _checkMirrorWatch(px, py) {
      const ids = Object.keys(this._mirrors || {});
      for (let i = 0; i < ids.length; i++) {
        const m = this._mirrors[ids[i]];
        if (m.broken) continue;
        for (let j = 0; j < m.watchTiles.length; j++) {
          const t = m.watchTiles[j];
          if (t[0] === px && t[1] === py) {
            if (this._eavesdroppedBy !== m.id) {
              this._eavesdroppedBy = m.id;
              const shelves = this.data.shelves.map(function (sh) {
                if (sh.id !== m.id) return sh;
                return Object.assign({}, sh, { watching: true });
              });
              this.setData({ shelves: shelves });
              wx.vibrateShort && wx.vibrateShort({ type: 'heavy' });
            }
            return;
          }
        }
      }
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
     * 打碎镜子 · C3 用 · 找附近(同格 + 4 邻)的未碎镜子
     * 标记 broken,视野失效
     */
    _executeBreakMirror(resolve) {
      const self = this;
      const px = this.data.playerX, py = this.data.playerY;
      const cands = [[px, py], [px+1, py], [px-1, py], [px, py+1], [px, py-1]];
      let id = null;
      const ids = Object.keys(this._mirrors || {});
      for (let i = 0; i < cands.length && !id; i++) {
        const cx = cands[i][0], cy = cands[i][1];
        for (let j = 0; j < ids.length; j++) {
          const m = this._mirrors[ids[j]];
          if (m.broken) continue;
          if (m.x === cx && m.y === cy) { id = ids[j]; break; }
        }
      }
      if (!id) {
        // 附近没未碎镜子 — 空转
        wx.vibrateShort && wx.vibrateShort({ type: 'light' });
        setTimeout(resolve, 200);
        return;
      }

      this._mirrors[id].broken = true;
      // 如果当前被监听的就是这面镜子,撤销监听
      if (this._eavesdroppedBy === id) {
        this._eavesdroppedBy = null;
      }
      // 视觉:对应 shelf 项加 broken,停掉 watching
      const shelves = this.data.shelves.map(function (sh) {
        if (sh.id !== id) return sh;
        return Object.assign({}, sh, { broken: true, watching: false });
      });
      this.setData({ shelves: shelves });
      wx.vibrateShort && wx.vibrateShort({ type: 'heavy' });

      // 500ms 后回调,给一点视觉停留
      setTimeout(resolve, 500);
    },

    /**
     * 假扮某身份(C4 社会工程学)· 找附近未让开的守卫,
     * 如果 acceptPersona 匹配(或 null=接受任何身份)→ 守卫让开到 asidePos
     */
    _executeSocialEngineer(persona, resolve) {
      const self = this;
      const px = this.data.playerX, py = this.data.playerY;
      const cands = [[px, py], [px+1, py], [px-1, py], [px, py+1], [px, py-1]];
      let id = null;
      const ids = Object.keys(this._guards || {});
      for (let i = 0; i < cands.length && !id; i++) {
        const cx = cands[i][0], cy = cands[i][1];
        for (let j = 0; j < ids.length; j++) {
          const g = this._guards[ids[j]];
          if (g.asided) continue;
          if (g.x === cx && g.y === cy) { id = ids[j]; break; }
        }
      }
      if (!id) {
        // 附近没未让开的守卫 — 空转
        wx.vibrateShort && wx.vibrateShort({ type: 'light' });
        setTimeout(resolve, 200);
        return;
      }

      const g = this._guards[id];
      // 检查 persona 是否匹配(C4 守卫 acceptPersona=null,接受任意身份)
      const accepts = !g.acceptPersona || g.acceptPersona === persona;
      if (!accepts) {
        // 不接受 → 守卫拒绝
        this.setData({
          guardBubble: { id: g.id, x: g.x, y: g.y, text: '我不认识!', key: 'gb-' + Date.now() }
        });
        wx.vibrateShort && wx.vibrateShort({ type: 'medium' });
        const stTimer = setTimeout(function () { self.setData({ guardBubble: null }); }, 1500);
        if (this._guardBubbleTimer) clearTimeout(this._guardBubbleTimer);
        this._guardBubbleTimer = stTimer;
        setTimeout(resolve, 600);
        return;
      }

      // 接受身份 → 守卫让开,显示放行气泡
      this.setData({
        guardBubble: { id: g.id, x: g.x, y: g.y, text: '是' + (persona || '') + '啊,请进', key: 'gb-' + Date.now() }
      });
      wx.vibrateShort && wx.vibrateShort({ type: 'medium' });

      // 600ms 后:守卫真正让开 + 1500ms 后清气泡
      setTimeout(function () {
        const aside = g.asidePos;
        if (aside) {
          self._guards[id].x = aside[0];
          self._guards[id].y = aside[1];
        }
        self._guards[id].asided = true;
        // 同步更新 data.npcs(渲染层位置 + asided 状态)
        const npcs = self.data.npcs.map(function (n) {
          if (n.id !== id) return n;
          return Object.assign({}, n,
            aside ? { x: aside[0], y: aside[1], asided: true } : { asided: true }
          );
        });
        self.setData({ npcs: npcs });
      }, 600);

      if (this._guardBubbleTimer) clearTimeout(this._guardBubbleTimer);
      this._guardBubbleTimer = setTimeout(function () { self.setData({ guardBubble: null }); }, 1500);
      setTimeout(resolve, 900);
    },

    /**
     * 父级调用,检查通关条件
     */
    isComplete() {
      const lv = this.properties.levelData;
      const cond = lv.successCondition || { type: 'reach_goal' };

      if (cond.type === 'reach_goal') {
        if (!lv.goal) return false;
        if (this.data.playerX !== lv.goal.x || this.data.playerY !== lv.goal.y) return false;
        // C3:被未打碎的镜子监听过则不算通关
        if (this._eavesdroppedBy) return false;
        return true;
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
