#!/bin/bash

# Subdomain Setup Script for wishlist.aocwinecompany.com
DOMAIN="wishlist.aocwinecompany.com"
APP_PORT=3001

echo "----------------------------------------------------------------"
echo "Setting up Nginx for $DOMAIN on port $APP_PORT..."
echo "----------------------------------------------------------------"

# 1. Create Nginx Config
echo "Creating Nginx configuration file..."
sudo tee /etc/nginx/sites-available/wishlist > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 2. Enable Site
echo "Enabling the site..."
sudo ln -sf /etc/nginx/sites-available/wishlist /etc/nginx/sites-enabled/

# 3. Test and Reload
echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Configuration valid. Reloading Nginx..."
    sudo systemctl reload nginx
    echo "Nginx reloaded successfully."
else
    echo "ERROR: Nginx configuration failed. Please check the output above."
    exit 1
fi

# 4. SSL Setup
echo "----------------------------------------------------------------"
echo "Setting up SSL with Certbot..."
echo "----------------------------------------------------------------"
sudo certbot --nginx -d $DOMAIN

echo "----------------------------------------------------------------"
echo "Setup Complete! accessing https://$DOMAIN should now work."
echo "----------------------------------------------------------------"
