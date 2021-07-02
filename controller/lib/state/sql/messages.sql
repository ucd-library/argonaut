CREATE TABLE IF NOT EXISTS message (
  message_id UUID, 
  data JSONB, 
  topic TEXT,
  "offset" INTEGER,
  partition INTEGER,
  size INTEGER,
  timestamp TIMESTAMP,
  updated TIMESTAMP,
  PRIMARY KEY (message_id)
);
CREATE INDEX IF NOT EXISTS message_id_idx ON message USING BTREE ((data->>'id'));
CREATE INDEX IF NOT EXISTS message_node_id_idx ON message USING BTREE ((data->'node'->>'id'));
CREATE INDEX IF NOT EXISTS message_node_name_idx ON message USING BTREE ((data->'node'->>'name'));
CREATE INDEX IF NOT EXISTS message_graph_id_idx ON message USING BTREE ((data->>'id'));
CREATE INDEX IF NOT EXISTS message_timestamp_idx ON message (timestamp);

CREATE OR REPLACE FUNCTION update_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated = now(); 
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


CREATE TABLE IF NOT EXISTS node (
  node_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  graph_id UUID NOT NULL,
  node_name TEXT NOT NULL,
  timestamp TIMESTAMP,
  UNIQUE (graph_id, node_name)
);

CREATE OR REPLACE FUNCTION update_node_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.timestamp = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_node_timestamp ON node;
CREATE TRIGGER update_node_timestamp BEFORE UPDATE
ON node FOR EACH ROW EXECUTE PROCEDURE 
update_node_timestamp();

DROP TRIGGER IF EXISTS insert_node_timestamp ON node;
CREATE TRIGGER insert_node_timestamp BEFORE INSERT
ON node FOR EACH ROW EXECUTE PROCEDURE 
update_node_timestamp();

-- CREATE TABLE IF NOT EXISTS graph (
--   graph_id TEXT PRIMARY KEY,
--   node_id TEXT NOT NULL,
--   node_name TEXT NOT NULL,
--   parent_id TEXT,
--   is_root BOOLEAN,
--   timestamp TIMESTAMP,
--   UNIQUE (c2, c3)
-- );
-- CREATE INDEX IF NOT EXISTS graph_id_idx on graph (graph_id);
-- CREATE INDEX IF NOT EXISTS graph_node_id_idx on graph (node_id);
-- CREATE INDEX IF NOT EXISTS graph_parent_id_idx on graph (parent_id);
-- CREATE INDEX IF NOT EXISTS graph_timestamp_idx on graph (timestamp);

-- CREATE OR REPLACE FUNCTION update_graph_timestamp()
-- RETURNS TRIGGER AS $$
-- BEGIN
--    NEW.timestamp = now(); 
--    RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- DROP TRIGGER IF EXISTS update_graph_timestamp ON graph;
-- CREATE TRIGGER update_graph_timestamp BEFORE UPDATE
-- ON graph FOR EACH ROW EXECUTE PROCEDURE 
-- update_graph_timestamp();

-- DROP TRIGGER IF EXISTS insert_graph_timestamp ON graph;
-- CREATE TRIGGER insert_graph_timestamp BEFORE INSERT
-- ON graph FOR EACH ROW EXECUTE PROCEDURE 
-- update_graph_timestamp();

CREATE TABLE IF NOT EXISTS dependency_state (
  dependency_state_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  graph_id UUID NOT NULL,
  parent_node_id UUID NOT NULL,
  node_id UUID NOT NULL,
  array_index INTEGER NOT NULL,
  value BOOLEAN,
  pending BOOLEAN NOT NULL, 
  timestamp TIMESTAMP,
  UNIQUE(graph_id, parent_node_id, node_id, array_index)
);
CREATE INDEX IF NOT EXISTS ds_parent_node_id_idx on dependency_state (parent_node_id);
CREATE INDEX IF NOT EXISTS ds_node_id_idx on dependency_state (node_id);

CREATE OR REPLACE FUNCTION update_dependency_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.timestamp = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_dependency_state_timestamp ON dependency_state;
CREATE TRIGGER update_dependency_state_timestamp BEFORE UPDATE
ON dependency_state FOR EACH ROW EXECUTE PROCEDURE 
update_dependency_state_timestamp();

DROP TRIGGER IF EXISTS insert_dependency_state_timestamp ON dependency_state;
CREATE TRIGGER insert_dependency_state_timestamp BEFORE INSERT
ON dependency_state FOR EACH ROW EXECUTE PROCEDURE 
update_dependency_state_timestamp();