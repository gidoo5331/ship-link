import { SetMetadata } from '@nestjs/common';
import { SystemRole } from 'generated/prisma/enums';

export const SYSTEM_ROLES_KEY = 'system_roles';

export const SystemRolesDecorator = (...roles: SystemRole[]) =>
  SetMetadata(SYSTEM_ROLES_KEY, roles);