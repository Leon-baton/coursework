import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DocumentModule } from './document/document.module';

@Module({
    imports: [AuthModule, UserModule, DocumentModule],
})
export class ApiModule {}
