import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from 'generated/prisma/client';
import { SystemRole } from 'generated/prisma/enums';

// Ensures a company user can only reach routes under their own
// `companies/:companyId/...`. SUPER_ADMIN can access any company.
// Must run after JwtAuthGuard.
@Injectable()
export class CompanyScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<
        Request<{ companyId?: string; company_id?: string }> & { user: User }
      >();
    const { user } = request;
    // some older routes name the param :company_id
    const companyId = request.params.companyId ?? request.params.company_id;

    // route has no :companyId — nothing to scope
    if (!companyId) return true;

    if (user.systemRole === SystemRole.SUPER_ADMIN) return true;

    if (user.companyId !== companyId) {
      throw new ForbiddenException('You do not have access to this company');
    }

    return true;
  }
}
