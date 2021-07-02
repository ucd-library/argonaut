import config from './config.js';

class A6tGraph {

  /**
   * @method load
   * @description load to graph file
   */
  async load() {
    this.graph = {... (await import(config.graphFile)).default}; 

    // find all images used, this will be required to setup topics
    if( !this.graph.images ) this.graph.images = {};
    let images = new Set();
    Object.values(this.graph.images)
      .forEach(image => images.add(image));

    for( let key in this.graph.steps ) {
      let step = this.graph.steps[key];

      // set step id for easy access
      step.id = key;

      if( step.dependsOn ) {
        step.dependsOn.forEach(item => {
          if( !item.filter ) return;
          item.filter.forEach(filter => {
            if( typeof filter === 'string' ) return;  
            if( graph.images[filter.image] ) return;
            images.add(filter.image);
          });
        });
      }

      if( step.groupBy && step.groupBy.ready && !graph.images[step.groupBy.ready.image] ) {
        images.add(step.groupBy.ready.image);
      }

      ['preCmd', 'cmd', 'postCmd'].forEach(cmd => {
        cmd = step[cmd] || {};
        images.add(cmd.image || step.id);
      });
    }

    this.images = [...images];
  }

  getTopicName(image) {
    return image.replace(/[^A-Za-z0-9-_]+/g, '-');
  }

  getStep(stepId) {
    return this.graph.steps[stepId];
  }

  nextSteps(completedStepId) {
    let steps = [];

    for( let id in this.graph.steps ) {
      let dependsOn = this.graph.steps[id].dependsOn;
      if( !dependsOn ) continue;
      if( !Array.isArray(dependsOn) ) {
        dependsOn = [dependsOn];
      }

      let depIndex = dependsOn.findIndex(item => item.id === completedStepId);
      if( depIndex > -1 ) {
        steps.push(this.graph.steps[id]);
      }
    }

    return steps;
  }
}

export default A6tGraph;