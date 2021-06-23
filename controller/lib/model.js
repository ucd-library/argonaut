import A6tGraph from './graph.js';
import A6tDependsOnController from './depends-on.js';
import templateSubstitution from './template-substitution.js';
import { Listen, Response, messageUtils } from '@ucd-lib/a6t-commons';

const STEP_OPS = ['groupBy', 'prepare', 'preCmd', 'cmd', 'postCmd', 'finalize'];

class A6tController {

  constructor() {
    this.graph = new A6tGraph();
    this.dependsOn = new A6tDependsOnController(this.graph);
    this.listen = new Listen(msg => this.onMessage(msg));
    this.response = new Response();
  }

  /**
   * @method init
   * @description load graphs and connect to kafka
   */
  async init() {
    console.log('init')
    await this.graph.load();
    await this.listen.connect();
    await this.response.connect();
    console.log('A6tController ready')
  }

  /**
   * @method onMessage
   * @description main entry point for a new message
   * 
   * @param {Object|String|Buffer} msg 
   */
  async onMessage(msg) {
    if( msg instanceof Buffer ) {
      msg = msg.toString('utf-8');
    }
    if( typeof msg === 'string' ) {
      msg = JSON.parse(msg);
    }

    // check if this is a conditional response message
    if( msg.type === 'conditional' ) {
      let resp = await this.dependsOn.onAsyncFilterResponse(msg);

      // the depends on module has sent next command
      if( resp.state === 'async-filter' ) return; 

      // we do not need to continue
      if( resp.valid === false ) return; 

      // at this point all depends on filters have checked out proceed with step
    }

    this.nextOperation(msg);
  }

  /**
   * @method nextOperation
   * @description attempt to run next operation, or next step
   * 
   * @param {Object} msg 
   * @returns 
   */
   nextOperation(msg) {
    let currentStep = graph.getStep(msg.step.id);
    let opIndex = STEP_OPS.indexOf(msg.step.operation);
    
    let nextOp = null;

    // see if the operation (which could be null) exists
    if( opIndex !== -1 ) {
      this.onStepComplete(msg);
      return;
    }

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
    this.updateMessageOp(msg, currentStep, nextOp);
  }
  
  async onStepComplete(msg) {
    let nextSteps = graph.nextSteps(msg.step.id);

    for( let step of nextSteps ) {
      let resp = await this.dependsOn.run(msg, step, msg.step.id);
      
      // ignore state === 'async-filter' those are handled above
      if( resp.state === 'completed' ) {
        // set the message response
        msg.steps[msg.step.id] = msg.response;

        messageUtils.createExecute({
          type : 'execute',
          step : {
            id : step.id
          },
          tree : msg.tree,
          steps : msg.steps,
          metadata : step.metadata,
          topic : step.topic
        }, graph.config)

        if( step.cmd ) {
          this.runOperation(msg);
        } else {
          this.response.send(msg);
        }
      }
    }
  }

  updateMessageOp(msg, currentStep, nextOp) {
    let operation = templateSubstitution(msg, currentStep[nextOp]);

    if( nextOp === 'groupBy' ) {
      msg.groupBy = operation;
    } else if( nextOp === 'prepare' ) {
      for( let variable in currentStep.prepare ) {
        msg.response[variable] = currentStep.prepare[variable];
      }
    } else if( nextOp === 'preCmd' ) {
      msg.cmd = operation;
    } else if( nextOp === 'cmd' ) {
      msg.cmd = operation;
    } else if( nextOp === 'postCmd' ) {
      msg.cmd = operation;
    } else if( nextOp === 'finalize' ) {
      for( let variable in currentStep.finalize ) {
        msg.response[variable] = currentStep.finalize[variable];
      }
    }
  }


}

export default A6tController;