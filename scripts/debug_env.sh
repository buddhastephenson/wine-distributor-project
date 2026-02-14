#root@ubuntu-s-1vcpu-1gb-35gb-intel-atl1-01:~/wine-distributor-project# git pull
chmod +x scripts/debug_env.sh
sudo ./scripts/debug_env.sh
remote: Enumerating objects: 6, done.
remote: Counting objects: 100% (6/6), done.
remote: Compressing objects: 100% (2/2), done.
remote: Total 4 (delta 2), reused 4 (delta 2), pack-reused 0 (from 0)
Unpacking objects: 100% (4/4), 642 bytes | 160.00 KiB/s, done.
From https://github.com/buddhastephenson/wine-distributor-project
   fbce326..53fbe46  main       -> origin/main
Updating fbce326..53fbe46
Fast-forward
 scripts/debug_env.sh | 29 +++++++++++++++++++++++++++++
 1 file changed, 29 insertions(+)
 create mode 100755 scripts/debug_env.sh
----------------------------------------------------------------
Checking for .env file...
----------------------------------------------------------------
SUCCESS: .env file found.
Content Preview (Masking values):
PORT=******
NODE_ENV=******
PUBLIC_URL=******
MONGO_URI=******

# Email Settings
SMTP_HOST=******
SMTP_PORT=******
SMTP_USER=******
SMTP_PASS=******


----------------------------------------------------------------
Checking process environment (via PM2)
----------------------------------------------------------------

----------------------------------------------------------------
Checking compiled app structure
----------------------------------------------------------------
app.js  controllers/  middleware/  models/  routes/  services/  utils/
root@ubuntu-s-1vcpu-1gb-35gb-intel-atl1-01:~/wine-distributor-project# !/bin/bash

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
