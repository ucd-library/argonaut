FROM node:16

RUN mkdir /service
WORKDIR /service

COPY package.json .
COPY package-lock.json .
RUN npm install --production
RUN npm link

COPY composer composer
COPY utils utils
COPY expire utils