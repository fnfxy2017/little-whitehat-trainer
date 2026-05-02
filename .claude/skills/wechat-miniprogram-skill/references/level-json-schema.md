# 关卡 JSON Schema 与校验

> 本文回答：每个字段的含义、约束、示例，T 系列与 C 系列的差异。

## 完整字段定义

```typescript
interface Level {
  // === 元信息 ===
  level_id: string;          // 唯一 ID，如 "t1", "c1"
  series: "T" | "C";          // 教学 / 概念
  title: string;              // 显示名，如 "方向指令初体验"
  order: number;              // 在关卡列表中的顺序
  
  // === 介绍 ===
  intro_dialogs: Array<{
    speaker: "wa" | "system" | "captain";
    text: string;             // ≤ 20 字
  }>;
  
  // === 安全概念（C 系列必填） ===
  security_concept?: {
    name: string;             // 如 "指令注入"
    real_analogy: string;     // 现实类比，≤ 50 字
    defense_tip: string;      // 防御建议，≤ 50 字
  };
  
  // === 卡片库 ===
  cards: Array<{
    id: string;
    type: "direction" | "function" | "color" | "credential" | "logic";
    label: string;            // ≤ 6 字
    icon?: string;            // 图标路径
    max_use?: number;         // 数量上限，不填表示无限
    
    // 该卡片对舞台的影响（实现细节）
    effect: {
      // direction: { dx, dy } 或 { rotate }
      // function: { call: 'fn_a' }
      // color: { color: 'red' }
      // 等等
    };
  }>;
  
  // === 预设队列（C 系列专用） ===
  preset_queue?: Array<{
    card_id: string;
    locked?: boolean;         // 用户能否移动这一项
  }>;
  
  // === 卡片栏空时的引导（无 cards 的关卡需要） ===
  manual_tip?: string;        // ≤ 30 字
  
  // === 关卡舞台 ===
  stage: {
    grid: { cols: number; rows: number };
    wa_start: { x: number; y: number };
    target: { x: number; y: number };
    obstacles?: Array<{ x: number; y: number }>;
  };
  
  // === 通关条件 ===
  win_condition: {
    type: "reach_target" | "execute_all" | "match_pattern";
    // 具体参数视 type 而定
  };
}
```

## T 系列与 C 系列的对比

| 字段 | T 系列 | C 系列 |
|---|---|---|
| `cards` | 必填，> 0 | 可空（用 manual_tip 引导） |
| `preset_queue` | 不用 | 必填 |
| `security_concept` | 不用 | 必填 |
| `manual_tip` | 可选 | 推荐填 |
| `intro_dialogs` | 教学性 | 故事 + 概念引出 |

## 教学关卡支持引入旧概念

> 来自 H5 项目教训：T 系列「教 X 指令」的关卡可以**包含先前学过的指令作为辅助工具**，新概念是焦点，但不限制只用新概念。

例如 T3「颜色指令」的卡片库可以包含：
```json
{
  "cards": [
    { "id": "fwd", "type": "direction", "label": "前进" },     // T1 学过
    { "id": "left", "type": "direction", "label": "左转" },    // T1 学过
    { "id": "red", "type": "color", "label": "变红", "is_focus": true },     // T3 新学
    { "id": "blue", "type": "color", "label": "变蓝", "is_focus": true }
  ]
}
```

`is_focus: true` 字段（可选）可以用于关卡介绍时高亮新卡。

## 校验工具

```js
// utils/level-validator.js
const RULES = [
  {
    name: 'level_id 必填',
    check: l => !!l.level_id
  },
  {
    name: 'intro_dialogs 每条 ≤ 20 字',
    check: l => (l.intro_dialogs || []).every(d => d.text.length <= 20),
    detail: l => (l.intro_dialogs || []).filter(d => d.text.length > 20)
                                          .map(d => d.text)
  },
  {
    name: 'C 系列必须有 preset_queue',
    check: l => l.series !== 'C' || (l.preset_queue && l.preset_queue.length > 0)
  },
  {
    name: 'C 系列必须有 security_concept',
    check: l => l.series !== 'C' || !!l.security_concept
  },
  {
    name: 'cards 为空时必须有 manual_tip',
    check: l => l.cards.length > 0 || !!l.manual_tip
  },
  {
    name: 'preset_queue 中的 card_id 必须存在',
    check: l => !l.preset_queue || l.preset_queue.every(p => 
      l.cards.some(c => c.id === p.card_id) ||
      // C 系列允许 preset_queue 引用不在 cards 里的卡（用户无法重新生成）
      l.series === 'C'
    )
  },
];

export function validate(level) {
  const errors = [];
  for (const rule of RULES) {
    if (!rule.check(level)) {
      errors.push({
        rule: rule.name,
        detail: rule.detail ? rule.detail(level) : null
      });
    }
  }
  return errors;
}
```

## 加载策略

T 系列关卡数据**直接 require 进内存**（仅 5 个，体积小）：
```js
// data/levels/index.js
export const LEVELS = {
  t1: require('./t1.json'),
  t2: require('./t2.json'),
  t3: require('./t3.json'),
  t4: require('./t4.json'),
  t5: require('./t5.json'),
};
```

C 系列关卡走分包，按需加载：
```js
// 在 c1.json 所在的子包页面 onLoad 时加载
const level = require('./c1.json');
```

## manifest.json（关卡列表元信息）

为关卡选择菜单提供数据：

```json
{
  "series": [
    {
      "id": "T",
      "title": "教学训练",
      "color": "#4CAF50",
      "levels": ["t1", "t2", "t3", "t4", "t5"]
    },
    {
      "id": "C",
      "title": "安全概念",
      "color": "#FF5722",
      "levels": ["c1"]
    }
  ],
  "level_meta": {
    "t1": { "title": "方向指令", "icon": "/assets/t1.png", "unlocked": true },
    "t2": { "title": "功能指令", "icon": "/assets/t2.png", "unlocked": false },
    "c1": { "title": "指令注入", "icon": "/assets/c1.png", "unlocked": false }
  }
}
```

解锁状态可以读取本地缓存（wx.getStorage）覆盖默认值。
