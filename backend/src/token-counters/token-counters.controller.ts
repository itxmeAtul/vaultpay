import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { TokenCountersService } from "./token-counters.service";
import { CreateTokenCounterDto } from "./dto/create-token-counter.dto";
import { UpdateTokenCounterDto } from "./dto/update-token-counter.dto";
import { Tenant } from "../common/decorators/tenant.decorator";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("token-counters")
export class TokenCountersController {
  constructor(private readonly tokenCountersService: TokenCountersService) {}

  @Post()
  create(
    @Tenant() tenantId: string,
    @Body() createTokenCounterDto: CreateTokenCounterDto
  ) {
    return this.tokenCountersService.create(tenantId, createTokenCounterDto);
  }

  @Get()
  findAll(@Tenant() tenantId: string) {
    return this.tokenCountersService.findAll(tenantId);
  }

  @Get(":id")
  findOne(@Tenant() tenantId: string, @Param("id") id: string) {
    return this.tokenCountersService.findOne(tenantId, id);
  }

  @Patch(":id")
  update(
    @Tenant() tenantId: string,
    @Param("id") id: string,
    @Body() updateTokenCounterDto: UpdateTokenCounterDto
  ) {
    return this.tokenCountersService.update(
      tenantId,
      id,
      updateTokenCounterDto
    );
  }

  @Delete(":id")
  remove(@Tenant() tenantId: string, @Param("id") id: string) {
    return this.tokenCountersService.remove(tenantId, id);
  }

  @Get(":id/next-token")
  async getNextToken(@Tenant() tenantId: string, @Param("id") id: string) {
    return this.tokenCountersService.getNextToken(tenantId, id);
  }
}
