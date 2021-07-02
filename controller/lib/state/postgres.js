import pg from 'pg';
import * as path from 'path';
import fs from 'fs-extra';
import {esmUtils, logger} from '@ucd-lib/a6t-commons';

const {__dirname} = esmUtils.moduleLocation(import.meta);

class PostgresClient {

  constructor() {
    this.schema = process.env.PG_SCHEMA || 'argonaut';
    this.client = new pg.Client({
      host : process.env.PG_HOST || 'postgres',
      user : process.env.PG_USERNAME || 'postgres',
      port : process.env.PG_PORT || 5432,
      database : process.env.PG_DATABASE || 'postgres'
    });
  }

  async connect() {
    if( this.connected ) return;

    if( this.connecting ) {
      await this.connecting;
    } else {
      this.connecting = this.client.connect();
      await this.connecting;

      await this.query(`SET search_path TO ${this.schema}, public`);

      this.connecting = null;
      this.connected = true;
    }
  }

  async ensureSchema() {
    await this.connect();
    let resp = await this.query(`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE  table_schema = '${this.schema}'
      AND    table_name   = 'message'
    );`);

    if( resp.rows[0].exists === true ) {
      return;
    }

    await this.query(`CREATE SCHEMA ${this.schema}`);
    await this.query('create extension "uuid-ossp"');
    await this.query(`SET search_path TO ${this.schema}, public`);
    let sql = await fs.readFile(path.join(__dirname, 'sql', 'messages.sql'), 'utf-8');
    await this.query(sql);

  }

  async disconnect() {
    if( !this.connected ) return;
    await this.client.disconnect();
    this.connected = false;
  }

  async query(query, params) {
    await this.connect();
    return this.client.query(query, params);
  }

  /**
   * @method addMessage
   * @description add raw kafka message to the messages table.
   * 
   * @param {Object} msg 
   * @param {Object} msg.value
   * @param {String} msg.value.id
   * @param {String} msg.topic
   * @param {Number} msg.offset
   * @param {Number} msg.partition
   * @param {Number} msg.size
   * 
   * @returns {Promise}
   */
  async addMessage(msg) {
    return this.query(
      `INSERT INTO message (message_id, data, topic, "offset", partition, size, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
      [msg.value.id, JSON.stringify(msg.value),  msg.topic, msg.offset, msg.partition, msg.size, new Date(msg.timestamp).toISOString()]
    );
  }

  /**
   * @method ensureAndGetNode
   * @description get the node (step implementation with its unique nodeId)
   * given a graphId and nodeName.  There can be a race condition here so
   * make sure to check for errors on insert 
   * 
   * @param {String} graphId 
   * @param {String} nodeName 
   */
  async ensureAndGetNode(graphId, nodeName) {
    let resp = await this.query('SELECT * from node where graph_id = $1 and node_name = $2', [graphId, nodeName]);

    if( resp.rows.length === 0 ) {
      // attempt to create node
      try {
        resp = await this.query('INSERT INTO node (graph_id, node_name) VALUES ($1, $2)', [graphId, nodeName]);
      } catch(e) {
        logger.warn('Failed to create node, hoping this is just race condition');
      }

      resp = await this.query('SELECT * from node where graph_id = $1 and node_name = $2', [graphId, nodeName]);
    }

    if( resp.rows.length === 0 ) {
      logger.error('Failed to create node for graphId='+graphId+' node_name='+nodeName);
    }

    return resp.rows[0];
  }

  /**
   * @method getDependencyState
   * @description Given a nodeId return it's current dependsOn state.  You can specify a parent node
   * to limit the results to only the depends link between the given node and the parent.
   * 
   * @param {String} nodeId 
   * @param {String} parentNodeId Optional 
   * @returns 
   */
  async getDependencyState(nodeId, parentNodeId) {
    let resp;

    if( parentNodeId ) {
      resp = await this.query('SELECT * FROM dependency_state where node_id = $1 and parent_node_id = $2', [nodeId, parentNodeId]); 
    } else {
      resp = await this.query('SELECT * FROM dependency_state where node_id = $1', [nodeId]) 
    }

    let state = {};
    resp.rows.forEach(item => {
      if( !state[item.parent_node_id] ) {
        state[item.parent_node_id] = {}
      }
      state[item.parent_node_id][item.array_index] = item;
    });

    return state;
  }

  /**
   * @method insertDependencyState
   * @description insert dependency
   * 
   * @param {Object} obj
   * @param {String} obj.graphId
   * @param {String} obj.parentNodeId
   * @param {String} obj.nodeId
   * @param {Number} obj.arrayIndex
   * @param {Boolean} obj.value
   * @param {Boolean} obj.pending
   * 
   * @returns {Promis}
   */
  async insertDependencyState(obj) {
    return this.query(`INSERT INTO dependency_state 
    (graph_id, parent_node_id, node_id, array_index, value, pending)
    VALUES ($1, $2, $3, $4, $5, $6)`, 
    [obj.graphId, obj.parentNodeId, obj.nodeId, obj.arrayIndex, obj.value, obj.pending]);
  }

  /**
   * @method updateDependencyState
   * @description insert dependency
   * 
   * @param {Object} obj
   * @param {String} obj.parentNodeId
   * @param {String} obj.nodeId
   * @param {Number} obj.arrayIndex
   * @param {Boolean} obj.value
   * @param {Boolean} obj.pending
   * 
   * @returns {Promis}
   */
  async updateDependencyState(obj) {
    return this.query(`UPDATE dependency_state SET
    (value, pending) = VALUES ($4, $5) WHERE 
    $1 = parent_node_id AND $2 = node_id AND $3 = array_index`, 
    [obj.parentNodeId, obj.nodeId, obj.arrayIndex, obj.value, obj.pending]);
  }

}

let client = new PostgresClient();
export default client;