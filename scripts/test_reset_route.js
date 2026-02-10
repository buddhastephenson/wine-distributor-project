const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001, // API runs on 3001
    path: '/api/auth/reset-password',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(JSON.stringify({
    token: 'invalid-token',
    password: 'newpassword123'
}));

req.end();
