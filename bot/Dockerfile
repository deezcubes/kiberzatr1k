FROM node:18-alpine as build
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev git > /dev/null 2>&1

WORKDIR /opt/
COPY package.json yarn.lock ./
RUN yarn global add node-gyp
RUN yarn config set network-timeout 600000 -g && yarn install
ENV PATH /opt/node_modules/.bin:$PATH
WORKDIR /opt/app
COPY . .
RUN yarn openapi:generate
RUN yarn build

FROM node:18-alpine as deps
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev git > /dev/null 2>&1
ENV NODE_ENV=production

WORKDIR /opt/
COPY package.json yarn.lock ./
RUN yarn global add node-gyp
RUN yarn config set network-timeout 600000 -g && yarn install

FROM node:18-alpine

ENV NODE_ENV=production
WORKDIR /opt/
COPY --from=deps /opt/node_modules ./node_modules
WORKDIR /opt/app
COPY --from=build /opt/app ./
ENV PATH /opt/node_modules/.bin:$PATH

RUN mkdir /opt/app/data

RUN chown -R node:node /opt/app
USER node
CMD ["yarn", "start"]