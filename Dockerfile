ARG KAFKA_IMAGE
FROM ${KAFKA_IMAGE}

# base dependencies
USER root
RUN apt-get update && apt-get install -y wait-for-it vim curl build-essential

# install nodejs
RUN curl -fsSL https://deb.nodesource.com/setup_17.x | bash -
RUN apt-get install -y nodejs

RUN mkdir /service
WORKDIR /service

COPY package.json .
COPY package-lock.json .
RUN npm install --production
RUN npm link

COPY composer composer
COPY utils utils
COPY expire expire
COPY init init

ARG A6T_REPO_HASH
ENV A6T_REPO_HASH=${A6T_REPO_HASH}
ARG A6T_REPO_TAG
ENV A6T_REPO_TAG=${A6T_REPO_TAG}
ARG A6T_REPO_BRANCH
ENV A6T_REPO_BRANCH=${A6T_REPO_BRANCH}

ENTRYPOINT []