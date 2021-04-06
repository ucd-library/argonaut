const clone = require('clone');
const parseDuration = require('parse-duration');
const uuid = require('uuid');
const templateSubstitution = require('./template-substitution');
const graph = require('./graph');
const redis = require('./redis');
const config = require('./config');

/**
 * @class DependsOn
 * @description runs the depends on loop
 */
class A6tDependsOnController {

  /**
   * @method init
   * @description initialize the dependsOnValue in redis
   * if it does not exist
   * 
   * @param {Object} msg cloud message 
   * @param {String} cstepId current step id
   * @param {String} pstepId previous step id (step that already run)
   * 
   * @return {Promise} 
   */
  async init(msg, cstepId, pstepId) {
    let filterDef = await this.getValue(msg.runId, cstepId, pstepId);

    if( !filterDef ) {
      // find the filter definition for this step
      filterDef = step.dependsOn.steps.find(item => item.id === cstepId);
      if( !Array.isArray(filterDef.filter) ) {
        filterDef.filter = [filterDef.filter]
      };

      filterDef = templateSubstitution(msg, filterDef);
      await this.setValue(msg.runId, cstepId, filterDef);
      
      let key = redis.getKey('dependsOnOrgMsg', [msg.runId, cstepId, pstepId]);
      await redis.set(key, JSON.stringify(msg));
      await this.addStepKey(msg.runId, cstepId, key);

      await this.resetExpire(msg.runId, cstepId);
    }

    return filterDef;
  }

  /**
   * @method run
   * @description run the depends on loop
   * 
   * @param {Object} msg cloud message
   * @param {Object} step step definition (step we are looking to run)
   * @param {String} pstepId previous step id (step that already run)
   * @returns {Promise}
   */
  async run(msg, step, pstepId) {
    // get the current definition
    let filterDef = await this.init(msg, step.id, pstepId);

    // get current results
    key = redis.getKey('dependsOnResults', [msg.runId, stepId]);
    let results = (await redis.get(key)) || [];
    let index = results.length;

    if( typeof filterDef.filter[index] === 'object' ) {
      this.sendAsyncFilter(filterDef.filter[index], step.id, pstepId);
      return {state : 'async-filter'};
    }

    let result = eval(filterDef.filter[index]);
    this.addResult(result, msg.runId, step.id, filterDef.id);

    let state = await this.checkCompleted();
    if( !state.completed ) {
      return this.run(msg, step, pstepId);
    }

    return {state: 'completed', valid: state.valid} 
  }

  async sendAsyncFilter(msg, filter, pstepId, cstepId) {
    // make sure and set pstepId and cstepId
    // type === 'depends-on-filter'

    msg = {
      id : uuid.v4();
      type : 'depends-on-filter',
      runId : msg.runId,
      filter : clone(filter),
      pstepId, cstepId
    }
  }

  /**
   * @method onAsyncFilterResponse
   * @description given the response a async filter request, check the result value
   * and set the dependsOn filter result array, then call run to exec next filter.
   * will return the state of the filter exec (either 'completed' or 'async-filter');
   * 
   * @param {String} msg 
   * @param {Object} step 
   * @param {String} pstepId 
   * @returns 
   */
  async onAsyncFilterResponse(msg) {
    if( typeof msg.result === 'string' ) {
      msg.result = msg.result.trim().toLowerCase();
    }

    // get the current definition
    let filterDef = await this.init(msg, step.id, pstepId);

    if( msg.result === true || msg.result === 'true' || msg.result === 't' ) {
      await this.addResult(true, msg.runId, step.id, filterDef.id);
    } else {
      await this.addResult(false, msg.runId, step.id, filterDef.id);
    }

    return this.run(msg, step, pstepId);
  }

  /**
   * @method checkCompleted
   * @description check that all dependent stepId id's have run.
   * Then if any thing is false, you can delete 
   * 
   * @param {String} runId run id
   * @param {String} cstepId current step id (step we are looking to run)
   * 
   * @returns {Object}
   */
  async checkCompleted(runId, cstepId) {
    let key = redis.getKey('dependsOnResults', [runId, cstepId, '*']);
    let resultKeys = await redis.keys(key);
    
    let step = graph.getStep(cstepId);

    if( step.dependsOn.length !== resultKeys ) {
      // we need to wait for everything to complete
      return {completed: false};
    }

    let valid = true;
    for( let key of resultKeys ) {
      let results = await redis.get(key);
      if( results.includes(false) ) {
        valid = false;
        break;
      }
    }

    // if we are not valid, but completed, remove keys
    // TODO: right now we will let expire

    return {complete: true, valid};
  }

  /**
   * @method getValue
   * @description get a rendered dependsOn step template given 
   * runId + cstepId + pstepId
   * 
   * @param {String} runId run id
   * @param {String} cstepId current step id (step we are looking to run)
   * @param {String} pstepId previous step id (step that already run)
   * @returns 
   */
  async getValue(runId, cstepId, pstepId) {
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
  setValue(runId, cstepId, dependsOn) {
    let key = redis.getKey('dependsOnValue', [runId, cstepId, dependsOn.id]);
    await this.addStepKey(runId, cstepId, key);
    await redis.set(key, JSON.stringify(dependsOn));
    await this.resetExpire(runId, cstepId);
  }

    /**
   * @method addResult
   * @description set the boolean result for a filter execution
   * 
   * @param {Boolean} result filter execution result 
   * @param {String} runId run id
   * @param {String} cstepId current step id (step we are looking to run)
   * @param {String} pstepId previous step id (step that already ran)
   */
  addResult(result, runId, cstepId, pstepId) {
    let key = redis.getKey('dependsOnResults', [runId, cstepId, pstepId]);
    await this.addStepKey(runId, cstepId, key);
    await redis.rpush(key, result);
    await this.resetExpire(runId, cstepId);
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
    let step = graph.getStep(cstepId);
    let duration = parseDuration(step.dependsOn.window || config.dependsOn.defaultWindow, 's');

    let key = redis.getKey('dependsOnKeys', [runId, cstepId]);
    await redis.expire(key, duration);

    let list = await redis.lrange(redis.getKey('dependsOnKeys'), [runId, cstepId], 0, -1);
    for( key of list ) await redis.expire(key, duration);
  }

  addStepKey(runId, cstepId, key) {
    let list = await redis.lrange(redis.getKey('dependsOnKeys'), [runId, cstepId], 0, -1);
    if( (list || []).includes(key) ) return;
    await redis.lpush(redis.getKey('dependsOnKeys', [runId, cstepId]), key);
  }

}

module.exports = new A6tDependsOnController();