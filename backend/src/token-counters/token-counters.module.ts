import { Module } from "@nestjs/common";
import { TokenCountersController } from "./token-counters.controller";
import { TokenCountersService } from "./token-counters.service";
import { ModelsModule } from "src/database/models.module";

@Module({
  imports: [ModelsModule],
  controllers: [TokenCountersController],
  providers: [TokenCountersService],
})
export class TokenCountersModule {}
