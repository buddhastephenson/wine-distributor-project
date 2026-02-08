# Data Migration Guide

Follow these steps to safely export your live data from the DigitalOcean Droplet and import it into your local development environment.

## 1. Export Data (On Server)

Since I cannot connect to the server, you will need to run the export script yourself.

1.  **SSH into your Droplet**:
    ```bash
    ssh root@165.245.132.1
    # OR
    ssh trey.stephenson@gmail.com@165.245.132.1
    ```

2.  **Navigate to the project and pull latest scripts**:
    ```bash
    cd wine-distributor-project
    git pull origin main
    # If not using git, you might need to upload the new scripts/export_data.js manually
    ```
    *(Note: If you haven't pushed the new `scripts/export_data.js` file to GitHub yet, you'll need to do that first from your local machine, or upload it via SCP.)*

3.  **Run the Export Script**:
    ```bash
    node scripts/export_data.js
    ```
    This will create a folder `data/exports/` containing 5 JSON files (`products.json`, `users.json`, etc.).

## 2. Download Data (To Local Machine)

From your **local terminal** (start a new terminal window):

```bash
# Replace [USER] with your SSH username
scp -r root@165.245.132.1:~/wine-distributor-project/data/exports ./data/
```

## 3. Import Data (Local Dev)

Once the files are in your local `data/exports` folder:

1.  **Run the Import Script**:
    ```bash
    node scripts/import_data.js
    ```

2.  **Verify**:
    Check `http://localhost:3000` to see if your live customers and orders are now visible.
