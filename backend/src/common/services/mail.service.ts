import * as dotenv from 'dotenv';
dotenv.config();
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: (process.env.SMTP_PORT || 0) as number,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(email: string, link: string) {
    return this.transporter.sendMail({
      from: `"VaultPay" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify your VaultPay account',
      html: `
        <h2>Email Verification</h2>
        <p>Click the link below to verify your account:</p>
        <a href="${link}">${link}</a>
        <p>This link expires in 1 day.</p>
      `,
    });
  }
}
