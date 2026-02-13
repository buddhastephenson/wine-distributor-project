module.exports = {
    apps: [{
        name: "wine-app",
        script: "./dist/server/server/app.js",
        node_args: "-r dotenv/config",
        env: {
            NODE_ENV: "production",
            PORT: 3001,
            MONGO_URI: "mongodb://localhost:27017/wine-distributor"
        }
    }]
};
