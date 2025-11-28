import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class RoleTemplate extends Document {
  @Prop({ required: true, unique: true })
  name: string; // manager, cashier, chef

  @Prop({ type: Object, required: true })
  permissions: Record<string, any>;
}

export const RoleTemplateSchema = SchemaFactory.createForClass(RoleTemplate);
