import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user; // set by JwtStrategy

    if (!user) throw new UnauthorizedException('Invalid token');

    // 💡 Super Admin does NOT require tenant
    if (user.role === 'super-admin') return true;

    // 🔐 Admin/User MUST have a tenant
    if (!user.tenant) throw new ForbiddenException('Tenant not found in token');

    // Pass tenant to request (safe propagation)
    req.headers['tenant-id'] = user.tenant;

    return true;
  }
}
