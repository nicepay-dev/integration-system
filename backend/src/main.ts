import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();
  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
  logger.log(`Merchant Pulse API is ready on port ${port}`);
}

bootstrap().catch((error:unknown) => {
  const logger = new Logger('Bootstrap');
  const message = error instanceof Error ? error.stack || error.message : String(error);
  logger.error(`Backend failed to start: ${message}`);
  process.exit(1);
});
