const http = require('http');

function testUpdatePassword(id, password) {
    const options = {
        hostname: 'localhost',
        port: 3002,
        path: `/api/users/user-trey-id/password`, // Need real ID?
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
    };

    // Need to authenticate first... complex.
    // Easier to use browser agent to log in as Admin Rep and change Trey's password.
}
// Switching to browser agent verification.
