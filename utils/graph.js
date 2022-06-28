import config from './config.js'

class Graph {

  constructor() {
    this.graph = null;
    this.dependencies = {};
  }

  async load(file) {
    this.graph = await import(file);
    if( this.graph.default ) {
      this.graph = this.graph.default;
    }
    this.dependencies = {};

    for( let key in this.graph ) {
      if( this.graph[key].enabled === false ) continue;
      this.graph[key].id = key;

      if( !this.graph[key].dependencies ) continue;

      for( let task of this.graph[key].dependencies ) {
        if( !this.dependencies[task] ) this.dependencies[task] = [];
        this.dependencies[task].push(key);
      }
    }
  }

  getTopics() {
    let topics = new Set();

    for( let key in this.graph ) {
      if( this.graph[key].enabled === false ) continue;

      let task = this.graph[key];
      let topic = task.topic || key;

      topics.add(topic);

      if( task.dependencies ) {
        task.dependencies.forEach(topic => topics.add(topic));
      }
    }

    return Array.from(topics);
  }

  getTask(id) {
    return this.graph[id];
  }

  getTaskFromTopic(topic) {
    if( this.graph[topic] ) return this.graph[topic];
    for( let id in this.graph ) {
      if( this.graph[id].topic === topic ) {
        return this.graph[id];
      }
    }

    return null;
  }

  getDependencies(task) {
    return this.dependencies[task] || [];
  }



}

export default Graph;