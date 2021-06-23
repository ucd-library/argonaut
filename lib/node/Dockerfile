FROM node:14

RUN mkdir /utils
WORKDIR /utils

COPY package.json .
COPY package-lock.json .
RUN npm install --production

COPY index.js .
COPY lib lib
RUN npm link