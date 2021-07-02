CREATE TABLE IF NOT EXISTS message (
  message_id TEXT, 
  data JSONB, 
  timestamp TIMESTAMP,
  PRIMARY KEY (message_id)
);
CREATE INDEX IF NOT EXISTS message_id_idx ON message USING BTREE ((data->>'id'));
CREATE INDEX IF NOT EXISTS message_tree_id_idx ON message USING BTREE ((data->'tree'->>'id'));
CREATE INDEX IF NOT EXISTS message_tree_root_idx ON message USING BTREE ((data->'tree'->>'root'));
CREATE INDEX IF NOT EXISTS message_execute_id_idx ON message USING BTREE ((data->>'id'));
CREATE INDEX IF NOT EXISTS message_timestamp_idx ON message (timestamp);

CREATE OR REPLACE FUNCTION update_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.timestamp = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_message_timestamp ON message;
CREATE TRIGGER update_message_timestamp BEFORE UPDATE
ON message FOR EACH ROW EXECUTE PROCEDURE 
update_message_timestamp();

DROP TRIGGER IF EXISTS insert_message_timestamp ON message;
CREATE TRIGGER insert_message_timestamp BEFORE INSERT
ON message FOR EACH ROW EXECUTE PROCEDURE 
update_message_timestamp();

CREATE TABLE IF NOT EXISTS graph (
  graph_id TEXT,
  node_id TEXT,
  parent_id TEXT,
  is_root BOOLEAN,
  timestamp TIMESTAMP,
  PRIMARY KEY (graph_id)
);
CREATE INDEX IF NOT EXISTS graph_id_idx on graph (graph_id);
CREATE INDEX IF NOT EXISTS graph_node_id_idx on graph (node_id);
CREATE INDEX IF NOT EXISTS graph_parent_id_idx on graph (parent_id);
CREATE INDEX IF NOT EXISTS graph_timestamp_idx on graph (timestamp);

CREATE OR REPLACE FUNCTION update_graph_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.timestamp = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_graph_timestamp ON graph;
CREATE TRIGGER update_graph_timestamp BEFORE UPDATE
ON graph FOR EACH ROW EXECUTE PROCEDURE 
update_graph_timestamp();

DROP TRIGGER IF EXISTS insert_graph_timestamp ON graph;
CREATE TRIGGER insert_graph_timestamp BEFORE INSERT
ON graph FOR EACH ROW EXECUTE PROCEDURE 
update_graph_timestamp();

-- CREATE TABLE IF NOT EXISTS dependency_check (
--   node_id TEXT,
--   array_index INTEGER,
--   value BOOLEAN,
--   pending BOOLEAN,
--   PRIMARY KEY (node_id)
-- );