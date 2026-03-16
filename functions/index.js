const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

// IONOS SMTP Configuration
// Get config from Firebase (set via: firebase functions:config:set)
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  
  try {
    const config = functions.config();
    console.log('Config loaded:', { 
      hasIonos: !!config.ionos,
      hasHost: !!config.ionos?.smtp_host,
      hasUser: !!config.ionos?.smtp_user,
      hasPass: !!config.ionos?.smtp_pass 
    });
    
    transporter = nodemailer.createTransport({
      host: config.ionos?.smtp_host || 'smtp.ionos.co.uk',
      port: Number(config.ionos?.smtp_port || 587),
      secure: false, // TLS
      auth: {
        user: config.ionos?.smtp_user || 'escape@spiritsbarandgames.com',
        pass: config.ionos?.smtp_pass || '',
      },
    });
    return transporter;
  } catch (error) {
    console.error('Error creating transporter:', error);
    throw error;
  }
}

exports.sendEscapePhoto = functions.https.onCall(async (data, context) => {
  console.log('sendEscapePhoto called with data:', {
    hasPhoto: !!data.photoBase64,
    hasEmail: !!data.customerEmail,
    teamName: data.teamName,
    roomName: data.roomName
  });

  try {
    const {
      photoBase64, // "data:image/jpeg;base64,...."
      teamName,
      roomName,
      escapeTime,
      customerEmail,
    } = data;

    // Validate required fields
    if (!customerEmail || !photoBase64) {
      console.error('Missing required fields:', { customerEmail: !!customerEmail, photoBase64: !!photoBase64 });
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing customer email or photo'
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      console.error('Invalid email format:', customerEmail);
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid email address'
      );
    }

    console.log('Creating transporter...');
    const emailTransporter = getTransporter();
    const config = functions.config();
    
    console.log('Converting image...');
    // Convert base64 to buffer
    const base64Data = photoBase64.includes(',') ? photoBase64.split(',')[1] : photoBase64;
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const cid = 'escape-photo@inline';

    // HTML email body
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thanks for escaping "${roomName}"!</h2>
        <p><strong>Team:</strong> ${teamName}</p>
        <p><strong>Escape Time:</strong> ${escapeTime}</p>
        <p>Here's your escape room photo – feel free to share it!</p>
        <img src="cid:${cid}" style="max-width: 100%; border-radius: 8px; margin-top: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          Thanks for playing at Spirits Bar and Games!
        </p>
      </div>
    `;

    console.log('Sending email to:', customerEmail);
    // Send email
    const result = await emailTransporter.sendMail({
      from: config.ionos?.smtp_user || 'escape@spiritsbarandgames.com',
      to: customerEmail,
      subject: `Your Escape Room Photo – ${roomName}`,
      html: htmlBody,
      attachments: [
        {
          filename: `escape-${teamName.replace(/\s+/g, '-')}.jpg`,
          content: imageBuffer,
          cid, // Inline image in HTML
        },
      ],
    });

    console.log('Email sent successfully:', result.messageId);
    return { success: true, message: 'Email sent successfully', messageId: result.messageId };
  } catch (error) {
    console.error('Error in sendEscapePhoto:', error);
    console.error('Error stack:', error.stack);
    // If it's already an HttpsError, re-throw it
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    // Otherwise, wrap it with more details
    throw new functions.https.HttpsError(
      'internal',
      `Failed to send email: ${error.message || 'Unknown error'}`
    );
  }
});
