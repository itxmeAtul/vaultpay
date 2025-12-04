/**
 * Run this once on startup (or as a script) to ensure default templates exist.
 * WARNING: your project must be configured to run Nest/Mongoose to use this directly.
 *
 * Alternatively, call RoleTemplatesService.createManyIfNotExists(...) from AppModule on bootstrap.
 */
import { NestFactory } from "@nestjs/core";
import { AppModule } from "src/app.module";
import { RolesService } from "../src/roles/roles.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const svc = app.get(RolesService);

  const defaults = [
    {
      name: "admin",
      description: "Tenant Admin - full access",
      permissions: {
        users: { read: true, write: true, update: true, delete: true },
        menus: { read: true, write: true, update: true, delete: true },
        categories: { read: true, write: true, update: true, delete: true },
        orders: { read: true, write: true, update: true, delete: true },
        billing: { read: true, write: true },
        kitchen: { read: true, update: true },
        delivery: { read: true },
        settings: { read: true, write: true },
        dashboard: { read: true },
      },
    },
    {
      name: "manager",
      description: "Tenant manager - full access",
      permissions: {
        users: { read: true, write: true, update: true, delete: true },
        menus: { read: true, write: true, update: true, delete: true },
        categories: { read: true, write: true, update: true, delete: true },
        orders: { read: true, write: true, update: true, delete: true },
        billing: { read: true, write: true },
        kitchen: { read: true, update: true },
        delivery: { read: true },
        settings: { read: true, write: true },
        dashboard: { read: true },
      },
    },
    {
      name: "cashier",
      description: "Cashier - billing & orders",
      permissions: {
        billing: { read: true, write: true },
        orders: { read: true, write: true },
        menus: { read: true },
        categories: { read: true },
      },
    },
    {
      name: "chef",
      description: "Chef - kitchen and cooking status",
      permissions: {
        kitchen: { read: true, update: true },
        orders: { read: true, update: true },
      },
    },
    {
      name: "waiter",
      description: "Waiter - create and view orders",
      permissions: {
        orders: { read: true, write: true },
        menus: { read: true },
      },
    },
    {
      name: "delivery-boy",
      description: "Delivery - delivery updates only",
      permissions: {
        delivery: { read: true, update: true },
        orders: { read: true },
      },
    },
  ];

  await svc.createManyIfNotExists(defaults);
  await app.close();
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
