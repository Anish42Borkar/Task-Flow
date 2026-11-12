import { SetMetadata } from '@nestjs/common';

export type PermissionAction = 'canView' | 'canCreate' | 'canEdit' | 'canDelete';

export interface RequiredPermission {
  module: string; // 'tasks' | 'projects' | 'user_management' | 'permissions' | 'settings' | 'notifications'
  action: PermissionAction;
}

export const PERMISSIONS_KEY = 'required_permission';

export const RequirePermission = (module: string, action: PermissionAction) =>
  SetMetadata(PERMISSIONS_KEY, { module, action });
