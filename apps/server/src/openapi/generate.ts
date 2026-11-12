import 'varlock/auto-load';
import 'reflect-metadata';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { configureApp } from '../app.setup.js';
import { createOpenApiDocument } from './document.js';

const outFile = resolve(import.meta.dirname, '../../openapi.json');

const app = configureApp(await NestFactory.create(AppModule, { logger: ['error'] }));
const document = createOpenApiDocument(app);
await writeFile(outFile, `${JSON.stringify(document, null, 2)}\n`);
await app.close();

console.log(`OpenAPI → ${outFile}`);
