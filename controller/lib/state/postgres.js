import pg from 'pg';
import * as path from 'path';
import fs from 'fs-extra';
import {esmUtils} from '@ucd-lib/a6t-commons';

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

    await this.query(`CREATE SCHEMA ${this.schema}`)
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

  async addMessage(msg) {
    let resp = await this.query(`INSERT INTO message (message_id, data) VALUES ($1, $2)`, [msg.id, JSON.stringify(msg)]);
    console.log(resp);
  }

}

let client = new PostgresClient();
export default client;