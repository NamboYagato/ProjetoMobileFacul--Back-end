import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(error, user, info: Error) {
        if (error || !user) {
            throw error || new UnauthorizedException(info)
        }
        return user;
    }
}
