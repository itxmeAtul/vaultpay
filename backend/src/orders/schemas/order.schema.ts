// src/orders/schemas/order.schema.ts
import mongoose, {
  Document,
  HydratedDocument,
  Schema as MongooseSchema,
  Types,
} from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BusinessType } from "src/tenants/tenant.schema";

export type OrderDocument = HydratedDocument<Order>;

/* Enums */
export enum OrderItemStatus {
  PENDING = "pending",
  IN_PROGRESS = "in-progress",
  PARTIAL_COOKED = "partial-cooked",
  COOKED = "cooked",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  DELIVERED = "delivered",
}

export enum OrderStatus {
  PENDING = "pending",
  PARTIAL_PENDING = "partial-pending",
  READY = "ready",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

/* ---------- TypeScript shapes (for dev ergonomics) ---------- */
/* Keep these as plain TS classes/interfaces; the actual Mongoose schemas are below. */

export class RestaurantOrderItem {
  _id?: Types.ObjectId;
  menuItemId!: Types.ObjectId;
  qty!: number;
  price!: number;
  variant?: string;
  total!: number;
  status!: OrderItemStatus;
  preparedQty!: number;
  parentItemId?: Types.ObjectId;
}

export class RetailOrderItem {
  _id?: Types.ObjectId;
  productId!: Types.ObjectId;
  sku?: string;
  qty!: number;
  unitPrice!: number;
  total!: number;
  warehouseId?: Types.ObjectId;
  expectedDeliveryDate?: Date;
}

export class ServiceOrderItem {
  _id?: Types.ObjectId;
  serviceId!: Types.ObjectId;
  serviceName!: string;
  durationMinutes!: number;
  price!: number;
  total!: number;
  assignedProviderId?: Types.ObjectId;
  scheduledTime?: Date;
  status?: "pending" | "assigned" | "in-progress" | "completed" | "cancelled";
}

export class EcommerceOrderItem {
  _id?: Types.ObjectId;
  productId!: Types.ObjectId;
  variantId?: Types.ObjectId;
  qty!: number;
  price!: number;
  total!: number;
  shippingMethod?: string;
  trackingNumber?: string;
}

/* Union type used by TS code (items are stored as subdocuments with direct fields) */
export type DynamicOrderItem =
  | RestaurantOrderItem
  | RetailOrderItem
  | ServiceOrderItem
  | EcommerceOrderItem;

/* ---------- Order document ---------- */
@Schema({ discriminatorKey: "businessType", timestamps: true })
export class Order {
  _id!: Types.ObjectId;
  createdAt!: Date;
  updatedAt!: Date;

  @Prop({ type: Types.ObjectId, ref: "Tenant", required: true })
  tenantId!: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(BusinessType), required: true })
  businessType!: BusinessType;

  @Prop({ required: true, unique: true })
  orderNumber!: string;

  @Prop({ enum: Object.values(OrderStatus), default: OrderStatus.PENDING })
  status!: OrderStatus;

  // NOTE: we don't use @Prop({ type: [Object] }) here.
  // We'll add a real DocumentArray for items below.
  items!: DynamicOrderItem[];

  @Prop({ enum: ["cod", "online", "wallet"], default: "cod" })
  paymentMode!: string;

  @Prop({ default: false })
  isPaid!: boolean;

  @Prop({ default: 0 })
  grandTotal!: number;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: "TokenCounter", required: false })
  counterId?: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

/* ---------- Create sub-schemas (mongoose.Schema) for embedded discriminators ---------- */
const RestaurantOrderItemSchema = new MongooseSchema(
  {
    menuItemId: { type: Types.ObjectId, ref: "MenuItem", required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    variant: { type: String },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(OrderItemStatus),
      default: OrderItemStatus.PENDING,
    },
    preparedQty: { type: Number, default: 0 },
    parentItemId: { type: Types.ObjectId, ref: "OrderItem" },
  },
  { _id: true }
);

const RetailOrderItemSchema = new MongooseSchema(
  {
    productId: { type: Types.ObjectId, ref: "Product", required: true },
    sku: { type: String },
    qty: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
    warehouseId: { type: Types.ObjectId, ref: "Warehouse" },
    expectedDeliveryDate: { type: Date },
  },
  { _id: true }
);

const ServiceOrderItemSchema = new MongooseSchema(
  {
    serviceId: { type: Types.ObjectId, ref: "Service", required: true },
    serviceName: { type: String, required: true },
    durationMinutes: { type: Number },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
    assignedProviderId: { type: Types.ObjectId, ref: "User" },
    scheduledTime: { type: Date },
    status: { type: String, default: "pending" },
  },
  { _id: true }
);

const EcommerceOrderItemSchema = new MongooseSchema(
  {
    productId: { type: Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Types.ObjectId, ref: "ProductVariant" },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
    shippingMethod: { type: String },
    trackingNumber: { type: String },
  },
  { _id: true }
);

/* ---------- IMPORTANT: create a base sub-schema and add it as items DocumentArray ---------- */
/* The base item makes the items path a DocumentArray, which is required for embedded discriminators */
const BaseItemSchema = new MongooseSchema(
  {
    type: { type: String, required: true },
  },
  { _id: true, discriminatorKey: "type" }
);

// Attach the items document array to the OrderSchema (makes it a proper DocumentArray)
(OrderSchema as any).add({
  items: { type: [BaseItemSchema], default: [] },
});

// Now register embedded discriminators on the items DocumentArray.
// TypeScript may not expose `.discriminator` on the path type, so cast to `any`.
(OrderSchema.path("items") as any).discriminator(
  BusinessType.RESTAURANT,
  RestaurantOrderItemSchema
);
(OrderSchema.path("items") as any).discriminator(
  BusinessType.RETAIL,
  RetailOrderItemSchema
);
(OrderSchema.path("items") as any).discriminator(
  BusinessType.SERVICE,
  ServiceOrderItemSchema
);
(OrderSchema.path("items") as any).discriminator(
  BusinessType.ECOMMERCE,
  EcommerceOrderItemSchema
);

/* Optional: indexes */
OrderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });

export default OrderSchema;
