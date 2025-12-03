import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type TokenCounterDocument = TokenCounter & Document;

@Schema({ timestamps: true })
export class TokenCounter {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: Types.ObjectId, ref: "Tenant", required: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  counterName: string; // e.g. "Main Kitchen", "Fast Food Counter"

  @Prop({ default: 0 })
  lastToken: number; // increments automatically
}

export const TokenCounterSchema = SchemaFactory.createForClass(TokenCounter);
