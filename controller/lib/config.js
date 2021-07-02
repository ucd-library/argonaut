import {config} from '@ucd-lib/a6t-commons';

let controllerConfig = Object.assign({}, config, {

  graphFile : process.env.A6T_GRAPH_FILE || '/etc/a6t/dag/index.js',

  dependencyController : {
    // this is just cleanup, so keys can stick are for a little bit
    defaultWindow : '5min'
  },

  groupBy : {
    // this controls to flow
    defaultWindow : '1min'
  }
});

export default controllerConfig;