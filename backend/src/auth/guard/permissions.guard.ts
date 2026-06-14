import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemRole } from 'generated/prisma/enums';
import { PERMISSIONS_KEY,  RequiredPermission } from '../decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // get permissions required by @RequirePermissions() decorator
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // no @RequirePermissions() decorator — skip check
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    // SUPER_ADMIN and COMPANY_ADMIN bypass all permission checks
    if (
      user.systemRole === SystemRole.SUPER_ADMIN ||
      user.systemRole === SystemRole.COMPANY_ADMIN
    ) {
      return true;
    }

    // AGENT — handled by AgentGuard, not PermissionsGuard
    if (user.systemRole === SystemRole.AGENT) {
      throw new ForbiddenException('Agents cannot access this resource');
    }

    // COMPANY_STAFF — check their assigned role's permissions
    if (!user.roleId) {
      throw new ForbiddenException('No role assigned to this account');
    }

    // load role permissions
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
    });

    // check every required permission
    for (const required of requiredPermissions) {
      const match = rolePermissions.find(
        (p) => p.resource === required.resource,
      );

      const hasAll =
        match &&
        required.actions.every((action) => match.actions.includes(action));

      if (!hasAll) {
        throw new ForbiddenException(
          `Missing permission: ${required.resource}:${required.actions.join(',')}`,
        );
      }
    }

    return true;
  }
}