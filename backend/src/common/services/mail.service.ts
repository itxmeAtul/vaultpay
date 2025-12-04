import * as dotenv from "dotenv";
dotenv.config();
import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";

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
      subject: "Verify your VaultPay account",
      html: `
        <h2>Email Verification</h2>
        <p>Click the link below to verify your account:</p>
        <a href="${link}">${link}</a>
        <p>This link expires in 1 day.</p>
      `,
    });
  }

  async sendPasswordEmail(email: string, username: string, password: string) {
    return this.transporter.sendMail({
      from: `"VaultPay" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your VaultPay temporary credentials",
      html: `
        <h2>Temporary Credentials</h2>
        <p>Your account has been created. Use the credentials below to sign in and change your password immediately:</p>
        <ul>
          <li><strong>Username:</strong> ${username}</li>
          <li><strong>Temporary password:</strong> ${password}</li>
        </ul>
        <p>If you did not request this, please contact support.</p>
      `,
      text: `Your account has been created.\nUsername: ${username}\nTemporary password: ${password}\nPlease sign in and change your password immediately.`,
    });
  }
}
