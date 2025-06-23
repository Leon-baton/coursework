import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@ApiTags('Documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('documents')
export class DocumentController {
    constructor(private readonly documentService: DocumentService) {}

    @Post()
    @ApiOperation({ summary: 'Создание нового документа' })
    async createDocument(@Body() createDocumentDto: CreateDocumentDto, @CurrentUser() user: JwtPayload) {
        return this.documentService.createDocument(createDocumentDto, user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Получение всех документов текущего пользователя' })
    async getUserDocuments(@CurrentUser() user: JwtPayload) {
        return this.documentService.getUserDocuments(user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Получение документа' })
    @ApiParam({ name: 'id', description: 'ID документа', type: Number })
    async getDocumentById(@Param('id') id: number) {
        return this.documentService.getDocumentById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Обновление содержимого документа' })
    @ApiParam({ name: 'id', description: 'ID документа', type: Number })
    async updateDocument(@Param('id') id: number, @Body() updateDocumentDto: UpdateDocumentDto) {
        return this.documentService.updateDocumentContent(id, updateDocumentDto.content);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Удаление документа' })
    @ApiParam({ name: 'id', description: 'ID документа', type: Number })
    async deleteDocument(@Param('id') id: number) {
        return this.documentService.deleteDocument(id);
    }
}
