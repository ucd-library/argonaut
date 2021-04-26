const graph = require('./graph');
const dependsOn = require('./depends-on');
const templateSubstitution = require('./template-substitution');
const redis = require('./redis');
const uuid = require('uuid');
const clone = require('clone');

const STEP_OPS = ['groupBy', 'prepare', 'preCmd', 'cmd', 'postCmd', 'finalize'];

class A6tController {

  async init() {
    await graph.load();
  }


  /**
   * @method onMessage
   * @description main entry point for a new message
   * 
   * @param {Object|String|Buffer} msg 
   */
  onMessage(msg) {
    if( msg instanceof Buffer ) {
      msg = msg.toString('utf-8');
    }
    if( typeof msg === 'string' ) {
      msg = JSON.parse(msg);
    }
  
    if( !msg.id ) msg.id = uuid.v4();
    if( !msg.runId ) msg.runId = uuid.v4();

    // check if this is a filter response message
    if( msg.type === 'depends-on-filter' ) {
      let resp = await dependsOn.onAsyncFilterResponse(msg);
      if( resp.state === 'async-filter' ) return; // the depends on module has sent next command
      if( resp.valid === false ) return; // we do not need to continue

      // at this point all depends on filters have checked out proceed with step
    }

    this.runNextOp(msg);
  }

  runNextOp(msg) {
    let currentStep = graph.getStep(msg.currentStep);
    let opIndex = STEP_OPS.indexOf(msg.currentStepOp);
    let nextOp = null;
    for( let i = opIndex+1; i < STEP_OPS.length; i++ ) {
      if( currentStep[STEP_OPS[i]] ) {
        nextOp = STEP_OPS[i];
        break;
      }
    }
    
    // we are done
    if( !nextOp ) {
      this.onStepComplete(msg);
      return;
    }

    // run next operation
    this.nextOp(msg, currentStep, nextOp);
  }
  
  async onStepComplete(msg) {
    let nextSteps = graph.nextSteps(msg.currentStep);

    for( let step of nextSteps ) {
      let resp = await dependsOn.run(msg, step, msg.currentStep);
      // ignore state === 'async-filter' those are handled above
      if( resp.state === 'completed' ) {
        this.runNextOp(msg);
      }
    }
  }

  nextOp(msg, currentStep, nextOp) {
    msg.currentStepOp = nextOp;
    if( !msg.result ) msg.result = {};

    currentStepOp = templateSubstitution(msg, currentStep[nextOp]);

    if( msg.currentStepOp === 'groupBy' ) {
      msg.groupBy = currentStepOp;
    } else if( msg.currentStepOp === 'prepare' ) {
      for( let variable in currentStep.prepare ) {
        msg.result[variable] = currentStep.prepare[variable];
      }
      this.onMessage(msg);
      return;
    } else if( msg.currentStepOp === 'preCmd' ) {
      msg.cmd = currentStepOp;
    } else if( msg.currentStepOp === 'cmd' ) {
      msg.cmd = currentStepOp;
    } else if( msg.currentStepOp === 'postCmd' ) {
      msg.cmd = currentStepOp;
    } else if( msg.currentStepOp === 'finalize' ) {
      for( let variable in currentStep.finalize ) {
        msg.result[variable] = currentStep.finalize[variable];
      }
      this.onMessage(msg);
      return;
    }

    this.sendOp(msg);
  }


  sendOp() {

  }


}

module.exports = A6tController();