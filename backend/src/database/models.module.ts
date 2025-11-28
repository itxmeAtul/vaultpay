import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/users.schema';
import { Tenant, TenantSchema } from '../tenants/tenant.schema';
import {
  EmailVerification,
  EmailVerificationSchema,
} from 'src/auth/email-verification.schema';
import { RoleMaster, RoleMasterSchema } from 'src/roles/roles.schema';
import {
  RoleTemplate,
  RoleTemplateSchema,
} from 'src/roles/role-template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: EmailVerification.name, schema: EmailVerificationSchema },
      { name: RoleMaster.name, schema: RoleMasterSchema },
      { name: RoleTemplate.name, schema: RoleTemplateSchema },
    ]),
  ],
  exports: [MongooseModule], // Export it for reuse across modules
})
export class ModelsModule {}
