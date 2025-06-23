import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({
        required: true,
    })
    @IsString()
    @IsEmail()
    email: string;

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
    username: string;

    @ApiProperty({
        required: true,
    })
    @IsString()
    @MinLength(3)
    firstname: string;

    @ApiProperty({
        required: true,
    })
    @IsString()
    lastname: string;

    @ApiProperty({
        required: false,
    })
    @IsString()
    avatar?: string;
}
