import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Tenant extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  code: string; // bank code like HDFC, ICICI, AXIS

  @Prop({ default: true })
  active: boolean;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
