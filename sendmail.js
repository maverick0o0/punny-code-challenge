// sendmail.js
module.exports = function sendResetEmail(email, token) {
    console.log(`Sending password reset email to ${email} with token ${token}`);
    // Here you would integrate with a real email service like SendGrid, Nodemailer, etc.
};