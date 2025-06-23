import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentService {
    constructor(
        @InjectRepository(Document)
        private documentRepository: Repository<Document>,
    ) {}

    async createDocument(createDocumentDto: CreateDocumentDto, ownerId: number): Promise<Document> {
        const existingDocument = await this.documentRepository.findOne({ where: { title: createDocumentDto.title, ownerId } });
        if (existingDocument) {
            throw new BadRequestException('Document with this title already exists for this user.');
        }
        const document = this.documentRepository.create({ ...createDocumentDto, ownerId });
        return this.documentRepository.save(document);
    }

    async getDocumentById(id: number): Promise<Document> {
        const document = await this.documentRepository.findOne({ where: { id } });
        if (!document) {
            throw new BadRequestException('Document not found');
        }
        return document;
    }

    async getUserDocuments(ownerId: number): Promise<Document[]> {
        return this.documentRepository.find({ where: { ownerId } });
    }

    async updateDocumentContent(id: number, content: string): Promise<Document> {
        await this.documentRepository.update(id, { content, updatedAt: new Date() });
        return this.getDocumentById(id);
    }

    async deleteDocument(id: number): Promise<{ message: string }> {
        const result = await this.documentRepository.delete(id);
        if (result.affected === 0) {
            throw new BadRequestException('Document not found or could not be deleted');
        }
        return { message: 'Document deleted successfully' };
    }
}
