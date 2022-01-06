#! /bin/bash

######### DEPLOYMENT CONFIG ############
# Setup the library container deployment here
########################################

# Grab build number is mounted in CI system
if [[ -f /config/.buildenv ]]; then
  source /config/.buildenv
else
  BUILD_NUM=-1
fi

# Main version number we are tagging we with. Always update
# this when you cut a new version of the containers!
VERION_TAG=v0.0.1-alpha.${BUILD_NUM}

##
# TAGS
##

# Repository tags/branchs
# Tags should always be used for production deployments
# Branches can be used for development deployments
KAFKA_TAG=2.5.0

##
# Registery
##

A6T_REG_HOST=gcr.io/ucdlib-pubreg

# set local-dev tags used by 
# local development docker-compose file
if [[ ! -z $LOCAL_BUILD ]]; then
  A6T_REG_HOST=localhost/local-dev
fi

##
# Container
##
CONTAINER_CACHE_TAG="latest"

# Container Image
A6T_IMAGE_NAME=$A6T_REG_HOST/argonaut
A6T_IMAGE_NAME_TAG=$A6T_IMAGE_NAME:$VERION_TAG

KAFKA_IMAGE_NAME=bitnami/kafka
KAFKA_IMAGE_NAME_TAG=$KAFKA_IMAGE_NAME:$KAFKA_TAG