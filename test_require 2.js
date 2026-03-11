try {
    const authService = require('./src/server/services/AuthService').default;
    console.log('AuthService keys:', Object.keys(authService || {}));
    console.log('quickCreateCustomer exists:', typeof authService.quickCreateCustomer);
} catch (e) {
    console.error('Require failed:', e);
}
