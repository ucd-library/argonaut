#! /bin/bash

###
# Main build process to cutting production images
###

set -e
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $ROOT_DIR
source config.sh
cd ..

# TODO.  need custom build container
# A6T_REPO_HASH=$(git log -1 --pretty=%h)
# A6T_REPO_TAG=$(git describe --tags --abbrev=0 || '')
# A6T_REPO_BRANCH=$(git rev-parse --abbrev-ref HEAD)

##
# Harvest
##

# kafka init
docker build \
  -t $A6T_IMAGE_NAME_TAG \
  -t $A6T_IMAGE_NAME:$CONTAINER_CACHE_TAG \
  --build-arg NODE_VERSION=${NODE_VERSION} \
  --build-arg KAFKA_IMAGE=${KAFKA_IMAGE_NAME_TAG} \
    --cache-from=$A6T_IMAGE_NAME:$CONTAINER_CACHE_TAG \
  .
  # --build-arg A6T_REPO_HASH=${A6T_REPO_HASH} \
  # --build-arg A6T_REPO_TAG=${A6T_REPO_TAG} \
  # --build-arg A6T_REPO_BRANCH=${A6T_REPO_BRANCH} \


docker tag $A6T_IMAGE_NAME_TAG $A6T_IMAGE_NAME:$A6T_REPO_BRANCH