/**
 * @function render
 * @description render the string template from message data
 * 
 * @param {String} taskId
 * @param {Function} strTemplate 
 * @param {Object} msg 
 * @returns {String}
 */
function render(taskId, strTemplate, msg) {
  return taskId+'-'+strTemplate(msg);
}

export {render}