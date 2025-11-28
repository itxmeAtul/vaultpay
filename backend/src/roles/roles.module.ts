import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { ModelsModule } from 'src/database/models.module';

@Module({
  imports: [ModelsModule],
  providers: [RolesService],
})
export class RolesModule {}
