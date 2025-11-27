import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantModule } from './tenants/tenants.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || ''),
    AuthModule,
    UsersModule,
    TenantModule,
  ],
  controllers: [],
})
export class AppModule {}
