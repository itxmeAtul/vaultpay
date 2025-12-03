import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type MenuCategoryDocument = MenuCategory & Document;

@Schema({ timestamps: true })
export class MenuCategory {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: "Tenant", required: true })
  tenantId: Types.ObjectId;
}

export const MenuCategorySchema = SchemaFactory.createForClass(MenuCategory);
