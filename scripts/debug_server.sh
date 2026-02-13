#!/bin/bash

# Server Diagnostic Script
# Run this on the VPS to debug connectivity issues

echo "========================================================"
echo " DIAGNOSTIC REPORT - $(date)"
echo "========================================================"

echo ""
echo "[1] CHECKING NGINX STATUS"
systemctl status nginx --no-pager | grep "Active:"
echo "Configuration Test:"
nginx -t

echo ""
echo "[2] CHECKING PM2 / APP STATUS"
pm2 list
pm2 show 0 | grep "status"

echo ""
echo "[3] CHECKING PORTS"
echo "Listening ports:"
netstat -tulpn | grep -E ':(80|443|3001)'

echo ""
echo "[4] CHECKING LOCAL CONNECTIVITY"
echo "Curl localhost:3001 (App):"
curl -I http://localhost:3001 --max-time 5

echo ""
echo "Curl trade.aocwinecompany.com (Public):"
curl -I https://trade.aocwinecompany.com --resolve trade.aocwinecompany.com:443:127.0.0.1 --max-time 5

echo ""
echo "[5] RECENT NGINX ERRORS"
tail -n 20 /var/log/nginx/error.log

echo ""
echo "[6] RECENT PM2 LOGS"
pm2 logs --lines 20 --nostream

echo "========================================================"
echo " END REPORT"
echo "========================================================"
