import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const expressApp: express.Express = express();

const bootstrap = async () => {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

    // Config sama seperti main.ts
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors();

    await app.init();
};

bootstrap();

export default expressApp;
