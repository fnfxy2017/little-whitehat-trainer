// engine/state.js · 关卡运行时状态
// 一关的完整状态:实体位置、命令队列、对话指针、提示等级、计时

function createState(levelData) {
  const player = levelData.entities.find(e => e.id === 'player');
  const goal = levelData.entities.find(e => e.goal);

  return {
    // 关卡静态信息
    level: levelData,
    levelId: levelData.id,

    // 玩家位置(可变)
    player: {
      x: player.start_pos[0],
      y: player.start_pos[1],
      facing: player.facing || 'down'
    },

    // 终点(只读)
    goal: goal ? { x: goal.pos[0], y: goal.pos[1], type: goal.type } : null,

    // 命令队列 [{ cardId, dir, steps, action }]
    queue: [],

    // 当前阶段:'intro_dialog' / 'playing' / 'executing' / 'cleared' / 'failed'
    phase: 'intro_dialog',

    // 对话指针(用于 intro / on_clear)
    dialogIndex: 0,
    dialogList: levelData.intro_dialog || [],

    // 提示状态
    hintLevel: 0,                    // 0 = 未点提示;1/2/3 = 已展开第几级
    hintLockUntil: Date.now() + 3 * 60 * 1000, // 3 分钟全局锁

    // 执行状态
    executionStep: 0,                // 当前执行到队列第几条
    executionAnim: null,             // 当前动画的中间帧数据

    // 通关后提示数据
    clearedAt: null
  };
}

module.exports = { createState };
