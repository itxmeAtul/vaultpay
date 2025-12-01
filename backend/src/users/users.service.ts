import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './users.schema';
import { Model, Types } from 'mongoose';
import { Tenant } from 'src/tenants/tenant.schema';
import * as bcrypt from 'bcrypt';
import { EmailVerification } from 'src/auth/email-verification.schema';
import { MailService } from 'src/common/services/mail.service';
import { randomBytes } from 'crypto';
import { CreateUserDto } from './users.controller';
import { RoleMaster } from 'src/roles/roles.schema';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,

    @InjectModel(RoleMaster.name) private roleModel: Model<RoleMaster>,
    @InjectModel(EmailVerification.name)
    private verificationModel: Model<EmailVerification>,
    private readonly mailService: MailService,
    private rolesService: RolesService,
  ) {}

  async createUser(dto: CreateUserDto, logged: any) {
    console.log(logged, 'ells');
    const userExists = await this.userModel.findOne({
      username: dto.username,
    });

    if (userExists) throw new BadRequestException('User already exists');

    let tenant;
    // super-admin can create tenant admin
    if (logged.role === 'super-admin') {
      const productType = dto.product;
      tenant = await this.tenantModel.findOne({ productType: productType });
    }

    const listOfRoles = await this.roleModel.findOne({ name: dto.role });
    console.log(listOfRoles, tenant, tenant?._id, 'listOfRoles');

    // Generate random 8 character password
    const randomPassword = randomBytes(4).toString('hex').substring(0, 8);

    console.log(randomPassword, 'hashedPassword');
    await this.userModel.create({
      ...dto,
      password: randomPassword,
      tenantId: logged.role === 'super-admin' ? tenant?._id : logged?.tenantId,
      roleMasterId: listOfRoles?._id,
    });

    // TODO: Send password to email via mailService
    // await this.mailService.sendPasswordEmail(user.email, randomPassword);

    // 🔐 Create token
    // const token = randomBytes(32).toString('hex');
    // await this.verificationModel.create({ userId: user._id, token });

    // // 🔗 Create verification link
    // const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    // // 📧 Send email
    // await this.mailService.sendVerificationEmail(user.email, link);

    return { message: 'User created, verification email sent' };
  }
}
