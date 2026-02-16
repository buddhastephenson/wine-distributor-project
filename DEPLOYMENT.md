
# Deployment & Data Persistence Guide

## 1. How to Update the Remote Site
To update your live site on DigitalOcean with the latest changes from GitHub, follow these steps.

### Connect to your Droplet
```bash
ssh root@your-droplet-ip
cd /path/to/wine-distributor-project
```

### Run the Update Commands
Run these commands in order. This will pull the code, rebuild the application, and restart it **without** losing data.

```bash
# 1. Get the latest code
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Rebuild the application (Frontend & Backend)
npm run build

# 4. Restart the server
pm2 restart all
# OR if you are not using pm2 yet:
# pkill -f node
# npm run start:server &
```

---

## 2. Data Persistence & Prevention of Data Loss

### Is my data persistent?
**YES.** Your database (MongoDB) stores data on the server's hard drive (`/var/lib/mongodb` by default). 
- Restarting the app (`pm2 restart`) **does NOT** lose data.
- Restarting the server (rebooting the Droplet) **does NOT** lose data.

### Why did I lose data before?
You likely ran the **Migration Script** (`scripts/migrate_to_mongo.js`) again.

> [!WARNING]
> **NEVER run `node scripts/migrate_to_mongo.js` on a live update.**

**Reason:** 
This script reads from the *static* JSON files in your project folder (`data/persistence/*.json`) and forces them into the database. 
- If you have added new orders or updated products in the App, the database is *newer* than those JSON files.
- Running the script overwrites your live database with the old, stale data from the JSON files.

### How to "Research" (Recover) Lost Data?
If you have already overwritten the data by running the migration script, you can only recover it if:
1. **DigitalOcean Backups** were enabled (you can restore the entire Droplet to a previous point in time).
2. You have a **MongoDB Dump/Backup** that you created manually.

If neither of these exist, the data overwritten by the migration script is likely lost.

### Best Practice for Future
- **Only** handle data through the App (Admin Panel).
- **Never** run "seed" or "migrate" scripts on a production server unless you are setting it up for the very first time.
