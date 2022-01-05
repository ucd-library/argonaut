import jsonTemplates from "json-templates";

const cache = {};

/**
 * @function render
 * @description render the string template from message data
 * 
 * @param {String} taskId
 * @param {String} strTemplate 
 * @param {Object} data 
 * @returns {String}
 */
function render(taskId, strTemplate, data) {
  if( !cache[strTemplate] ) {
    cache[strTemplate] = jsonTemplates(strTemplate);
  }

  return taskId+'-'+cache[strTemplate](data);
}

export {render}