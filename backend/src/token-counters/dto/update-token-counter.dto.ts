import { PartialType } from "@nestjs/mapped-types";
import { CreateTokenCounterDto } from "./create-token-counter.dto";

export class UpdateTokenCounterDto extends PartialType(CreateTokenCounterDto) {}
