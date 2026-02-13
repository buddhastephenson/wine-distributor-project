#!/bin/bash

# SMTP Connectivity Check
# Tests if the server can physically connect to Gmail's mail servers.
# DigitalOcean often blocks these ports on new accounts.

echo "========================================================"
echo " SMTP PORT CHECK"
echo "========================================================"

echo ""
echo "[1] Testing Port 587 (STARTTLS)..."
# -z: Scan mode (no data)
# -v: Verbose
# -w 5: 5 second timeout
nc -zv -w 5 smtp.gmail.com 587
if [ $? -eq 0 ]; then
    echo ">>> Port 587 is OPEN."
else
    echo ">>> Port 587 is BLOCKED/TIMEOUT."
fi

echo ""
echo "[2] Testing Port 465 (SSL/TLS)..."
nc -zv -w 5 smtp.gmail.com 465
if [ $? -eq 0 ]; then
    echo ">>> Port 465 is OPEN."
else
    echo ">>> Port 465 is BLOCKED/TIMEOUT."
fi

echo ""
echo "[3] Testing Port 2525 (Alternative)..."
# Sometimes used as an alternative, though Gmail usually focuses on 587/465.
nc -zv -w 5 smtp.gmail.com 2525 2>/dev/null
if [ $? -eq 0 ]; then
    echo ">>> Port 2525 is OPEN."
else
    echo ">>> Port 2525 is BLOCKED/TIMEOUT (Expected for Gmail)."
fi

echo "========================================================"
