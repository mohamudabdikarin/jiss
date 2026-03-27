#!/bin/sh
set -e

# Replace ADMIN_DOMAIN placeholder in nginx config
if [ -n "$ADMIN_DOMAIN" ]; then
  sed -i "s/\${ADMIN_DOMAIN}/$ADMIN_DOMAIN/g" /etc/nginx/conf.d/default.conf
else
  echo "WARNING: ADMIN_DOMAIN not set, /admin redirect will not work"
fi

# Start nginx
exec nginx -g "daemon off;"
