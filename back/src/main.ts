import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  dotenv.config();

  const PORT = process.env.PORT;
  const FRONTEND_URL = 3000;

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: FRONTEND_URL,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  console.log(PORT);
  console.log(FRONTEND_URL);

  await app.listen(PORT!);
}

bootstrap().catch(() => {
  process.exit(1);
});
