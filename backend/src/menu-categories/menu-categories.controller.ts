import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { MenuCategoriesService } from "./menu-categories.service";
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
} from "./dto/create-menu-category.dto";
import { Tenant } from "../common/decorators/tenant.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("menu-categories")
export class MenuCategoriesController {
  constructor(private readonly menuCategoriesService: MenuCategoriesService) {}

  @Post()
  create(
    @Tenant() tenantId: string,
    @Body() createMenuCategoryDto: CreateMenuCategoryDto
  ) {
    return this.menuCategoriesService.create(tenantId, createMenuCategoryDto);
  }

  @Get()
  findAll(@Tenant() tenantId: string) {
    return this.menuCategoriesService.findAll(tenantId);
  }

  @Get(":id")
  findOne(@Tenant() tenantId: string, @Param("id") id: string) {
    return this.menuCategoriesService.findOne(tenantId, id);
  }

  @Patch(":id")
  update(
    @Tenant() tenantId: string,
    @Param("id") id: string,
    @Body() updateMenuCategoryDto: UpdateMenuCategoryDto
  ) {
    return this.menuCategoriesService.update(
      tenantId,
      id,
      updateMenuCategoryDto
    );
  }

  @Delete(":id")
  remove(@Tenant() tenantId: string, @Param("id") id: string) {
    return this.menuCategoriesService.remove(tenantId, id);
  }
}
