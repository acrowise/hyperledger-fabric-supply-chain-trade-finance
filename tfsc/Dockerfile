FROM node:12.0.0-alpine

RUN apk add --no-cache make gcc g++ python util-linux

RUN mkdir /src
WORKDIR /src

ADD package.json /src/
RUN yarn

ADD . /src/

RUN yarn build:client

EXPOSE 3000

CMD [ "yarn", "start" ]
