import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { Tenant } from 'src/common/decorators/tenant.decorator';

export class CreateUserDto {
  username: string;
  password: string;
  name: string;
  email: string;
  role: 'super-admin' | 'admin' | 'user';
  product?: string;
  mobileNo: string;
}
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto, @Req() req) {
    return this.userService.createUser(dto, req.user);
  }

  @Get()
  // @UseGuards(TenantGuard, RolesGuard)
  // @RequireRole('admin', 'super-admin')
  getAll(
    @Req() req,
    @Tenant() tenant: string,
    @Query() query: { page?: number; limit?: number; search?: string },
  ) {
    const { page = 1, limit = 10, search = '' } = query;
    return this.userService.getAll(req.user, tenant, {
      page: parseInt(page as any),
      limit: parseInt(limit as any),
      search,
    });
  }

  @Delete('batch')
  deleteMany() {
    return this.userService.deleteMany();
  }
}
