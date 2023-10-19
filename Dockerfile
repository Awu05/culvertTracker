FROM node:20-alpine

RUN apk add --no-cache curl yarn

COPY . .

RUN yarn install

CMD ["/bin/sh", "entrypoint.sh"]