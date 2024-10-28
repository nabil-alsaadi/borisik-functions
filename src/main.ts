import * as dotenv from 'dotenv';
dotenv.config();
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerInterceptor } from './common/middleware/logger.interceptor';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import * as functions from 'firebase-functions';

const server = express(); // Create an Express instance
async function createNestServer(expressInstance: express.Express) {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance), { cors: true });
  app.use(
    express.json({
        verify: function(req, res, buf) {
            //@ts-ignore
            req.rawBody = buf;
        }
    })
  );
  // Set up CORS options
  const corsOptions: CorsOptions = {
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers)
    allowedHeaders: 'Authorization, Content-Type, x-environment, Accept', // Allowed headers
  };

  // Enable CORS
  app.enableCors(corsOptions);

  app.useGlobalInterceptors(new LoggerInterceptor());
  // app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Marvel')
    .setDescription('Marvel Mock API')
    .setVersion('1.0')
    .addTag('marvel')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.init(); // Instead of app.listen, use app.init for Express
}

createNestServer(server);

// Export as Firebase function
export const api = functions.https.onRequest(server);
