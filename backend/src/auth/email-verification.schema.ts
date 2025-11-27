import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, expires: '1d' }) // ⏳ expires in 1 day
export class EmailVerification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  token: string;
}

export const EmailVerificationSchema =
  SchemaFactory.createForClass(EmailVerification);
