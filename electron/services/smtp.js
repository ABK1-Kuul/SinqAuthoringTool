const nodemailer = require('nodemailer');

/**
 * Test SMTP connection
 */
async function testSmtpConnection(smtpConfig) {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465, // true for 465, false for other ports
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
    });

    // Verify connection
    await transporter.verify();

    return {
      success: true,
      message: 'SMTP connection test successful',
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'SMTP connection test failed',
    };
  }
}

module.exports = {
  testSmtpConnection,
};

