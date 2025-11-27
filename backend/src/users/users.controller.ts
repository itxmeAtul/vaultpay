import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SuperAdminGuard } from 'src/common/gaurds/super-admin.guard';
import { UsersService } from './users.service';
import { TenantGuard } from 'src/common/gaurds/tenant.gaurd';
import { RequireRole } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/gaurds/roles.guard';
import { Tenant } from 'src/common/decorators/tenant.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('create-admin')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, SuperAdminGuard)
  @RequireRole('super-admin')
  createTenantAdmin(
    @Body() body: { username: string; password: string; tenantCode: string },
  ) {
    return this.userService.createTenantAdmin(body);
  }

  @Post('create-user')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @RequireRole('admin')
  createUser(
    @Body()
    body: { username: string; password: string; role: string; email: string },
    @Tenant() tenantId: string,
  ) {
    return this.userService.createUser(body, tenantId);
  }
}
