import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RoleMaster } from './roles.schema';
import { Model, Types } from 'mongoose';
import { RoleTemplate } from './role-template.schema';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(RoleMaster.name)
    private roleModel: Model<RoleMaster>,
    @InjectModel(RoleTemplate.name)
    private roleTemplateModel: Model<RoleTemplate>,
  ) {}

  getAllTemplates() {
    return this.roleTemplateModel.find();
  }

  // Tenant-scoped role creation (tenant-admin only allowed)
  async createRole(
    tenantId: Types.ObjectId,
    data: { name: string; permissions: any; description?: string },
  ) {
    return this.roleModel.create({ ...data, tenantId });
  }

  findAll() {
    return this.roleModel.find().lean().exec();
  }

  findByName(name: string) {
    return this.roleModel.findOne({ name }).lean().exec();
  }

  findByTenant(tenantId: Types.ObjectId) {
    return this.roleModel.find({ tenantId }).lean().exec();
  }

  findOneByTenantAndName(tenantId: Types.ObjectId, name: string) {
    return this.roleModel.findOne({ tenantId, name }).exec();
  }

  async cloneTemplatesToTenant(
    tenantId: Types.ObjectId,
    templates: { name: string; permissions: any; description?: string }[],
  ) {
    const created: RoleMaster[] = [];
    for (const t of templates) {
      // do not blindly create duplicates: check by name + tenant
      const exists = await this.roleModel
        .findOne({ tenantId, name: t.name })
        .exec();
      if (exists) {
        created.push(exists);
        continue;
      }
      const doc = await this.roleModel.create({
        tenantId,
        name: t.name,
        permissions: t.permissions,
        description: t.description || '',
      });
      created.push(doc);
    }
    return created;
  }

  async createManyIfNotExists(templates: Partial<RoleMaster>[]) {
    for (const t of templates) {
      const exists = await this.roleTemplateModel.findOne({ name: t.name }).exec();
      if (!exists) await this.roleTemplateModel.create(t);
    }
  }
}
