import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as expressBasicAuth from 'express-basic-auth';
import * as packageJson from '../package.json';
import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger(bootstrap.name);

    const app = await NestFactory.create(AppModule);
    const configService: ConfigService<unknown, boolean> = app.get(ConfigService);

    const appPort = configService.getOrThrow('APP_PORT') || 3000;
    const swaggerPath = configService.getOrThrow('SWAGGER_PATH');
    const swaggerLogin = configService.getOrThrow('SWAGGER_LOGIN');
    const swaggerPassword = configService.getOrThrow('SWAGGER_PASSWORD');

    const config = new DocumentBuilder()
        .setTitle(packageJson.name)
        .setDescription(packageJson.description)
        .setVersion(packageJson.version)
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'Authorization',
                description: 'Enter JWT token',
                in: 'header',
            },
            'access-token',
        )
        .build();

    app.use(
        swaggerPath,
        expressBasicAuth({
            challenge: true,
            users: { [swaggerLogin]: swaggerPassword },
        }),
    );

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerPath, app, documentFactory);

    app.enableCors({
        origin: '*',
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );
    app.useWebSocketAdapter(new IoAdapter(app));

    await app.listen(appPort, '0.0.0.0');
    const url = await app.getUrl();

    logger.debug(`Server started at ${url}`);
    logger.debug(`Swagger available on ${url}${swaggerPath}`);
}
bootstrap();
