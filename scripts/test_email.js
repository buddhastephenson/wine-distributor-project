const path = require('path');
// Try to load dotenv from root
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const nodemailer = require('nodemailer');

async function main() {
    console.log('========================================================');
    console.log(' EMAIL DIAGNOSTIC SCRIPT');
    console.log('========================================================');

    console.log('\n[1] Checking Environment Variables');
    if (!process.env.SMTP_USER) {
        console.error('ERROR: SMTP_USER not found in .env');
        console.log('Current loaded env keys:', Object.keys(process.env).filter(k => k.startsWith('SMTP')));
        process.exit(1);
    }

    console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
    console.log(`SMTP Port: ${process.env.SMTP_PORT}`);
    console.log(`SMTP User: ${process.env.SMTP_USER}`);
    console.log(`SMTP Pass: ${process.env.SMTP_PASS ? '****** (Exists)' : 'MISSING'}`);

    console.log('\n[2] Creating Transporter');
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        // Debug options
        logger: true,
        debug: true
    });

    console.log('\n[3] Sending Test Email...');
    console.log(`To: ${process.env.SMTP_USER} (Sending to self)`);

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: process.env.SMTP_USER,
            subject: 'AOC Wines - SMTP Configuration Test',
            text: 'If you are reading this, your server can successfully send emails! \n\n- The Antigravity Agent',
        });

        console.log('\nSUCCESS! Email sent.');
        console.log(`Message ID: ${info.messageId}`);
        console.log('Check your inbox (and spam folder) for the test email.');
    } catch (error) {
        console.error('\nERROR: Failed to send email.');
        console.error('------------------------------------------------');
        console.error(error);
        console.error('------------------------------------------------');

        if (error.code === 'EAUTH') {
            console.log('\nTIP: This is an Authentication Error.');
            console.log('1. Check if your App Password is correct.');
            console.log('2. Ensure 2-Step Verification is ON in Google Account.');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('\nTIP: This is a Timeout Error.');
            console.log('1. Check if the server firewall allows outgoing on port 587.');
            console.log('2. Try using port 465 with secure: true if 587 fails.');
        }
    }

    console.log('\nDone.');
}

main().catch(console.error);
