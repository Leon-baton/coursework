import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { VerifCode } from './entities/verif-code.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(VerifCode)
        private verifCodeRepository: Repository<VerifCode>,
    ) {}

    async create(createUserDto: CreateUserDto) {
        const findUser = await this.userRepository.findOne({
            where: [{ email: createUserDto.email }, { username: createUserDto.username }],
        });
        if (findUser) {
            throw new BadRequestException('user_already_exists');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        await this.userRepository.save(user);
        return user;
    }

    async insertRefreshToken(id: number, refreshToken: string) {
        const userToInsert = await this.userRepository.findOne({ where: { id } });
        userToInsert.refreshToken = await bcrypt.hash(refreshToken, 10);
        await this.userRepository.save(userToInsert);
    }

    async removeRefreshToken(id: number) {
        return await this.userRepository.update(id, { refreshToken: null });
    }

    async getUserById(id: number) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new BadRequestException('user_not_found');
        return user;
    }

    async getUserByLogin(login: string) {
        return this.userRepository.findOne({
            where: [{ username: login }, { email: login }],
        });
    }

    async getAllUsers() {
        return {
            status: 'success',
            message: 'users_found',
            content: await this.userRepository.find(),
        };
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new BadRequestException('user_not_found');
        await this.userRepository.update(id, updateUserDto);
        const updatedUser = await this.userRepository.findOne({ where: { id } });
        return {
            status: 'success',
            message: 'user_updated',
            content: { user: updatedUser },
        };
    }

    async updatePassword(id: number, password: string) {
        const user = await this.userRepository.findOne({ where: { id } });
        user.password = password;
        await this.userRepository.save(user);
        return user;
    }

    async deleteUser(id: number) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new BadRequestException('user_not_found');
        await this.userRepository.delete(id);
        return { message: 'user_deleted' };
    }

    async verifyEmail(id: number, code: string) {
        const userToVerify = await this.userRepository.findOne({ where: { id } });
        const verifCode = await this.verifCodeRepository.findOne({
            where: { code: code, email: userToVerify.email },
        });
        if (verifCode && verifCode.code === code) {
            userToVerify.isVerified = true;
            await this.userRepository.save(userToVerify);
            await this.verifCodeRepository.delete({ email: userToVerify.email });
            return {
                message: 'email_verified',
            };
        } else {
            throw new BadRequestException('invalid_code');
        }
    }
}
