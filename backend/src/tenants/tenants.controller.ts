import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from './tenants.service';
import { SuperAdminGuard } from '../common/gaurds/super-admin.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('tenants')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  create(
    @Body()
    body: {
      name: string;
      code: string;
      productType: string;
      logo: string;
      address: string;
    },
  ) {
    return this.tenantService.createTenant(body);
  }

  @Get()
  findAll() {
    return this.tenantService.findAllTenants();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.tenantService.getOne(id);
  }

  @Patch('disable/:id')
  disable(@Param('id') id: string) {
    return this.tenantService.disableTenant(id);
  }

  @Patch('enable/:id')
  enable(@Param('id') id: string) {
    return this.tenantService.enableTenant(id);
  }
}
