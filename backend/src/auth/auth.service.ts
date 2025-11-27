import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/users.schema';
import { Tenant } from '../tenants/tenant.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EmailVerification } from './email-verification.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(EmailVerification.name)
    private verificationModel: Model<EmailVerification>,
    private jwtService: JwtService,
  ) {}

  // 🔐 LOGIN with tenant auto-detect
  async login(username: string, password: string) {
    const user = await this.userModel
      .findOne({ username })
      .populate<{ tenantId: Tenant }>('tenantId');

    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!(await bcrypt.compare(password, user.password)))
      throw new UnauthorizedException('Invalid credentials');

    // ❗ SUPER ADMIN bypass tenant validation
    if (user.role !== 'super-admin') {
      if (!user.tenantId?.active)
        throw new UnauthorizedException('Tenant disabled');

      if (!user.isVerified)
        throw new UnauthorizedException('Please verify your email.');
    }

    const tenantDetails = await this.tenantModel.findById(user.tenantId);
    const payload = {
      sub: user._id,
      tenant: user.tenantId?._id ?? null, // 👈 allow null
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        tenant: tenantDetails?.name,
        tenantId: user.tenantId?._id ?? null,
        email: user.email,
      },
    };
  }

  async verifyEmail(token: string) {
    const record = await this.verificationModel.findOne({ token });
    if (!record) throw new BadRequestException('Invalid or expired token');

    await this.userModel.findByIdAndUpdate(record.userId, { isVerified: true });
    await this.verificationModel.deleteOne({ token });

    return { message: 'Email verified successfully' };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return { valid: true, user: payload };
    } catch {
      return { valid: false };
    }
  }
}
