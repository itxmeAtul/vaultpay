import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

class CreateMenuItemVariantDto {
  @IsString()
  @IsNotEmpty()
  size: string;

  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateMenuItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsOptional()
  variants?: CreateMenuItemVariantDto[];
}
