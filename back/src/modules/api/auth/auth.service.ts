import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';

export interface JwtPayload {
    id: number;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async validateUser(login: string, password: string) {
        const user = await this.userService.getUserByLogin(login);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new BadRequestException('invalid_credentials');
        }
        return user;
    }

    async createAccessToken(user) {
        const payload: JwtPayload = { id: user.id };
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
        });
    }

    async createRefreshToken(user) {
        const payload: JwtPayload = { id: user.id };
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
        });
    }

    async getTokens(user, response) {
        const accessToken = await this.createAccessToken(user);
        const refreshToken = await this.createRefreshToken(user);
        await this.userService.insertRefreshToken(user.id, refreshToken);

        response
            .cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 30 * 24 * 60 * 60 * 1000,
            })
            .status(200);

        return { accessToken, refreshToken };
    }

    async refreshToken(request) {
        const refreshToken = request.cookies.refreshToken;
        if (!refreshToken) {
            throw new UnauthorizedException('refresh_token_not_provided');
        }

        const payload = await this.jwtService.verifyAsync(refreshToken, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
        });

        const user = await this.userService.getUserById(payload.id);
        const decryptedRefreshToken = await bcrypt.compare(refreshToken, user.refreshToken);

        if (decryptedRefreshToken) {
            return {
                accessToken: await this.createAccessToken(user),
                refreshToken: await this.createRefreshToken(user),
            };
        } else {
            throw new UnauthorizedException('invalid_refresh_token');
        }
    }

    async logout(request, response) {
        const refreshToken = request.cookies.refreshToken;
        if (!refreshToken) {
            throw new UnauthorizedException('refresh_token_not_provided');
        }

        const payload = await this.jwtService.verifyAsync(refreshToken, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
        });

        await this.userService.removeRefreshToken(payload.id);
        response.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        });

        return { message: 'success' };
    }
}
