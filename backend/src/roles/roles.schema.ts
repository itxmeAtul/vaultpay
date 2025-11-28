import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RoleMaster extends Document {
  @Prop({ required: true })
  name: string; // cashier, chef, manager, delivery-boy

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Object, required: true })
  permissions: Record<string, any>;

  @Prop({ default: '' })
  description: string;
}
export const RoleMasterSchema = SchemaFactory.createForClass(RoleMaster);
