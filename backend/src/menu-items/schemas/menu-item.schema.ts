import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type MenuItemDocument = MenuItem & Document;

class MenuItemVariant {
  size: string; // small, medium, large
  price: number;
}

@Schema({ timestamps: true })
export class MenuItem {
  _id: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: "Tenant", required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "MenuCategory" })
  categoryId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  basePrice: number;

  @Prop({ type: [MenuItemVariant], default: [] })
  variants: MenuItemVariant[];
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
