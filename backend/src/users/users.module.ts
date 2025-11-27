import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ModelsModule } from 'src/database/models.module';
import { MailService } from 'src/common/services/mail.service';

@Module({
  imports: [ModelsModule],
  controllers: [UsersController],
  providers: [UsersService, MailService],
})
export class UsersModule {}
