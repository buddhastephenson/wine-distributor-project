import AuthService from '../src/server/services/AuthService';
import mongoose from 'mongoose';

console.log('Successfully imported AuthService');

async function test() {
    try {
        console.log('AuthService:', AuthService);
        // DB Connection needed for some methods? 
        // AuthService constructor doesn't connect to DB, but it uses User model.
        // User model uses mongoose.

        console.log('Test Complete');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

test();
