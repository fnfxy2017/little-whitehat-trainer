// engine/queue.js · 命令队列操作

function pushCommand(state, command) {
  state.queue.push(command);
}

function removeCommand(state, index) {
  state.queue.splice(index, 1);
}

function clearQueue(state) {
  state.queue = [];
}

function totalSteps(state) {
  return state.queue.reduce((sum, c) => sum + (c.steps || 1), 0);
}

module.exports = { pushCommand, removeCommand, clearQueue, totalSteps };
