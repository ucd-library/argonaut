import clone from 'clone';
import parseDuration from 'parse-duration';
import * as uuid from 'uuid';
import templateSubstitution from './template-substitution.js';
import A6tGraph from './graph.js';
// import RedisClient from './redis.js';
import config from './config.js';
import {logger} from '@ucd-lib/a6t-commons';
import pg from './state/postgres.js';

/**
 * @class DependencyController
 * @description runs the depends on loop
 */
class A6tDependencyController {

  constructor(graph, conditionalCallback) {
    this.graph = graph || new A6tGraph();
    this.conditionalReadyCallback = conditionalCallback;
    // this.redis = new RedisClient();
  }

  /**
   * @method ensureAndGetNode
   * @description 
   * 
   * @param {Object} msg cloud message 
   * @param {String} nodeName current step id
   * 
   * @return {Promise} 
   */
  async ensureAndGetNode(msg, nodeName) {
    let resp = await pg.ensureAndGetNode(msg.graph.id, nodeName);
    return {
      id : resp.node_id,
      graphId : resp.graph_id,
      name : resp.node_name
    }

    // let filterDef = null;
    // let filterDef = await this.getValue(msg.graph.id, msg.node.name);

    // if( !filterDef ) {
    //   // find the filter definition for this step
    //   filterDef = step.dependsOn.find(item => (item.id || item.name) === cstepName);

    //   // TODO: implement with PostGres
    //   if( filterDef.filter ) {
    //     if( !Array.isArray(filterDef.filter) ) {
    //       filterDef.filter = [filterDef.filter]
    //     };

    //     filterDef = templateSubstitution(msg, filterDef);
    //     await this.setValue(msg.runId, cstepId, filterDef);
        
    //     let key = redis.getKey('dependsOnOrgMsg', [msg.runId, cstepId, pstepId]);
    //     await redis.set(key, JSON.stringify(msg));
    //     await this.addStepKey(msg.runId, cstepId, key);

    //     await this.resetExpire(msg.runId, cstepId);
    //   }
    // }

    // return filterDef;
  }

  /**
   * @method checkConditionals
   * @description check conditional loops
   * 
   * @param {Object} msg cloud message
   * @param {Object} step step definition (step we are looking to run)
   * @param {String} pStepId previous step Id (step that already run)
   * @returns {Promise}
   */
  async checkConditionals(msg, step, pStepId) {
    if( !step.dependsOn ) {
      return logger.warn(`Attempting to run step ${step.name} which has no dependsOn values`);
    }

    // get the current node definition
    // this mints a new node id if the 'parent -> next step name' combo have not been
    // accessed before
    let node = await this.ensureAndGetNode(msg, step.name);

    // get current link
    let dependDef = step.dependsOn.find(depend => depend.name === msg.node.name);
    if( !dependDef ) {
      logger.error(`Called dc.checkConditionals() on node that has no dependencies.`, msg, step);
      return {state: 'error', valid: false}
    }

    let state = await this.checkConditionalCompleted(node.id, msg.node.id);
    if( state.completed ) {
      if( state.valid ) 
    }

    debugger;

    // there are conditionals to check
    if( dependDef.filters ) {
      let dependState = await pg.getDependencyState(node.id, pStepId);

      // TODO

      // key = redis.getKey('dependsOnResults', [msg.runId, stepId]);
      // let results = (await redis.get(key)) || [];
      // let index = results.length;

      if( typeof filterDef.filter[index] === 'object' ) {
        this.sendAsyncConditional(filterDef.filter[index], step.id, pstepId);
        return {state : 'pending'};
      }

      let result = eval(filterDef.filter[index]);
      this.addResult(result, msg.runId, step.id, filterDef.id);


      // not finished, just quit
      if( !state.completed ) {
        return {state: 'pending'};
      }

    } else {

      // there no defined conditionals set a conditional as true and not pending
      await pg.insertDependencyState({
        graphId : node.graphId,
        parentNodeId : msg.node.id,
        nodeId : node.id,
        arrayIndex : 0, 
        value : true,
        pending: false
      });
      
    }

    this.conditionalReadyCallback(msg);
  }

  async sendAsyncConditional(msg, filter, pstepId, cstepId) {
    // make sure and set pstepId and cstepId
    // type === 'depends-on-filter'

    msg = {
      id : uuid.v4(),
      type : 'async-conditional',
      runId : msg.runId,
      filter : clone(filter),
      pstepId, cstepId
    }
  }

  /**
   * @method onAsyncConditionalResponse
   * @description given the response a async filter request, check the result value
   * and set the dependsOn filter result array, then call run to exec next filter.
   * will return the state of the filter exec (either 'completed' or 'async-filter');
   * 
   * @param {String} msg 
   * @param {Object} step 
   * @param {String} pstepId 
   * @returns 
   */
  async onAsyncConditionalResponse(msg) {
    if( typeof msg.response === 'string' ) {
      msg.result = msg.result.trim().toLowerCase();
    }

    // get the current definition
    let filterDef = await this.init(msg, step.id, pstepId);

    if( msg.response === true || msg.response === 'true' || msg.response === 't' ) {
      await this.addResult(true, msg.runId, step.id, filterDef.id);
    } else {
      await this.addResult(false, msg.runId, step.id, filterDef.id);
    }

    return this.checkConditionals(msg, step, pstepId);
  }

  /**
   * @method checkConditionalCompleted
   * @description check that all dependent stepId id's have run.
   * Then if any thing is false, you can delete 
   * 
   * @param {String} nodeId nodeId
   * 
   * @returns {Object}
   */
  async checkConditionalCompleted(node) {
    // TODO: get dependency definition from graph, check all states completed
    // reminder, they don't have to be valid
    let dependState = await pg.getDependencyState(nodeId);
    debugger;

    // return {complete: true, valid};
  }

  /**
   * @method getState
   * @description get a dependsOn start given 
   * graphId + nodeName
   * 
   * @param {String} graphId run id
   * @param {String} cstepId current step id (step we are looking to run)
   * @param {String} pstepId previous step id (step that already run)
   * @returns 
   */
  async getValue(runId, cNodeId, pNodeId) {
    let key = redis.getKey('dependsOnValue', [runId, cstepId, pstepId]);
    let value = redis.get(key);
    if( !value ) return null;
    return JSON.parse(value);
  }

  /**
   * @method setValue
   * @description given a runId and a stepId save the rendered dependsOn step
   * template
   * 
   * @param {String} runId run id
   * @param {String} cstepId current step id (step we are looking to run)
   * @param {Object} dependsOn rendered dependsOn step template 
   */
  // async setValue(runId, cstepId, dependsOn) {
  //   let key = redis.getKey('dependsOnValue', [runId, cstepId, dependsOn.id]);
  //   await this.addStepKey(runId, cstepId, key);
  //   await redis.set(key, JSON.stringify(dependsOn));
  //   await this.resetExpire(runId, cstepId);
  // }

    /**
   * @method addResult
   * @description set the boolean result for a filter execution
   * 
   * @param {Boolean} result filter execution result 
   * @param {String} runId run id
   * @param {String} cstepId current step id (step we are looking to run)
   * @param {String} pstepId previous step id (step that already ran)
   */
  async updateResult(result, runId, cstepId, pstepId) {
    let key = redis.getKey('dependsOnResults', [runId, cstepId, pstepId]);
    await this.addStepKey(runId, cstepId, key);
    await redis.rpush(key, result);
    await this.resetExpire(runId, cstepId);
  }


  async insertResult(graphId, parentNodeId, nodeId, index, value, pending) {
    
  }

  /**
   * @method resetExpire
   * @description any time a runId + cstepId + pstepId key is updated ALL 
   * runId + cstepId values should have their expire windows reset
   * 
   * @param {String} runId run id
   * @param {String} cstepId current step id (step we are looking to run)
   */
  async resetExpire(runId, cstepId) {
    let step = this.graph.getStep(cstepId);
    let duration = parseDuration(step.dependsOn.window || config.dependsOn.defaultWindow, 's');

    let key = redis.getKey('dependsOnKeys', [runId, cstepId]);
    await redis.expire(key, duration);

    let list = await redis.lrange(redis.getKey('dependsOnKeys'), [runId, cstepId], 0, -1);
    for( key of list ) await redis.expire(key, duration);
  }

  async addStepKey(runId, cstepId, key) {
    let list = await redis.lrange(redis.getKey('dependsOnKeys'), [runId, cstepId], 0, -1);
    if( (list || []).includes(key) ) return;
    await redis.lpush(redis.getKey('dependsOnKeys', [runId, cstepId]), key);
  }

}

export default A6tDependencyController;