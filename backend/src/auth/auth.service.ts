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
import { RoleMaster } from '../roles/roles.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(RoleMaster.name) private roleModel: Model<RoleMaster>,
    @InjectModel(EmailVerification.name)
    private verificationModel: Model<EmailVerification>,
    private jwtService: JwtService,
  ) {}

  // 🔐 LOGIN with tenant auto-detect
  async login(username: string, password: string) {
    const user = await this.userModel
      .findOne({ username })
      .populate<{ tenantId: Tenant }>('tenantId');

    if (!user) throw new UnauthorizedException('User not found in  system...!');

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

    const newRefreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET },
    );

    const roleMasterDtls = await this.roleModel.findById(
      user.roleMasterId?._id,
    );

    const payload = {
      sub: user._id,
      tenant: user.tenantId?._id ?? null, // 👈 allow null
      role: user.role,
      roleMaster: roleMasterDtls?.name,
      permissions: roleMasterDtls?.permissions || {},
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: newRefreshToken,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        tenant: tenantDetails?.name,
        tenantId: user.tenantId?._id ?? null,
        email: user.email,
        name: user.name,
        mobileNo: user.mobileNo,
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

  async refresh(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user) throw new UnauthorizedException('User not found');

      // Create new tokens
      const accessToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email },
        { expiresIn: '15m', secret: process.env.JWT_SECRET },
      );

      const newRefreshToken = await this.jwtService.signAsync(
        { sub: user.id },
        { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET },
      );
      const tenantDetails = await this.tenantModel.findById(user.tenantId);
      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,

        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          tenant: tenantDetails?.name,
          tenantId: user.tenantId?._id ?? null,
          email: user.email,
          name: user.name,
          mobileNo: user.mobileNo,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
