const nodemailer = require('nodemailer');
const cors = require('cors');

// Initialize CORS middleware
const corsMiddleware = cors({
  origin: process.env.VERCEL_URL || 'http://localhost:3000',
  methods: ['POST'],
  credentials: true
});

// Create email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Validate request body
function validateRequest(body) {
  const { name, email, subject, message, csrf_token, website_url } = body;

  // Check honeypot
  if (website_url) {
    return { valid: false, error: 'Bot detected' };
  }

  // Basic validation
  if (!name || !email || !subject || !message || !csrf_token) {
    return { valid: false, error: 'All fields are required' };
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email address' };
  }

  return { valid: true };
}

module.exports = async (req, res) => {
  // Handle CORS
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validation = validateRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { name, email, subject, message } = req.body;

    // Email to company
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'innovxtechnologies@gmail.com',
      subject: `Contact Form: ${subject}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Auto-reply to sender
    const autoReplyOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting InnovX Technologies',
      html: `
        <h3>Thank you for reaching out to InnovX Technologies!</h3>
        <p>Dear ${name},</p>
        <p>We have received your message and appreciate you contacting us. Our team will review your inquiry and get back to you within 24-48 hours.</p>
        <p>For urgent matters, please contact us directly at +91-9128628294.</p>
        <br>
        <p>Best Regards,</p>
        <p>InnovX Technologies Team</p>
      `
    };

    await transporter.sendMail(autoReplyOptions);

    return res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}; 