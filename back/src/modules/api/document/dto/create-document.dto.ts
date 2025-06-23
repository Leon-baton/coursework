import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateDocumentDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    title: string;
}
