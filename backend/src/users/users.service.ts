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
    // super-admin can create tenant admin
    console.log(logged,"rolsl")
    if (logged.role !== 'super-admin') {
      throw new ForbiddenException('Only super-admin can create tenant admins');
    }
    const userExists = await this.userModel.findOne({
      username: dto.username,
    });

    if (userExists) throw new BadRequestException('User already exists');

    const user = await this.userModel.create({
      ...dto,
      tenantId: logged?.tenantId ?? "69298389b15e02617aa87048",
    });

    // If created user is tenant admin:
    if (dto.role === 'admin') {
      await this.setupTenantRolesForAdmin(user);
    }

    // 🔐 Create token
    const token = randomBytes(32).toString('hex');
    await this.verificationModel.create({ userId: user._id, token });

    // 🔗 Create verification link
    const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    // 📧 Send email
    await this.mailService.sendVerificationEmail(user.email, link);

    return { message: 'User created, verification email sent' };
  }

  async setupTenantRolesForAdmin(user: User) {
    const templates = await this.rolesService.getAllTemplates();

    let managerRoleMasterId: Types.ObjectId | null = null;

    // clone templates to tenant roles
    for (const t of templates) {
      const newRole = await this.rolesService.createRole(user.tenantId, {
        name: t.name,
        permissions: t.permissions,
      });

      if (t.name === 'manager') {
        managerRoleMasterId = newRole._id;
      }
    }

    if (managerRoleMasterId) {
      user.roleMasterId = managerRoleMasterId;
      await user.save();
    }
  }
}
