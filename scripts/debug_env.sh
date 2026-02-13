#!/bin/bash

# Environment Diagnostic Script
# Checks if .env exists and if Node can read it

echo "----------------------------------------------------------------"
echo "Checking for .env file..."
echo "----------------------------------------------------------------"

if [ -f .env ]; then
    echo "SUCCESS: .env file found."
    echo "Content Preview (Masking values):"
    sed 's/=.*/=******/' .env
else
    echo "ERROR: .env file NOT found in $(pwd)"
    ls -la
fi

echo ""
echo "----------------------------------------------------------------"
echo "Checking process environment (via PM2)"
echo "----------------------------------------------------------------"
pm2 describe wine-app | grep "node_env"

echo ""
echo "----------------------------------------------------------------"
echo "Checking compiled app structure"
echo "----------------------------------------------------------------"
ls -F dist/server/server/
