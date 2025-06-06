import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const canActivateParent = super.canActivate(context);

        return Promise.resolve(canActivateParent).then(async (can) => {
            if (!can) {
                return false;
            }
            const request = context.switchToHttp().getRequest();
            const authHeader = request.headers.authorization;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring();
                const isBlocked = await this.prisma.blockedToken.findUnique({
                    where: { token },
                });
                if (isBlocked) {
                    throw new UnauthorizedException('Token foi invalidado (logout).');
                }
            }
            return true;
        }).catch(err => {
            if (err instanceof UnauthorizedException) {
                throw err;
            }
            throw new UnauthorizedException();
        });
    }

    handleRequest(error, user, info: Error) {
        if (error || !user) {
            throw error || new UnauthorizedException(info)
        }
        return user;
    }
}
