import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, Roles } from '../auth/decorators/role.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('User')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @ApiOperation({ summary: 'Получение информации о себе' })
    async getCurrentUser(@CurrentUser() user: JwtPayload) {
        return this.userService.getUserById(user.id);
    }

    @Roles(Role.ADMIN)
    @Get('/all')
    @ApiOperation({ summary: 'Получение списка всех пользователей (только для администраторов)' })
    async getAllUsers() {
        return this.userService.getAllUsers();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Получение информации о пользователе по ID' })
    @ApiParam({ name: 'id', description: 'Идентификатор пользователя', type: Number })
    async getUserById(@Param('id') id: number) {
        return this.userService.getUserById(id);
    }

    @Post('/verify/:token')
    @ApiOperation({ summary: 'Верификация электронной почты пользователя' })
    @ApiParam({ name: 'token', description: 'Токен верификации', type: String })
    async verifyUser(@CurrentUser() user: JwtPayload, @Param('token') token: string) {
        return this.userService.verifyEmail(user.id, token);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Обновление пользователя по ID' })
    @ApiParam({ name: 'id', description: 'Идентификатор пользователя', type: Number })
    async updateUser(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.updateUser(id, updateUserDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Удаление пользователя по ID' })
    @ApiParam({ name: 'id', description: 'Идентификатор пользователя', type: Number })
    async deleteUser(@Param('id') id: number) {
        return this.userService.deleteUser(id);
    }
}
