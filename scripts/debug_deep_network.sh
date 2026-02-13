#!/bin/bash

# Deep Network Debug Script

echo "========================================================"
echo " NETWORK DIAGNOSTIC REPORT - $(date)"
echo "========================================================"

echo ""
echo "[1] INTERFACE IP ADDRESSES"
ip addr show

echo ""
echo "[2] PUBLIC IP CHECK (What the internet sees)"
curl -s https://api.ipify.org
echo ""

echo ""
echo "[3] LISTENING SOCKETS (Port 80)"
sudo ss -tulpn | grep :80

echo ""
echo "[4] IPTABLES RULES (INPUT Chain)"
sudo iptables -L INPUT -n -v

echo "========================================================"
echo " END REPORT"
echo "========================================================"
