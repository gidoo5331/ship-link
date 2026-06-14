import { SetMetadata } from '@nestjs/common';
import { Action, Resource } from 'src/shared';

export const PERMISSIONS_KEY = 'permissions';

export interface RequiredPermission {
  resource: Resource;
  actions: Action[];
}

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);