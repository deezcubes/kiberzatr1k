FROM node:20.19-alpine3.22 as build
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git > /dev/null 2>&1
ENV NODE_ENV=production

WORKDIR /opt/
COPY package.json yarn.lock ./
RUN yarn global add node-gyp && yarn cache clean --all
RUN yarn config set network-timeout 600000 -g && yarn install --production && yarn cache clean --all
ENV PATH /opt/node_modules/.bin:$PATH
WORKDIR /opt/app
COPY . .
RUN yarn build && yarn cache clean --all
WORKDIR /opt/app/src/plugins/mq
RUN yarn build && yarn cache clean --all
WORKDIR /opt
RUN yarn global add clean-modules && clean-modules -y

FROM node:20.19-alpine3.22
RUN apk add --no-cache vips-dev
ENV NODE_ENV=production
WORKDIR /opt/
COPY --from=build /opt/node_modules ./node_modules
WORKDIR /opt/app
COPY --from=build /opt/app ./
ENV PATH /opt/node_modules/.bin:$PATH

RUN chown -R node:node /opt/app
USER node
EXPOSE 1337
CMD ["yarn", "start"]
