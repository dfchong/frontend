#!/bin/sh
set -e

BACKEND_API_ADDRESS="${BACKEND_API_ADDRESS:-ppanel.ppanel.svc.cluster.local:8080}"

envsubst '${BACKEND_API_ADDRESS}' \
    < /etc/nginx/conf.d/default.conf.template \
    > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
