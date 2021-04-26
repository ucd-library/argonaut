#!/bin/sh

export KAFKA_METADATA_DIR=/bitnami/kafka/data

if [ -z "$KAFKA_MOUNTED_CONF_DIR" ]; then
  export KAFKA_MOUNTED_CONF_DIR=/opt/bitnami/kafka/config/kraft
fi
echo "Using kafka config: $KAFKA_MOUNTED_CONF_DIR"

if [ ! -f "$KAFKA_METADATA_DIR/meta.properties" ]; then
  echo "Initializing kafka storage..."
  mkdir -p $KAFKA_METADATA_DIR
  kafka-storage.sh random-uuid > $KAFKA_METADATA_DIR/uuid
  KAFKA_CFG_NODE_ID=`cat $KAFKA_METADATA_DIR/uuid`
  kafka-storage.sh format -t $KAFKA_CFG_NODE_ID -c $KAFKA_MOUNTED_CONF_DIR/server.properties
fi

export KAFKA_CFG_NODE_ID=`cat $KAFKA_METADATA_DIR/uuid`
echo "Starting kafka with node.id=$KAFKA_CFG_NODE_ID"

# Hand off to original entrypoint
/entrypoint.sh "$@"