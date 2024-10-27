import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { GMAIL_PASS, GMAIL_USER, SUPPORT_EMAIL } from '../utils/config.util';
import { ContactDto } from './dto/create-auth.dto';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER, // Your Gmail email
        pass: GMAIL_PASS, // Your Gmail app password (not your regular Gmail password)
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    
    const verificationUrl = `https://yourfrontend.com/verify-email?token=${token}`;

    const mailOptions = {
      from: GMAIL_USER, // Sender email
      to: email,
      subject: 'Verify your email',
      html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email:</p>
        <a href="${verificationUrl}">Verify Email</a>
      `,
    };

    // try {
    //   await this.transporter.sendMail(mailOptions);
    //   console.log(`Verification email sent to ${email}`);
    // } catch (error) {
    //   console.error('Error sending email:', error);
    //   throw new InternalServerErrorException('Failed to send verification email');
    // }
  }
  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const mailOptions = {
      from: GMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>Use the following token to reset your password. This token will expire in 1 hour:</p>
        <h3>${token}</h3>
        <p>If you didn’t request a password reset, please ignore this email.</p>
      `,
    };

    // try {
    //   await this.transporter.sendMail(mailOptions);
    //   console.log(`Reset password token sent to ${email}`);
    // } catch (error) {
    //   console.error('Error sending reset password email:', error);
    //   throw new InternalServerErrorException('Failed to send reset password token');
    // }
  }
  async sendContactUsEmail(contactDto: ContactDto): Promise<void> {
    const { name, email, subject, description } = contactDto;

    const mailOptions = {
      from: GMAIL_USER, // Sender email
      to: SUPPORT_EMAIL, // Recipient email (support or admin)
      subject: `Contact Us Message: ${subject}`, // Use user's subject in email subject
      html: `
        <h1>New Contact Us Message</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br/>${description}</p>
      `,
    };

    // try {
    //   await this.transporter.sendMail(mailOptions);
    //   console.log(`Contact Us message sent from ${email}`);
    // } catch (error) {
    //   console.error('Error sending Contact Us email:', error);
    //   throw new InternalServerErrorException('Failed to send Contact Us email');
    // }
  }
  
}
