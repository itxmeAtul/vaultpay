import { IsEnum, IsMongoId, IsNumber, IsOptional, Min } from "class-validator";
import { OrderItemStatus } from "../schemas/order.schema";

export class UpdateOrderItemStatusDto {
  @IsMongoId()
  itemId: string;

  @IsEnum(OrderItemStatus)
  status: OrderItemStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  preparedQty?: number;
}
