import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { MenuItemsService } from "./menu-items.service";
import { CreateMenuItemDto } from "./dto/create-menu-item.dto";
import { UpdateMenuItemDto } from "./dto/update-menu-item.dto";
import { Tenant } from "../common/decorators/tenant.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("menu-items")
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Post()
  create(@Tenant() tenantId: string, @Body() dto: CreateMenuItemDto) {
    return this.menuItemsService.create(tenantId, dto);
  }

  @Get()
  findAll(@Tenant() tenantId: string) {
    return this.menuItemsService.findAll(tenantId);
  }

  @Get(":id")
  findOne(@Tenant() tenantId: string, @Param("id") id: string) {
    return this.menuItemsService.findOne(tenantId, id);
  }

  @Patch(":id")
  update(
    @Tenant() tenantId: string,
    @Param("id") id: string,
    @Body() dto: UpdateMenuItemDto
  ) {
    return this.menuItemsService.update(tenantId, id, dto);
  }

  @Delete(":id")
  remove(@Tenant() tenantId: string, @Param("id") id: string) {
    return this.menuItemsService.remove(tenantId, id);
  }
}
