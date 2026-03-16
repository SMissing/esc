const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

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

exports.sendEscapePhoto = functions
  .region('us-central1')
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    // Handle CORS preflight request
    return cors(req, res, async () => {
      // Handle OPTIONS preflight request
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      // Only allow POST requests
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      console.log('sendEscapePhoto called');
      console.log('Request method:', req.method);
      console.log('Content-Type:', req.get('Content-Type'));
      console.log('Raw body type:', typeof req.body);
      console.log('Raw body:', req.body);
      
      // Parse body if it's a string (sometimes Firebase doesn't auto-parse)
      let data = req.body;
      if (typeof req.body === 'string') {
        try {
          data = JSON.parse(req.body);
        } catch (e) {
          console.error('Failed to parse JSON body:', e);
          return res.status(400).json({ 
            error: 'invalid-argument',
            message: 'Invalid JSON in request body'
          });
        }
      }
      
      console.log('Parsed data:', {
        hasPhoto: !!data?.photoBase64,
        hasEmail: !!data?.customerEmail,
        teamName: data?.teamName,
        roomName: data?.roomName,
        escapeTime: data?.escapeTime
      });

      try {
        // Validate required fields with detailed logging
        if (!data) {
          console.error('No data received in request body');
          return res.status(400).json({ 
            error: 'invalid-argument',
            message: 'No data received in request body'
          });
        }

        if (!data.customerEmail) {
          console.error('Missing customerEmail field. Data keys:', Object.keys(data));
          return res.status(400).json({ 
            error: 'invalid-argument',
            message: 'Missing customer email field'
          });
        }

        if (!data.photoBase64) {
          console.error('Missing photoBase64 field. Data keys:', Object.keys(data));
          return res.status(400).json({ 
            error: 'invalid-argument',
            message: 'Missing photo data'
          });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.customerEmail)) {
          console.error('Invalid email format:', data.customerEmail);
          return res.status(400).json({ 
            error: 'invalid-argument',
            message: 'Invalid email address'
          });
        }

        const {
          photoBase64,
          teamName,
          roomName,
          escapeTime,
          customerEmail,
        } = data;

        console.log('Creating transporter...');
        const emailTransporter = getTransporter();
        const config = functions.config();
        
        console.log('Converting image...');
        const base64Data = photoBase64.includes(',') ? photoBase64.split(',')[1] : photoBase64;
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const cid = 'escape-photo@inline';

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
        // Send email directly without verification to avoid timeout
        const result = await emailTransporter.sendMail({
          from: config.ionos?.smtp_user || 'escape@spiritsbarandgames.com',
          to: customerEmail,
          subject: `Your Escape Room Photo – ${roomName}`,
          html: htmlBody,
          attachments: [
            {
              filename: `escape-${teamName.replace(/\s+/g, '-')}.jpg`,
              content: imageBuffer,
              cid,
            },
          ],
        });

        console.log('Email sent successfully:', result.messageId);
        return res.status(200).json({ 
          success: true, 
          message: 'Email sent successfully', 
          messageId: result.messageId 
        });
      } catch (error) {
        console.error('Error in sendEscapePhoto:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        if (error.response) {
          console.error('Error response:', error.response);
          console.error('Error responseCode:', error.responseCode);
        }
        console.error('Error stack:', error.stack);
        
        // Provide more detailed error message
        const errorMessage = error.response 
          ? `SMTP Error ${error.responseCode || ''}: ${error.response}`
          : error.message || 'Unknown error';
        return res.status(500).json({ 
          error: 'internal',
          message: `Failed to send email: ${errorMessage}`
        });
      }
    });
  });
