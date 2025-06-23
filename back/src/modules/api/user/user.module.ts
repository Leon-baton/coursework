import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { User } from './entities/user.entity';
import { VerifCode } from './entities/verif-code.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    imports: [TypeOrmModule.forFeature([User, VerifCode])],
    controllers: [UserController],
    providers: [UserService, User, JwtStrategy],
    exports: [UserService],
})
export class UserModule {}
