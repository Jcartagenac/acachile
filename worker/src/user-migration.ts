/**
 * Script de migración de usuarios demo a KV storage
 * ACA Chile - Sistema de usuarios unificado
 */

export interface Env {
  ACA_KV: KVNamespace;
  ENVIRONMENT: string;
  JWT_SECRET?: string;
  ADMIN_EMAIL?: string;
  CORS_ORIGIN?: string;
}

// Usuarios iniciales que deben existir en el sistema
const initialUsers = [
  {
    id: 1,
    email: 'jcartagenac@gmail.com',
    password: 'supersecret123', // Contraseña actual del super admin
    name: 'admin',
    membershipType: 'vip',
    roles: ['super_admin'],
    region: 'Metropolitana',
    joinDate: '2024-01-01',
    active: true,
    status: 'active',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isInitialUser: true
  },
  {
    id: 2,
    email: 'admin@acachile.com',
    password: '123456',
    name: 'Administrador ACA',
    membershipType: 'vip',
    roles: ['admin'],
    region: 'Metropolitana',
    joinDate: '2024-01-01',
    active: true,
    status: 'active',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isInitialUser: true
  },
  {
    id: 3,
    email: 'usuario@acachile.com',
    password: '123456',
    name: 'Usuario Demo',
    membershipType: 'basic',
    roles: ['user'],
    region: 'Valparaíso',
    joinDate: '2024-06-15',
    active: true,
    status: 'active',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isInitialUser: true
  }
];

export async function migrateUsersToKV(env: Env): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // 1. Verificar si ya existe migración
    const migrationStatus = await env.ACA_KV.get('migration:users_to_kv');
    
    if (migrationStatus) {
      const status = JSON.parse(migrationStatus);
      return {
        success: true,
        message: 'La migración ya fue ejecutada anteriormente',
        data: status
      };
    }

    // 2. Verificar usuarios existentes en KV
    const existingUsers = await env.ACA_KV.get('users:all');
    let users = existingUsers ? JSON.parse(existingUsers) : [];

    // 3. Migrar usuarios demo existentes (verificar passwords actualizadas)
    for (const user of initialUsers) {
      // Verificar si el usuario ya existe
      const existingUserIndex = users.findIndex((u: any) => u.email === user.email);
      
      if (existingUserIndex === -1) {
        // Usuario no existe, agregarlo
        const { password, ...userWithoutPassword } = user;
        
        // Verificar si hay password actualizada en demo_user storage
        const updatedPassword = await env.ACA_KV.get(`demo_user:${user.id}:password`);
        const finalPassword = updatedPassword ? atob(updatedPassword) : password;
        
        // Guardar usuario sin password
        users.push(userWithoutPassword);
        
        // Guardar password por separado
        await env.ACA_KV.put(`user:${user.id}:password`, btoa(finalPassword));
        
        // Limpiar storage demo si existe
        if (updatedPassword) {
          await env.ACA_KV.delete(`demo_user:${user.id}:password`);
          await env.ACA_KV.delete(`demo_user:${user.id}:password_updated`);
        }
        
        console.log(`Usuario migrado: ${user.email} (password: ${finalPassword})`);
      } else {
        // Usuario existe, verificar si necesita actualizar password desde demo storage
        const updatedPassword = await env.ACA_KV.get(`demo_user:${user.id}:password`);
        if (updatedPassword) {
          const finalPassword = atob(updatedPassword);
          await env.ACA_KV.put(`user:${user.id}:password`, btoa(finalPassword));
          
          // Limpiar storage demo
          await env.ACA_KV.delete(`demo_user:${user.id}:password`);
          await env.ACA_KV.delete(`demo_user:${user.id}:password_updated`);
          
          console.log(`Password actualizada para usuario existente: ${user.email} (password: ${finalPassword})`);
        }
      }
    }

    // 4. Guardar usuarios actualizados
    await env.ACA_KV.put('users:all', JSON.stringify(users));

    // 5. Crear índices para búsqueda rápida
    for (const user of users) {
      await env.ACA_KV.put(`user:email:${user.email}`, JSON.stringify(user));
      await env.ACA_KV.put(`user:id:${user.id}`, JSON.stringify(user));
    }

    // 6. Marcar migración como completada
    const migrationData = {
      completedAt: new Date().toISOString(),
      usersCount: users.length,
      version: '1.0.0',
      initialUsers: initialUsers.map(u => ({ id: u.id, email: u.email, name: u.name }))
    };
    
    await env.ACA_KV.put('migration:users_to_kv', JSON.stringify(migrationData));

    return {
      success: true,
      message: 'Migración completada exitosamente',
      data: migrationData
    };

  } catch (error) {
    console.error('Error en migración:', error);
    return {
      success: false,
      message: `Error durante la migración: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

// Función helper para obtener el siguiente ID disponible
export async function getNextUserId(env: Env): Promise<number> {
  const users = await getAllUsers(env);
  const maxId = users.reduce((max, user) => Math.max(max, user.id), 0);
  return maxId + 1;
}

// Función helper para obtener todos los usuarios
export async function getAllUsers(env: Env): Promise<any[]> {
  const existingUsers = await env.ACA_KV.get('users:all');
  return existingUsers ? JSON.parse(existingUsers) : [];
}

// Función helper para encontrar usuario por email
export async function findUserByEmail(email: string, env: Env): Promise<any | null> {
  try {
    // Buscar primero en el índice rápido
    const cachedUser = await env.ACA_KV.get(`user:email:${email}`);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    // Fallback a búsqueda en lista completa
    const users = await getAllUsers(env);
    return users.find(u => u.email === email) || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

// Función helper para encontrar usuario por ID
export async function findUserById(id: number, env: Env): Promise<any | null> {
  try {
    // Buscar primero en el índice rápido
    const cachedUser = await env.ACA_KV.get(`user:id:${id}`);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    // Fallback a búsqueda en lista completa
    const users = await getAllUsers(env);
    return users.find(u => u.id === id) || null;
  } catch (error) {
    console.error('Error finding user by id:', error);
    return null;
  }
}

// Función helper para verificar contraseña
export async function verifyUserPassword(userId: number, password: string, env: Env): Promise<boolean> {
  try {
    const storedPassword = await env.ACA_KV.get(`user:${userId}:password`);
    if (!storedPassword) return false;
    
    return atob(storedPassword) === password;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

// Función helper para actualizar contraseña
export async function updateUserPassword(userId: number, newPassword: string, env: Env): Promise<void> {
  await env.ACA_KV.put(`user:${userId}:password`, btoa(newPassword));
  
  // Actualizar historial de contraseñas
  const passwordHistory = await env.ACA_KV.get(`user:${userId}:password_history`);
  const history = passwordHistory ? JSON.parse(passwordHistory) : [];
  
  history.push({
    changedAt: new Date().toISOString(),
    method: 'password_update',
    userId: userId
  });
  
  // Mantener solo los últimos 5 cambios
  if (history.length > 5) {
    history.splice(0, history.length - 5);
  }
  
  await env.ACA_KV.put(`user:${userId}:password_history`, JSON.stringify(history));
}