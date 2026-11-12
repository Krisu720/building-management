import { type INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';

export const API_PREFIX = 'api';

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  return app;
}
