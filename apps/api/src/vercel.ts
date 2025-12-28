import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { IncomingMessage, ServerResponse } from 'http';

const server = express();

const createNestServer = async (expressInstance: express.Express) => {
    try {
        const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));

        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        app.enableCors();

        await app.init();
        return app;
    } catch (err) {
        console.error('NestJS Bootstrap Error:', err);
        throw err;
    }
};

let initialized = false;

export default async (req: IncomingMessage, res: ServerResponse) => {
    try {
        if (!initialized) {
            await createNestServer(server);
            initialized = true;
        }
        server(req, res);
    } catch (err: any) {
        console.error('Function Execution Error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            error: 'Server Crash',
            message: err.message,
            stack: err.stack,
            details: 'This is a debug message only shown to help fix the 500 error.'
        }));
    }
};
