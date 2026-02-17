const nodemailer = require('nodemailer');

// SMTP configuration from environment variables
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpPass || smtpPass === 'YOUR_APP_PASSWORD_HERE') {
    console.warn('⚠️  WARNING: SMTP Password is not configured in .env file.');
    console.warn('   Email features (registration/forgot password) will not work.');
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: smtpUser,
        pass: smtpPass
    }
});

/**
 * Send a welcome email to a newly registered user
 * @param {string} to - User's email address
 * @param {string} name - User's full name
 */
const sendWelcomeEmail = async (to, name) => {
    const mailOptions = {
        from: `"Astronet Society" <${process.env.SMTP_USER}>`,
        to: to,
        subject: 'Welcome to the Astronet Society! 🌌',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                <div style="background-color: #111; color: #fff; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; color: #a78bfa;">ASTRONET</h1>
                </div>
                <div style="padding: 20px;">
                    <h2 style="color: #4c1d95;">Clear Skies, ${name}!</h2>
                    <p>We're thrilled to have you join our cosmic community. Your account has been successfully created, and you can now access all member features of the Astronet Society.</p>
                    
                    <h3 style="color: #4c1d95;">Next Steps:</h3>
                    <ul>
                        <li><strong>Complete your profile:</strong> Tell us about your interests in astronomy.</li>
                        <li><strong>Join an event:</strong> Check out our upcoming observation nights.</li>
                        <li><strong>Share your shots:</strong> Upload your astrophotography to our gallery.</li>
                    </ul>
                    
                    <p>If you have any questions, feel free to reply to this email or visit our website.</p>
                    

                </div>
                <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #999;">
                    <p>&copy; ${new Date().getFullYear()} Astronet Society. All rights reserved.</p>
                </div>
            </div>
        `
    };

    try {
        console.log(`📧 Attempting to send welcome email to ${to}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendWelcomeEmail
};
