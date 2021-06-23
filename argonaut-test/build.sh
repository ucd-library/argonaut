#! /bin/bash

set -e
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $ROOT_DIR

LOCAL_TAG=local-dev
BASE_IMAGE=ucdlib-pubreg/a6t-node:${LOCAL_TAG}

docker build -t ucdlib-pubreg/a6t-kafka:${LOCAL_TAG} ../kafka

docker build -t ${BASE_IMAGE} ../lib/node
docker build \
  -t ucdlib-pubreg/a6t-controller:${LOCAL_TAG} \
  --build-arg BASE_IMAGE=${BASE_IMAGE} \
  ../controller
docker build \
  -t ucdlib-pubreg/a6t-test-worker:${LOCAL_TAG} \
  --build-arg BASE_IMAGE=${BASE_IMAGE} \
  ./worker