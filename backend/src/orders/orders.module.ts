import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { ModelsModule } from "src/database/models.module";

@Module({
  imports: [ModelsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
