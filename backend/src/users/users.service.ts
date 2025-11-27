import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './users.schema';
import { Model } from 'mongoose';
import { Tenant } from 'src/tenants/tenant.schema';
import * as bcrypt from 'bcrypt';
import { EmailVerification } from 'src/auth/email-verification.schema';
import { MailService } from 'src/common/services/mail.service';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(EmailVerification.name)
    private verificationModel: Model<EmailVerification>,
    private readonly mailService: MailService,
  ) {}

  async createTenantAdmin(data: {
    username: string;
    password: string;
    tenantCode: string;
  }) {
    const tenant = await this.tenantModel.findOne({ code: data.tenantCode });
    if (!tenant) throw new BadRequestException('Tenant not found');

    const userExists = await this.userModel.findOne({
      username: data.username,
    });
    if (userExists) throw new BadRequestException('User already exists');

    return this.userModel.create({
      username: data.username,
      password: data.password,
      role: 'admin',
      tenantId: tenant._id,
    });
  }

  async createUser(
    data: { username: string; password: string; role: string; email: string },
    tenantId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant not found');

    const userExists = await this.userModel.findOne({
      username: data.username,
    });
    if (userExists) throw new BadRequestException('User already exists');

    const user = await this.userModel.create({
      username: data.username,
      password: data.password,
      email: data.email,
      role: data.role,
      tenantId,
    });

    // 🔐 Create token
    const token = randomBytes(32).toString('hex');
    await this.verificationModel.create({ userId: user._id, token });

    // 🔗 Create verification link
    const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    // 📧 Send email
    await this.mailService.sendVerificationEmail(user.email, link);

    return { message: 'User created, verification email sent' };
  }
}
