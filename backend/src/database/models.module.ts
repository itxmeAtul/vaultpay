import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../users/users.schema";
import { Tenant, TenantSchema } from "../tenants/tenant.schema";
import {
  EmailVerification,
  EmailVerificationSchema,
} from "src/auth/email-verification.schema";
import { RoleMaster, RoleMasterSchema } from "src/roles/roles.schema";
import {
  RoleTemplate,
  RoleTemplateSchema,
} from "src/roles/role-template.schema";
import {
  MenuItem,
  MenuItemSchema,
} from "src/menu-items/schemas/menu-item.schema";
import { Order, OrderSchema } from "src/orders/schemas/order.schema";
import {
  TokenCounter,
  TokenCounterSchema,
} from "src/token-counters/schemas/token-counter.schema";
import {
  MenuCategory,
  MenuCategorySchema,
} from "src/menu-categories/schemas/menu-category.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: EmailVerification.name, schema: EmailVerificationSchema },
      { name: RoleMaster.name, schema: RoleMasterSchema },
      { name: RoleTemplate.name, schema: RoleTemplateSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: Order.name, schema: OrderSchema },
      { name: TokenCounter.name, schema: TokenCounterSchema },
      { name: MenuCategory.name, schema: MenuCategorySchema },
    ]),
  ],
  exports: [MongooseModule], // Export it for reuse across modules
})
export class ModelsModule {}
