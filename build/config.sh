#! /bin/bash

######### DEPLOYMENT CONFIG ############
# Setup the library container deployment here
########################################

# Grab build number is mounted in CI system
BUILD_NUM=""
if [[ -f /config/.buildenv ]]; then
  source /config/.buildenv
  BUILD_NUM=".${BUILD_NUM}"
fi

# Main version number we are tagging we with. Always update
# this when you cut a new version of the containers!
VERION_TAG=v0.0.1-alpha${BUILD_NUM}

##
# TAGS
##

# Repository tags/branchs
# Tags should always be used for production deployments
# Branches can be used for development deployments
# KAFKA_TAG=2.5.0
NODE_VERSION=16

##
# Registery
##

if [[ -z $A6T_REG_HOST ]]; then
  A6T_REG_HOST=gcr.io/ucdlib-pubreg

  # set local-dev tags used by 
  # local development docker-compose file
  if [[ ! -z $LOCAL_DEV ]]; then
    A6T_REG_HOST=localhost/local-dev
  fi
fi

##
# Container
##
CONTAINER_CACHE_TAG="latest"

# Container Image
A6T_IMAGE_NAME=$A6T_REG_HOST/argonaut
A6T_IMAGE_NAME_TAG=$A6T_IMAGE_NAME:$VERION_TAG

# KAFKA_IMAGE_NAME=bitnami/kafka
# KAFKA_IMAGE_NAME_TAG=$KAFKA_IMAGE_NAME:$KAFKA_TAG