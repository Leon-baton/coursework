import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

const configService = new ConfigService();

export const options: DataSourceOptions = {
    type: 'postgres',
    host: configService.get('DB_HOST', '127.0.0.1'),
    port: configService.getOrThrow('DB_PORT', 5432),
    username: configService.getOrThrow('DB_USER'),
    password: configService.getOrThrow('DB_PASSWORD'),
    database: configService.getOrThrow('DB_NAME'),
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/src/database/migrations/*.js'],
    synchronize: false,
    migrationsTransactionMode: 'all',
};

const dataSource = new DataSource(options);
export default dataSource;
