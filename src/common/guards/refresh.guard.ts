import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { JwtRefreshInterface } from '../interfaces/jwt-refresh.interface';
import { ErrorMessage } from '../enums/message.enums';

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const refreshToken = this.extractTokenFromHeader(request);
    if (!refreshToken) {
      throw new UnauthorizedException(ErrorMessage.TOKEN_NOT_PROVIDED);
    }
    try {
      const payload = await this.jwtService.verifyAsync<JwtRefreshInterface>(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );
      request['user'] = { sub: payload.sub, refreshToken };
      return true;
    } catch {
      throw new UnauthorizedException(ErrorMessage.TOKEN_INVALID_OR_EXPIRED);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
