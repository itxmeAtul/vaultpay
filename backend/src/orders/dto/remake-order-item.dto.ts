// src/orders/dto/remake-order-item.dto.ts
import { IsMongoId, IsNumber, IsOptional, Min } from "class-validator";

export class RemakeOrderItemDto {
  @IsMongoId()
  originalItemId: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  qty?: number;
}
