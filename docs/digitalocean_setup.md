# DigitalOcean Droplet Setup & Deployment Guide

## 1. Create a Droplet
1.  **Log in** to your DigitalOcean account.
2.  Click **Create** -> **Droplets**.
3.  **Choose Region**: Select the datacenter closest to your primary users (e.g., New York, San Francisco).
4.  **Choose Image**: Select the latest **Ubuntu LTS** (e.g., 22.04 LTS or 24.04 LTS).
5.  **Choose Size**:
    *   **Shared CPU (Basic)** is sufficient for this app.
    *   **Regular** disk type.
    *   **$4/month (512MB RAM)** or **$6/month (1GB RAM)** is usually enough for a small NodeJS app, but given the build process, **1GB RAM** is safer to avoid out-of-memory errors during `npm run build`.
6.  **Authentication Method**: **SSH Key** is recommended for security. If you haven't set one up, you can choose **Password** (you will be emailed the root password), but be sure to create a complex one.
7.  **Hostname**: Give it a recognizable name (e.g., `wine-distributor-prod`).
8.  Click **Create Droplet**.

## 2. Initial Server Setup
Once the Droplet is created, copy its **IP Address**.

### Connect to the Server
Open your terminal and run:
```bash
ssh root@<YOUR_DROPLET_IP>
```
*(If using a password, enter it when prompted).*

### Create a Non-Root User (Recommended)
It is best practice to not run your app as `root`.
```bash
# Create user 'web' (or any name you prefer)
adduser web

# Grant sudo privileges
usermod -aG sudo web

# Switch to the new user
su - web
```

## 3. Install Node.js & Dependencies
We will use `nvm` (Node Version Manager) to install the correct Node.js version.

```bash
# Install curl
sudo apt update
sudo apt install curl -y

# Install nvm (check https://github.com/nvm-sh/nvm for latest version)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Activate nvm
source ~/.bashrc

# Install Node.js (matches your local environment, e.g., 18 or 20)
nvm install 20
nvm use 20

# Verify installation
node -v
npm -v
```

## 4. Deploy the Application
You can verify the code by cloning from git (if you have a repo) or copying files directly. Since this is a local project, **copying files** via `scp` or `rsync` is easiest if you haven't pushed to GitHub yet.

### Option A: If you have a GitHub Repo
```bash
git clone https://github.com/yourusername/wine-distributor-project.git
cd wine-distributor-project
npm install
```

### Option B: Copying files from your Local Machine
Run this from your **Local Terminal** (not the server):
```bash
# Make sure you are in the project root
# Exclude node_modules and build to save time (we will rebuild on server)
rsync -avz --exclude 'node_modules' --exclude 'build' --exclude '.git' ./ web@<YOUR_DROPLET_IP>:~/wine-distributor-project
```

Then, back on the **Server**:
```bash
cd ~/wine-distributor-project
npm install
```

## 5. Build and Start
On the **Server** (inside `~/wine-distributor-project`):

1.  **Build the Frontend**:
    ```bash
    npm run build
    ```
    *Note: This creates the `build/` directory which the server serves.*

2.  **Install PM2 (Process Manager)**:
    PM2 keeps your app running in the background and restarts it if it crashes.
    ```bash
    npm install -g pm2
    ```

3.  **Start the Server**:
    ```bash
    pm2 start server.js --name "wine-app"
    ```

4.  **Save Process List**:
    ```bash
    pm2 save
    ```

5.  **Setup Startup Script** (so it starts after reboot):
    ```bash
    pm2 startup
    # Copy/Paste the command PM2 provides in the output
    ```

## 6. Firewall Setup
Allow traffic to your application port (default 3001) or setup port forwarding.

For development/testing (easiest):
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
```

Now you can visit: `http://<YOUR_DROPLET_IP>:3001`

*(For a production-grade URL like `http://example.com`, you would start Nginx and proxy port 80 to 3001).*
