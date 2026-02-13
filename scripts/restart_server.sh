#!/bin/bash

# Force Restart Script (Updated for .env)
# Installs dotenv and forces it to load before the app starts

echo "----------------------------------------------------------------"
echo "Stopping existing processes..."
pm2 delete all || true

echo "----------------------------------------------------------------"
echo "Installing dotenv..."
npm install dotenv --legacy-peer-deps

echo "----------------------------------------------------------------"
echo "Rebuilding the application..."
npm run build

echo "----------------------------------------------------------------"
echo "Check for .env..."
if [ -f .env ]; then
    echo ".env file found."
else
    echo "WARNING: .env file not found! Email will fail."
fi

echo "----------------------------------------------------------------"
echo "Starting application with PM2 (Forcing .env load)..."
# We updated ecosystem.config.js to use node_args: "-r dotenv/config"
pm2 start ecosystem.config.js
pm2 save

echo "----------------------------------------------------------------"
echo "Waiting 5 seconds for startup..."
sleep 5

echo "----------------------------------------------------------------"
echo "Verifying..."
pm2 logs wine-app --lines 20 --nostream
