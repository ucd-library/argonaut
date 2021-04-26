import {uuid} from 'uuid';
import {clone} from 'clone';

class MessageUtils {

  constructor() {
    this.MESSAGE_TYPE = ['execute', 'conditional']
  }

  /**
   * @method createExecute
   * @description create an execute message
   * 
   * @param {String} stepId
   * @param {Object} opts
   * @param {String} opts.treeId graph tree id
   * @param {Object} opts.steps prior step responses 
   * @param {String} opts.type message type
   * @param {Object} opts.tree 
   * @param {String} opts.tree.id current graph tree id
   * @param {Boolean} opts.tree.root is this the tree root
   * @param {Object} opts.steps prior steps object
   * @param {Object} opts.command
   * @param {Object} opts.metadata
   * @param {Object} config
   */
  createExecute(stepId, opts, config={}) {
    if( !stepId ) throw new Error('stepId required');
    if( !opts.type ) throw new Error('message type required');
    if( !this.MESSAGE_TYPE.includes(opts.type) ) {
      throw new Error('Invalid message type: '+opts.type+'.  Allowed: '+this.MESSAGE_TYPE.join(', '))
    }

    const msg = {
      id : uuid.v4(),
      stepId,
      type : opts.type,
      tree : {
        id : (opts.tree && opts.tree.id) ? opts.tree.id : uuid.v4(),
        root : (opts.tree && opts.tree.root) ? opts.tree.root : ''
      },
      topic : opts.topic,
      timestamp : Date.now(),
      steps : clone(opts.steps || {}),
      command : opts.command,
      metadata : clone(opts.metadata || {}),
      config
    }

    return msg;
  }

  /**
   * @method createResponse
   * @description 
   * 
   * @param {Object} msg 
   * @param {Object} msg.tree
   * @param {String} msg.type
   * @param {String} msg.stepId
   * @param {Object} msg.metadata
   * @param {Object} msg.steps
   * @param {Object} opts
   * @param {Object} opts.response
   * @param {Object} opts.rawResponse
   * @returns 
   */
  createResponse(msg, opts={}) {
    if( msg.type === 'execute' ) {
      if( typeof opts.response === 'string' ) {
        opts.response = JSON.parse(opts.response);
      }
      if( !msg.steps ) msg.steps = {};
      msg.steps[opts.stepId] = opts.response;
    } else if( msg.type === 'conditional' ) {
      opts.rawResponse = opts.response;
      opts.response = (opts.response || '').trim().toLowerCase().match(/^(true|t)$/) ? true : false
    }

    const msg = {
      id : uuid.v4(),
      tree : {
        id :  msg.tree.id,
        root : msg.tree.root
      },
      execute : {
        id : msg.stepId,
        metadata : clone(msg.metadata),
        command : clone(msg.command),
        topic : msg.topic
      },
      timestamp : Date.now(),
      type : msg.type,
      steps : clone(msg.steps),
      response : opts.response,
      rawResponse : opts.rawResponse
    }

    return msg;
  }

}

const messageUtils = new MessageUtils();

export {messageUtils};