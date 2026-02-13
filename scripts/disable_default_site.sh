#!/bin/bash

# Disable Default Site Script
# Disables the default Nginx configuration to prevent conflicts

echo "----------------------------------------------------------------"
echo "Check for Default Site..."
echo "----------------------------------------------------------------"

if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "Default site is enabled. Disabling it..."
    sudo unlink /etc/nginx/sites-enabled/default
    
    echo "Testing Nginx configuration..."
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        echo "Reloading Nginx..."
        sudo systemctl reload nginx
        echo "Default site disabled successfully."
    else
        echo "ERROR: Disabling default site caused a configuration error. Re-enabling..."
        sudo ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/
        exit 1
    fi
else
    echo "Default site is already disabled."
fi

echo "----------------------------------------------------------------"
echo "Current Sites Enabled:"
ls -l /etc/nginx/sites-enabled/
