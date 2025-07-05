"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = exports.sendPasswordResetEmail = exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.CORS_ORIGIN}/verify-email/${token}`;
    const mailOptions = {
        from: `"${process.env.NEXT_PUBLIC_APP_NAME}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Welcome to ${process.env.NEXT_PUBLIC_APP_NAME}!</h2>
        <p style="color: #666; line-height: 1.6;">
          Thank you for registering with us. To complete your registration, please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; line-height: 1.6;">
          If the button doesn't work, you can copy and paste this link into your browser:
        </p>
        <p style="color: #007bff; word-break: break-all;">
          ${verificationUrl}
        </p>
        <p style="color: #666; line-height: 1.6;">
          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated email from ${process.env.NEXT_PUBLIC_APP_NAME}. Please do not reply to this email.
        </p>
      </div>
    `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
    }
    catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.CORS_ORIGIN}/reset-password/${token}`;
    const mailOptions = {
        from: `"${process.env.NEXT_PUBLIC_APP_NAME}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset Your Password',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p style="color: #666; line-height: 1.6;">
          You requested a password reset for your ${process.env.NEXT_PUBLIC_APP_NAME} account. Click the button below to reset your password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; line-height: 1.6;">
          If the button doesn't work, you can copy and paste this link into your browser:
        </p>
        <p style="color: #dc3545; word-break: break-all;">
          ${resetUrl}
        </p>
        <p style="color: #666; line-height: 1.6;">
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated email from ${process.env.NEXT_PUBLIC_APP_NAME}. Please do not reply to this email.
        </p>
      </div>
    `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
    }
    catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendWelcomeEmail = async (email, firstName) => {
    const mailOptions = {
        from: `"${process.env.NEXT_PUBLIC_APP_NAME}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Welcome to Chat App!',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Welcome to ${process.env.NEXT_PUBLIC_APP_NAME}, ${firstName}!</h2>
        <p style="color: #666; line-height: 1.6;">
          Thank you for joining our community! We're excited to have you on board.
        </p>
        <p style="color: #666; line-height: 1.6;">
          Here are some things you can do to get started:
        </p>
        <ul style="color: #666; line-height: 1.6;">
          <li>Complete your profile</li>
          <li>Start a conversation with friends</li>
          <li>Join group chats</li>
          <li>Customize your settings</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CORS_ORIGIN}" 
             style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Get Started
          </a>
        </div>
        <p style="color: #666; line-height: 1.6;">
          If you have any questions or need help, feel free to reach out to our support team.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated email from ${process.env.NEXT_PUBLIC_APP_NAME}. Please do not reply to this email.
        </p>
      </div>
    `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${email}`);
    }
    catch (error) {
        console.error('Error sending welcome email:', error);
    }
};
exports.sendWelcomeEmail = sendWelcomeEmail;
//# sourceMappingURL=emailService.js.map