// import { ValidationPipe } from '@nestjs/common';
// import { NestFactory } from '@nestjs/core';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { AppModule } from './app.module';
// import { LoggerInterceptor } from './common/middleware/logger.interceptor';
// import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule, { cors: true });
//   const corsOptions: CorsOptions = {
//     origin: '*', // Allow all origins
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
//     credentials: true, // Allow credentials (cookies, authorization headers)
//     allowedHeaders: 'Authorization, Content-Type', // Allowed headers
//   };

//   // Enable CORS
//   app.enableCors(corsOptions);
  
//   app.useGlobalInterceptors(new LoggerInterceptor());
//   app.setGlobalPrefix('api');
//   app.useGlobalPipes(new ValidationPipe());
//   const config = new DocumentBuilder()
//     .setTitle('Marvel')
//     .setDescription('Marvel Mock API')
//     .setVersion('1.0')
//     .addTag('marvel')
//     .build();
//   const document = SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('docs', app, document);

//   const PORT = process.env.PORT || 5050;
//   await app.listen(PORT);
//   console.log(`Application is running on: ${await app.getUrl()}/api`);
// }
// bootstrap();
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config();


// dotenv.config({ path: path.resolve(__dirname, '../../shop/.env') });

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerInterceptor } from './common/middleware/logger.interceptor';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import * as functions from 'firebase-functions';

// const shopApp = next({ dev: false,dir: './../next/shop', conf: require('./../next/shop/next.config.js') });
// const shopApp = next({ dev: false, conf: { distDir: './../next/shop/.next' } });
// const shopApp = next({
//   dev: false,
//   dir: path.resolve(__dirname, './../next/shop'), // Resolve the path to the 'shop' folder
//   conf: require('./../next/shop/next.config.js')
//   // conf: { distDir: path.resolve(__dirname, './../next/shop/.next') }, // Resolve to the correct .next folder
// });
// const shopHandler = shopApp.getRequestHandler();
// exports.shop = functions.https.onRequest(async (req, res) => {
//   console.log('shop ==============',req,res)
//   try {
//     await shopApp.prepare();
//     return await shopHandler(req, res);
//   } catch (err) {
//     console.error("Error handling shop request:", err);
//     res.status(500).send("Internal Server Error");
//   }
// });

// // For admin
// // const adminApp = next({ dev: false,dir: './../next/admin', conf: require('./../next/admin/next.config.js') });
// // const adminApp = next({ dev: false, conf: { distDir: './../next/admin/.next' } });
// const adminApp = next({
//   dev: false,
//   dir: path.resolve(__dirname, './../next/admin'), // Resolve the path to the 'admin' folder
//   conf: { distDir: path.resolve(__dirname, './../next/admin/.next') }, // Resolve to the correct .next folder
// });
// const adminHandler = adminApp.getRequestHandler();
// exports.admin = functions.https.onRequest(async (req, res) => {
  
//   await adminApp.prepare();
//   return await adminHandler(req, res);
// });

const server = express(); // Create an Express instance
async function createNestServer(expressInstance: express.Express) {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance), { cors: true });
  
  // Set up CORS options
  const corsOptions: CorsOptions = {
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers)
    allowedHeaders: 'Authorization, Content-Type', // Allowed headers
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
