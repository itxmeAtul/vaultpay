import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Tenant } from './tenant.schema';
import { Model } from 'mongoose';

@Injectable()
export class TenantService {
  constructor(@InjectModel(Tenant.name) private tenantModel: Model<Tenant>) {}

  async createTenant(data: { name: string; code: string }) {
    const exists = await this.tenantModel.findOne({ code: data.code });
    if (exists) throw new BadRequestException('Tenant already exists');
    return this.tenantModel.create(data);
  }

  findAllTenants() {
    return this.tenantModel.find();
  }

  disableTenant(id: string) {
    return this.tenantModel.findByIdAndUpdate(
      id,
      { active: false },
      { new: true },
    );
  }

  enableTenant(id: string) {
    return this.tenantModel.findByIdAndUpdate(
      id,
      { active: true },
      { new: true },
    );
  }
}
