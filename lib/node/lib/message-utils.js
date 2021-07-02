import * as uuid from 'uuid';
import clone from 'clone';

class MessageUtils {

  constructor() {
    this.MESSAGE_TYPE = ['execute', 'conditional']
  }

  /**
   * @method createExecute
   * @description create an execute message
   * 
   * @param {Object} opts
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
  createExecute(opts, config={}) {
    if( !stepId ) throw new Error('stepId required');
    if( !opts.type ) throw new Error('message type required');
    if( !this.MESSAGE_TYPE.includes(opts.type) ) {
      throw new Error('Invalid message type: '+opts.type+'.  Allowed: '+this.MESSAGE_TYPE.join(', '))
    }

    const msg = {
      // basic message stuff
      id : uuid.v4(),
      timestamp : Date.now(),
      type : opts.type,

      // graph information
      node : {
        id : (opts.node || {}).id || uuid.v4(),
        name : (opts.node || {}).name,
      },
      graphId : opts.graphId || uuid.v4(),
      parentNodeId : opts.parentNodeId || null,

      // step/operation information
      step : {
        name : opts.step.id,
        operation : opts.step.operation,
        // command to run
        cmd : opts.cmd,
      },
      // prior step data
      steps : clone(opts.steps || {}),
      
      // topic to send message on
      topic : opts.topic,

      // additional metadata and config information
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
  createResponse(msg={}, opts={}) {
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

    msg = {
      id : uuid.v4(),
      timestamp : Date.now(),
      type : msg.type,
      response : true,
      
      // graph information
      node : {
        id : msg.nodeId || uuid.v4(),
        name : msg.stepId,
      },
      graphId : msg.graphId || uuid.v4(),
      parentNodeId : msg.parentNodeId || null,
      executeMessageId : msg.id,

      execute : {
        topic : msg.topic
      },

      response : opts.response,
      rawResponse : opts.rawResponse,

      steps : clone(msg.steps),
      metadata : clone(msg.metadata),
      config : clone(msg.config),
    }

    return msg;
  }

  createRootMessage(stepId, data) {
    return this.createResponse(
      {
        type: 'root',
        stepId
      },
      {response: data}
    )
  }

}

const messageUtils = new MessageUtils();

export default messageUtils;