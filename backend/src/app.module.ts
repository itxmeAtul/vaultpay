import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { TenantModule } from "./tenants/tenants.module";
import { RolesModule } from "./roles/roles.module";
import { MenuItemsModule } from "./menu-items/menu-items.module";
import { OrdersModule } from './orders/orders.module';
import { TokenCountersModule } from './token-counters/token-counters.module';
import { MenuCategoriesModule } from './menu-categories/menu-categories.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || ""),
    AuthModule,
    UsersModule,
    TenantModule,
    RolesModule,
    MenuItemsModule,
    OrdersModule,
    TokenCountersModule,
    MenuCategoriesModule,
  ],
  controllers: [],
})
export class AppModule {}
