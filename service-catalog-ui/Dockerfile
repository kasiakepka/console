# This Dockerfile must be execute with higher context, because firstly we have to create react components lib with local changes.
# If you want to build image without local changes of react components, delete 16 line of code.

# copying .env in 13 line is a temporary solution for issue with babel-loader package in react-scripts 

FROM node:12.16.0-alpine3.9 as ui-generator

WORKDIR /app

RUN apk update && apk upgrade && apk add --no-cache curl && apk add --no-cache bash
# Copy licenses
COPY licenses/ /app/licenses/

# Install root and app dependencies
COPY ./temp /app
RUN npm run bootstrap:prod

COPY package.json package-lock.json /app/service-catalog/
COPY brokers/package.json brokers/package-lock.json brokers/config-overrides.js /app/service-catalog/brokers/
COPY catalog/package.json catalog/package-lock.json catalog/config-overrides.js catalog/.env catalog/postinstall.js /app/service-catalog/catalog/
COPY instances/package.json instances/package-lock.json instances/config-overrides.js instances/.env instances/postinstall.js /app/service-catalog/instances/
RUN cd /app/service-catalog && npm install --no-optional --unsafe-perm

# Copy sources
COPY brokers/src /app/service-catalog/brokers/src
COPY brokers/public /app/service-catalog/brokers/public

COPY catalog/src /app/service-catalog/catalog/src
COPY catalog/public /app/service-catalog/catalog/public

COPY instances/src /app/service-catalog/instances/src
COPY instances/public /app/service-catalog/instances/public

# Set env variables 
ENV PRODUCTION true
ENV CI true

# Test & Build
# RUN cd /app/service-catalog && npm test

RUN cd /app/service-catalog && npm run build

### Main image ###
FROM alpine:3.11

### Install nginx package and remove cache ###
RUN apk add --update nginx && rm -rf /var/cache/apk/*

LABEL source git@github.com:kyma-project/console.git

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=ui-generator /app/service-catalog/brokers/build var/brokers-public
COPY --from=ui-generator /app/service-catalog/catalog/build var/catalog-public
COPY --from=ui-generator /app/service-catalog/instances/build var/instances-public
COPY --from=ui-generator /app/licenses/ /app/licenses/

RUN touch /var/run/nginx.pid && \
  chown -R nginx:nginx /var/run/nginx.pid

EXPOSE 8080 8081 8082

CMD ["nginx", "-g", "daemon off;"]