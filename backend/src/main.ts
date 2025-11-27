import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import mongoose from 'mongoose';
import { connectDB } from './db';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await connectDB();

  mongoose.connection.on('connected', () => {
    console.log('🟢 MongoDB Connected');
  });

  mongoose.connection.on('error', (err) => {
    console.log('🔴 MongoDB Connection Error:', err);
  });
  await app.listen(process.env.PORT || 4000);
  console.log(`🚀 Server running on port ${process.env.PORT}`);
}
bootstrap();
