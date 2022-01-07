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
      this.graph[key].id = key;

      if( !this.graph[key].dependencies ) continue;

      for( let task of this.graph[key].dependencies ) {
        if( !this.dependencies[task] ) this.dependencies[task] = [];
        this.dependencies[task].push(key);
      }
    }
  }

  getTopics() {
    let topics = [];

    for( let key in this.graph ) {
      let task = this.graph[key];
      let topic = task.topic || key;

      if( typeof topic === 'string' ) {
        topic = {name : topic}
      }

      for( let key in config.kafka.topicDefaults ) {
        if( topic[key] === undefined ) {
          topic[key] = config.kafka.topicDefaults[key];
        }
      }

      topics.push(topic);
    }

    return topics;
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