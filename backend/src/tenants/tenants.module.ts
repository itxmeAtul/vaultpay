import { Module } from '@nestjs/common';
import { TenantService } from './tenants.service';
import { TenantController } from './tenants.controller';
import { ModelsModule } from 'src/database/models.module';

@Module({
  imports: [ModelsModule],
  providers: [TenantService],
  controllers: [TenantController],
  exports: [TenantService], // 👈 export if other modules need TenantModel / TenantService
})
export class TenantModule {}
