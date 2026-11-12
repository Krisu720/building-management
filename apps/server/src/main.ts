import 'varlock/auto-load';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { ENV } from './env.js';
import { setupSwagger } from './openapi/document.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  app.enableShutdownHooks();
  setupSwagger(app);
  await app.listen(ENV.PORT);
}
await bootstrap();
