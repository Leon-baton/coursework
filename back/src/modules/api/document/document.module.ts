import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { DocumentController } from './document.controller';
import { DocumentGateway } from './document.gateway';
import { DocumentService } from './document.service';
import { Document } from './entities/document.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Document]), UserModule],
    controllers: [DocumentController],
    providers: [DocumentService, DocumentGateway],
    exports: [DocumentService],
})
export class DocumentModule {}
