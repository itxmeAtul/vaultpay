import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { SuperAdminGuard } from "src/common/gaurds/super-admin.guard";
import { UsersService } from "./users.service";
import { TenantGuard } from "src/common/gaurds/tenant.gaurd";
import { RequireRole } from "src/common/decorators/roles.decorator";
import { RolesGuard } from "src/common/gaurds/roles.guard";
import { Tenant } from "src/common/decorators/tenant.decorator";

export class CreateUserDto {
  username: string;
  password: string;
  name: string;
  email: string;
  role: "super-admin" | "admin" | "user";
  product?: string;
  mobileNo: string;
}
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto, @Req() req) {
    return this.userService.createUser(dto, req.user);
  }

  // @Get()
  // getAll(@Req() req) {
  //   return this.userService.getAll(req.user);
  // }
}
