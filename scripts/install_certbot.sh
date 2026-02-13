#!/bin/bash

# SSL Installation Script
# Installs Certbot and secures the domain

DOMAIN="trade.aocwinecompany.com"

echo "----------------------------------------------------------------"
echo "Installing Certbot and Nginx Plugin..."
echo "----------------------------------------------------------------"

# Update package list
sudo apt-get update

# Install Certbot and Nginx plugin
sudo apt-get install -y certbot python3-certbot-nginx

# Verify installation
if ! command -v certbot &> /dev/null; then
    echo "ERROR: Certbot installation failed."
    exit 1
fi

echo "----------------------------------------------------------------"
echo "Generating SSL Certificate for $DOMAIN..."
echo "----------------------------------------------------------------"

# Run Certbot
# --nginx: Use Nginx plugin
# --non-interactive: Don't ask for input (fails if email needed and not provided, but usually works if registered or using --register-unsafely-without-email)
# We'll use interactive mode essentially by just running it, but for a script, we should be careful.
# Let's try standard command first. User might need to answer prompts.

sudo certbot --nginx -d $DOMAIN --predictable-hook-latency --agree-tos --register-unsafely-without-email

echo "----------------------------------------------------------------"
echo "Reloading Nginx..."
sudo systemctl reload nginx

echo "----------------------------------------------------------------"
echo "SSL Setup Complete! Check https://$DOMAIN"
