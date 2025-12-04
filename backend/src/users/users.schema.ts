import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  mobileNo: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  role: string;

  @Prop({ type: Types.ObjectId, ref: 'RoleMaster' })
  roleMasterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenantId: Types.ObjectId;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false, type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ default: false })
  updatedBy: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Encrypt password automatically
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});
