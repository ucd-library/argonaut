ARG BASE_IMAGE
FROM ${BASE_IMAGE}

RUN mkdir /service
WORKDIR /service

COPY package.json .
COPY package-lock.json .
RUN npm install --production

RUN npm link @ucd-lib/a6t-commons

COPY lib lib
COPY index.js .
COPY run.js .

CMD node index.js