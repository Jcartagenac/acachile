import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Permission, UserRole } from '@shared/index';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  role?: UserRole;
  requireAll?: boolean; // Si true, requiere todos los permisos/roles especificados
  fallback?: React.ReactNode;
}

/**
 * Verifica si el usuario solo tiene permiso especificado
 */
const checkPermissionOnly = (
  permission: Permission | undefined,
  hasPermission: (p: Permission) => boolean
): boolean => {
  return !permission || hasPermission(permission);
};

/**
 * Verifica si el usuario solo tiene rol especificado
 */
const checkRoleOnly = (
  role: UserRole | undefined,
  hasRole: (r: UserRole) => boolean
): boolean => {
  return !role || hasRole(role);
};

/**
 * Verifica permisos y roles cuando ambos están especificados
 */
const checkBothPermissionAndRole = (
  permission: Permission,
  role: UserRole,
  requireAll: boolean,
  hasPermission: (p: Permission) => boolean,
  hasRole: (r: UserRole) => boolean
): boolean => {
  const hasPermissionCheck = hasPermission(permission);
  const hasRoleCheck = hasRole(role);

  if (requireAll) {
    return hasPermissionCheck && hasRoleCheck;
  } else {
    return hasPermissionCheck || hasRoleCheck;
  }
};

/**
 * Determina si el usuario tiene acceso basado en permisos y roles
 */
const hasAccess = (
  permission: Permission | undefined,
  role: UserRole | undefined,
  requireAll: boolean,
  hasPermission: (p: Permission) => boolean,
  hasRole: (r: UserRole) => boolean
): boolean => {
  // Si se pasan tanto permiso como rol
  if (permission && role) {
    return checkBothPermissionAndRole(permission, role, requireAll, hasPermission, hasRole);
  }

  // Solo verificar permiso
  if (!checkPermissionOnly(permission, hasPermission)) {
    return false;
  }

  // Solo verificar rol
  if (!checkRoleOnly(role, hasRole)) {
    return false;
  }

  return true;
};

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  role,
  requireAll = false,
  fallback = null,
}) => {
  const { hasPermission, hasRole, isAuthenticated } = useAuth();

  // Si no está autenticado, no mostrar nada
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Verificar acceso
  if (!hasAccess(permission, role, requireAll, hasPermission, hasRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback = null,
}) => {
  const { getUserRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  const userRole = getUserRole();
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Componentes específicos para cada rol
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <RoleGuard allowedRoles={['admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const DirectorOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <RoleGuard allowedRoles={['admin', 'director']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const DirectorEditorOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <RoleGuard allowedRoles={['admin', 'director', 'director_editor']} fallback={fallback}>
    {children}
  </RoleGuard>
);

// Hook personalizado para verificar permisos en componentes
export const usePermissions = () => {
  const { 
    hasPermission, 
    hasRole, 
    canManage, 
    isAdmin, 
    isDirector, 
    isDirectorEditor, 
    isUsuario,
    getUserRole,
    getRoleDisplayName,
    getRoleColor 
  } = useAuth();

  return {
    hasPermission,
    hasRole,
    canManage,
    isAdmin: isAdmin(),
    isDirector: isDirector(),
    isDirectorEditor: isDirectorEditor(),
    isUsuario: isUsuario(),
    getUserRole,
    getRoleDisplayName: getRoleDisplayName(),
    getRoleColor: getRoleColor(),
    
    // Permisos específicos comunes
    canManageUsers: hasPermission('manage_users'),
    canManageEvents: hasPermission('manage_events'),
    canManageContent: hasPermission('manage_content'),
    canViewAnalytics: hasPermission('view_analytics'),
    canModerate: hasPermission('moderate_community'),
    canAccessAdminPanel: hasPermission('access_admin_panel'),
    canAccessDirectorPanel: hasPermission('access_director_panel'),
    canAccessEditorPanel: hasPermission('access_editor_panel'),
  };
};