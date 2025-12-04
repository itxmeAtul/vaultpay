import { IsNotEmpty, IsString } from "class-validator";

export class CreateTokenCounterDto {
  @IsString()
  @IsNotEmpty()
  counterName: string;
}
