// src/orders/dto/create-order.dto.ts
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
  IsOptional,
  IsString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from "class-validator";
import { Type } from "class-transformer";
import { Types } from "mongoose";
import { BusinessType } from "src/tenants/tenant.schema";

/**
 * Item DTOs for each business type
 */

export class CreateRestaurantOrderItemDto {
  @IsMongoId()
  menuItemId!: string;

  @IsNumber()
  @Min(1)
  qty!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number; // optional, computed server-side if missing

  @IsOptional()
  @IsString()
  variant?: string;

  @IsOptional()
  @IsMongoId()
  parentItemId?: string;
}

export class CreateRetailOrderItemDto {
  @IsMongoId()
  productId!: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Min(1)
  qty!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;

  @IsOptional()
  @IsMongoId()
  warehouseId?: string;

  @IsOptional()
  // allow ISO date in string, service layer can parse
  @IsString()
  expectedDeliveryDate?: string;
}

export class CreateServiceOrderItemDto {
  @IsMongoId()
  serviceId!: string;

  @IsString()
  serviceName!: string;

  @IsNumber()
  @Min(0)
  durationMinutes!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;

  @IsOptional()
  @IsMongoId()
  assignedProviderId?: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsOptional()
  @IsString()
  status?: "pending" | "assigned" | "in-progress" | "completed" | "cancelled";
}

export class CreateEcommerceOrderItemDto {
  @IsMongoId()
  productId!: string;

  @IsOptional()
  @IsMongoId()
  variantId?: string;

  @IsNumber()
  @Min(1)
  qty!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;

  @IsOptional()
  @IsString()
  shippingMethod?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;
}

/**
 * Custom validator that ensures items match the declared businessType.
 * It does shape-level checks (presence & simple types). The service should still
 * compute totals and convert IDs to ObjectId.
 */
@ValidatorConstraint({ async: false })
class ItemsMatchBusinessTypeConstraint implements ValidatorConstraintInterface {
  validate(items: any[], args: ValidationArguments) {
    const obj: any = args.object;
    if (!Array.isArray(items) || items.length === 0) return false;

    const bt = obj.businessType as BusinessType;
    if (!bt) return false;

    for (const it of items) {
      // minimal checks per type
      switch (bt) {
        case BusinessType.RESTAURANT:
          if (!it.menuItemId) return false;
          if (!this.isPositiveNumber(it.qty)) return false;
          if (!this.isNonNegativeNumber(it.price)) return false;
          break;
        case BusinessType.RETAIL:
          if (!it.productId) return false;
          if (!this.isPositiveNumber(it.qty)) return false;
          if (!this.isNonNegativeNumber(it.unitPrice)) return false;
          break;
        case BusinessType.SERVICE:
          if (!it.serviceId) return false;
          if (!it.serviceName) return false;
          if (!this.isNonNegativeNumber(it.price)) return false;
          break;
        case BusinessType.ECOMMERCE:
          if (!it.productId) return false;
          if (!this.isPositiveNumber(it.qty)) return false;
          if (!this.isNonNegativeNumber(it.price)) return false;
          break;
        default:
          return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `Each item must match the shape for businessType ${(args.object as any).businessType}`;
  }

  private isPositiveNumber(v: any) {
    return typeof v === "number" && isFinite(v) && v >= 1;
  }
  private isNonNegativeNumber(v: any) {
    return typeof v === "number" && isFinite(v) && v >= 0;
  }
}

/**
 * Decorator wrapper
 */
export function ItemsMatchBusinessType(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: ItemsMatchBusinessTypeConstraint,
    });
  };
}

/**
 * Main CreateOrderDto
 */
export class CreateOrderDto {
  @IsEnum(BusinessType)
  businessType: BusinessType;

  /** optional external order number; server will generate if not provided */
  @IsOptional()
  @IsString()
  orderNumber?: string;

  /** tenant-side counter: either client can pass tokenNumber or server will atomically
   * increment the counter if counterId is provided. So both fields are optional. */
  @IsOptional()
  @IsMongoId()
  counterId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  tokenNumber?: number;

  @IsEnum(["cod", "online", "wallet"])
  paymentMode: "cod" | "online" | "wallet";

  @IsOptional()
  @IsNumber()
  @Min(0)
  grandTotal?: number; // server will compute authoritative grandTotal

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object) // we cannot reliably transform into different classes here
  @ItemsMatchBusinessType({
    message: "Items must be valid for the selected businessType",
  })
  items: any[]; // validated shape by custom validator

  @IsOptional()
  isPaid?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}
