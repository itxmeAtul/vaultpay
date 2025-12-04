import { IsNotEmpty, IsString } from "class-validator";
import { PartialType } from "@nestjs/mapped-types";

export class CreateMenuCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateMenuCategoryDto extends PartialType(CreateMenuCategoryDto) {}
