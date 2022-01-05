
class Graph {

  constructor() {
    this.graph = null;
    this.dependencies = {};
  }

  load(file) {
    this.graph = await import(file);
    this.dependencies = {};

    for( let key of this.graph ) {
      for( let task of this.graph[key].dependsOn ) {
        if( !this.dependencies[task] ) this.dependencies[task] = [];
        this.dependencies[task].push(key);
      }
    }
  }

  getCustomTopics() {
    let topics = [];

    for( let key of this.graph ) {
      let task = this.graph[key];
      if( task.topic || task.source ) {
        topics.push( task.topic || key );
      }
    }

    return topics;
  }

  getTask(id) {
    return this.graph[id];
  }

  getDependencies(task) {
    return this.dependencies[task] || [];
  }



}

export default Graph;