const dot = require('dot-object');
const clone = require('clone');

const ARRAY_TYPES = ['filter'];
const JOIN_CHARS = {
  key : '-'
}

/**
 * @function templateSubstitution
 * @description given a msg object and a variable template,
 * replace all dot.path variables. If the value is array
 * it will be joined first.
 * 
 * @param {Object} msg cloud message
 * @param {String|Array} value template value
 *  
 * @returns {String}
 */
module.exports = (msg, step) => {
  return walk(msg, clone(step));
}

function walk(msg, step, preKey) {
  if( typeof step !== 'object' ) {
    return replace(msg, step, preKey);
  }

  for( let key in step ) {
    let value = step[key];

    // handle arrays
    if( Array.isArray(value) ) {
      if( ARRAY_TYPES.includes(key) ) {
        for( let i = 0; i < value.length; i++ ) {
          value[i] = walk(msg, value[i], key);
        }
      } else {
        step[key] = replace(msg, value, key);
      }
      continue;
    }

    // handle objects
    if( typeof value === 'object' ) {
      step[key] = walk(msg, value, key); 
    }

    // it's a value, replace
    step[key] = replace(msg, value, key); 
  }

  return step;
}

function replace(msg, value, key) {
  if( Array.isArray(value) ) {
    value = value.join(JOIN_CHARS[key] ? JOIN_CHARS[key] : '');
  }
  if( typeof value !== 'string' ) {
    value = value+'';
  }

  let parts = value.match(/({{[\.a-z0-9_-]*}})/ig);
  for( let part of parts ) {
    let dotVar = value.replace(/^{{/, '').replace(/}}$/, '');
    dotVar = dot.pick(dotVar, msg);
    if( typeof dotVar !== 'number' ) {
      dotVar = JSON.stringify(dotVar);
    }

    value = value.replace(part, dotVar);
  }

  return value;
}