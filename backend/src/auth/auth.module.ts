import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { ModelsModule } from 'src/database/models.module';

const jwtExpireEnv = process.env.JWT_EXPIRE;
const jwtExpiresIn: any =
  jwtExpireEnv && /^\d+$/.test(jwtExpireEnv)
    ? Number(jwtExpireEnv)
    : jwtExpireEnv || '1d';

@Module({
  imports: [
    ModelsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET as string,
      signOptions: { expiresIn: jwtExpiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
