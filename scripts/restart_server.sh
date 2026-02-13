#!/bin/bash

# Force Restart Script (Updated)
# Use this to ensure the app is rebuilt and restarted correctly with the right config.

echo "----------------------------------------------------------------"
echo "Stopping and deleting existing processes (to flush old config)..."
pm2 delete all || true

echo "----------------------------------------------------------------"
echo "installing dependencies..."
npm install --legacy-peer-deps

echo "----------------------------------------------------------------"
echo "Rebuilding the application..."
npm run build

echo "----------------------------------------------------------------"
echo "Starting application with PM2 (using ecosystem.config.js)..."
pm2 start ecosystem.config.js
pm2 save

echo "----------------------------------------------------------------"
echo "Waiting 5 seconds for startup..."
sleep 5

echo "----------------------------------------------------------------"
echo "Verifying connectivity..."
curl -I http://localhost:3001

if [ $? -eq 0 ]; then
    echo "SUCCESS: App is running and listening on port 3001."
else
    echo "WARNING: App started but is not responding on port 3001."
    echo "Checking logs..."
    pm2 logs --lines 20 --nostream
fi
