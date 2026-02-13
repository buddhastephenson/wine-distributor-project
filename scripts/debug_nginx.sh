#!/bin/bash

# Nginx Diagnostic Script

echo "========================================================"
echo " NGINX DIAGNOSTIC REPORT - $(date)"
echo "========================================================"

echo ""
echo "[1] CHECKING SITES ENABLED"
ls -l /etc/nginx/sites-enabled/

echo ""
echo "[2] CONTENT OF 'trade' CONFIG"
if [ -f /etc/nginx/sites-enabled/trade ]; then
    cat /etc/nginx/sites-enabled/trade
else
    echo "ERROR: 'trade' file not found in sites-enabled!"
fi

echo ""
echo "[3] CHECKING CERTIFICATES"
sudo certbot certificates

echo ""
echo "[4] CONNECTIVITY CHECK"
echo "Testing http://trade.aocwinecompany.com (Internal):"
curl -I http://trade.aocwinecompany.com
echo "Testing https://trade.aocwinecompany.com (Internal):"
curl -I https://trade.aocwinecompany.com

echo ""
echo "[5] NGINX ERRORS (Last 30 lines)"
tail -n 30 /var/log/nginx/error.log

echo "========================================================"
echo " END REPORT"
echo "========================================================"
