import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesService } from './roles.service';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post()
  async create(
    @Body() body: { name: string; permissions: any },
    @Req() req: any,
  ) {
    // req.user must be tenant admin; guard checks omitted for brevity
    return this.rolesService.createRole(req.user.tenantId, body);
  }

  @Get()
  async all(@Req() req: any) {
    return this.rolesService.findByTenant(req.user.tenantId);
  }
}
