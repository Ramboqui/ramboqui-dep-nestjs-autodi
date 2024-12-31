import { NestFactory } from '@nestjs/core';

import 'reflect-metadata';

import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors()
	app.setGlobalPrefix('/simple-sample')
	await app.listen(8080);
	console.log('Simple Example listening on http://localhost:8080');
}

bootstrap();
