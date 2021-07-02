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

      // set step/node name for easy access
      step.name = key;

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
        images.add(cmd.image || step.name);
      });
    }

    this.images = [...images];
  }

  getTopicName(image) {
    return image.replace(/[^A-Za-z0-9-_]+/g, '-');
  }

  getStep(stepName) {
    return this.graph.steps[stepName];
  }

  nextSteps(completedStepName) {
    let steps = [];

    for( let name in this.graph.steps ) {
      let dependsOn = this.graph.steps[name].dependsOn;
      if( !dependsOn ) continue;
      if( !Array.isArray(dependsOn) ) {
        dependsOn = [dependsOn];
      }

      let depIndex = dependsOn.findIndex(item => item.name === completedStepName);
      if( depIndex > -1 ) {
        steps.push(this.graph.steps[name]);
      }
    }

    return steps;
  }
}

export default A6tGraph;