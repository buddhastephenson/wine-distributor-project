#!/bin/bash

# MongoDB Installation Script for Ubuntu (DigitalOcean Droplet)

echo "Starting MongoDB Installation..."

# Import the public key used by the package management system
sudo apt-get install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor

# Create a list file for MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Reload local package database
sudo apt-get update

# Install the MongoDB packages
sudo apt-get install -y mongodb-org

# Start MongoDB
echo "Starting MongoDB Service..."
sudo systemctl start mongod

# Verify that MongoDB has started successfully
sudo systemctl status mongod --no-pager

# Enable MongoDB to start on system reboot
sudo systemctl enable mongod

echo "MongoDB Installation Complete!"
echo "Now run: node scripts/migrate_to_mongo.js"
