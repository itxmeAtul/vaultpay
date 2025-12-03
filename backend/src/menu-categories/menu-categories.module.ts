import { Module } from "@nestjs/common";
import { MenuCategoriesController } from "./menu-categories.controller";
import { MenuCategoriesService } from "./menu-categories.service";
import { ModelsModule } from "src/database/models.module";

@Module({
  imports: [ModelsModule],
  controllers: [MenuCategoriesController],
  providers: [MenuCategoriesService],
})
export class MenuCategoriesModule {}
