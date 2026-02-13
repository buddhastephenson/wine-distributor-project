#!/bin/bash

# Redirect Setup Script
# Redirects traffic from the raw IP (or any other hostname hitting default) to trade.aocwinecompany.com

DOMAIN="trade.aocwinecompany.com"

echo "----------------------------------------------------------------"
echo "Setting up Redirect to $DOMAIN..."
echo "----------------------------------------------------------------"

# 1. Backup existing nginx.conf
if [ -f /etc/nginx/sites-available/default ]; then
    echo "Backing up existing default site..."
    sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak
fi

# 2. Overwrite default config with a Redirect
# This catches requests to the IP or any hostname not matching 'trade.aocwinecompany.com'
echo "Updating default Nginx configuration to redirect..."
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    return 301 https://$DOMAIN\$request_uri;
}
EOF

# 3. Ensure it is enabled
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/

# 4. Test and Reload
echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Configuration valid. Reloading Nginx..."
    sudo systemctl reload nginx
    echo "Redirect active: Users visiting via IP will now be sent to https://$DOMAIN"
else
    echo "ERROR: Nginx configuration failed. Restoring backup..."
    if [ -f /etc/nginx/sites-available/default.bak ]; then
        sudo cp /etc/nginx/sites-available/default.bak /etc/nginx/sites-available/default
        sudo systemctl reload nginx
        echo "Backup restored."
    fi
    exit 1
fi
