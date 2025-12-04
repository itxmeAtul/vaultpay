import { Module } from "@nestjs/common";
import { MenuItemsService } from "./menu-items.service";
import { ModelsModule } from "src/database/models.module";
import { MenuItemsController } from "./menu-items.controller";

@Module({
  imports: [ModelsModule],
  controllers: [MenuItemsController],
  providers: [MenuItemsService],
})
export class MenuItemsModule {}
