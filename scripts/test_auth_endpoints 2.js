const http = require('http');

function testEndpoint(path, data) {
    const options = {
        hostname: 'localhost',
        port: 3002,
        path: path,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
        console.log(`${path} STATUS: ${res.statusCode}`);
        res.on('data', (chunk) => { console.log(`${path} BODY: ${chunk}`); });
    });

    req.on('error', (e) => {
        console.error(`${path} ERROR: ${e.message}`);
    });

    req.write(JSON.stringify(data));
    req.end();
}

testEndpoint('/api/auth/reset-password', { token: 'test', password: 'test' });
testEndpoint('/api/auth/forgot-password', { email: 'test@test.com' });
