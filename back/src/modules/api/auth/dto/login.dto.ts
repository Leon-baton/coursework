import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        required: true,
    })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    login: string;
}
