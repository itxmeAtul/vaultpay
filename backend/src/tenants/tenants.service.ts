import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Tenant } from './tenant.schema';
import { Model } from 'mongoose';

@Injectable()
export class TenantService {
  constructor(@InjectModel(Tenant.name) private tenantModel: Model<Tenant>) {}

  async createTenant(data: {
    name: string;
    code: string;
    productType: string;
    logo: string;
    address: string;
  }) {
    const exists = await this.tenantModel.findOne({ code: data.code });
    if (exists) throw new BadRequestException('Tenant already exists');

    if (!data.name || !data.code || !data.productType) {
      throw new BadRequestException('name, code and productType are required');
    }

    return this.tenantModel.create(data);
  }

  findAllTenants() {
    return this.tenantModel.find();
  }

  getOne(id: string) {
    return this.tenantModel.findById(id);
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
