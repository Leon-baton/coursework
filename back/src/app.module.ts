import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { options } from './database/dataSource';
import { ApiModule } from './modules/api/api.module';

@Module({
    imports: [
        TypeOrmModule.forRoot(options),
        JwtModule.register({ global: true }),
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '.env.local'],
        }),
        ApiModule,
    ],
})
export class AppModule {}
