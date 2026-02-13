#!/bin/bash

# Firewall Check Script
# Checks UFW status and ensures Nginx ports are open

echo "----------------------------------------------------------------"
echo "Checking Firewall Status..."
echo "----------------------------------------------------------------"

sudo ufw status verbose

echo ""
echo "----------------------------------------------------------------"
echo "Listing Available Apps..."
echo "----------------------------------------------------------------"
sudo ufw app list

echo ""
echo "----------------------------------------------------------------"
echo "Attempting to Allow Nginx..."
echo "----------------------------------------------------------------"
# Allow standard web ports
sudo ufw allow 'Nginx Full'
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # Ensure SSH doesn't get locked out!

echo ""
echo "----------------------------------------------------------------"
echo "Re-checking Status..."
echo "----------------------------------------------------------------"
sudo ufw status
