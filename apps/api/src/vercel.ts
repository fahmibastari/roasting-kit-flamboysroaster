import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { IncomingMessage, ServerResponse } from 'http';

const server = express();

const createNestServer = async (expressInstance: express.Express) => {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors();

    await app.init();
    return app;
};

// Promise to wait for initialization
const initialized = createNestServer(server);

export default async (req: IncomingMessage, res: ServerResponse) => {
    await initialized;
    server(req, res);
};
