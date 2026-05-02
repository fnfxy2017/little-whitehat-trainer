// components/npc-sprite/npc-sprite.js
// 标准 NPC 造型 — 严格按 SKILL aiGame/_STYLE_GUIDE.prompt.txt 实现

Component({
  options: { multipleSlots: false },

  properties: {
    size: { type: Number, value: 60 },
    mainColor: { type: String, value: '#9B59B6' },
    bodyColor: { type: String, value: '' },     // 留空则与 mainColor 相同
    accentColor: { type: String, value: '' },   // 装饰色,留空则与 mainColor 相同
    decoration: { type: String, value: 'bald' }, // 头顶装饰类型
    mood: { type: String, value: 'chill' },     // chill / smile / o
    showBlush: { type: Boolean, value: false }
  }
});
