module.exports = {
    apps: [{
        name: "wine-distributor",
        script: "./server.js",
        env: {
            NODE_ENV: "production",
            PORT: 3001,
            MONGO_URI: "mongodb://localhost:27017/wine-distributor"
        }
    }]
};
