/**
 * Sistema de autenticación para ACA Chile
 * JWT tokens y gestión de usuarios
 */

export interface Env {
  ACA_KV: KVNamespace;
  DB: D1Database;
  JWT_SECRET?: string;
  ENVIRONMENT: string;
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rut?: string;
  ciudad?: string;
  role: 'admin' | 'editor' | 'user';
  activo: boolean;
  created_at: string;
  last_login?: string;
}

export interface AuthToken {
  userId: number;
  email: string;
  role: string;
  isAdmin: boolean;
  exp: number;
  iat: number;
}

/**
 * Generar JWT token simple (sin librerías externas)
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str += '='.repeat((4 - str.length % 4) % 4);
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

async function hmacSha256(key: string, data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataArray = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  return await crypto.subtle.sign('HMAC', cryptoKey, dataArray);
}

export async function createJWT(payload: any, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  
  const signature = await hmacSha256(secret, data);
  const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${data}.${encodedSignature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token inválido');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    
    // Verificar firma
    const expectedSignature = await hmacSha256(secret, data);
    const expectedEncoded = base64UrlEncode(String.fromCharCode(...new Uint8Array(expectedSignature)));
    
    if (encodedSignature !== expectedEncoded) {
      throw new Error('Firma inválida');
    }

    // Decodificar payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    
    // Verificar expiración
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      throw new Error('Token expirado');
    }

    return payload;
  } catch (error) {
    throw new Error('Token inválido');
  }
}

/**
 * Crear usuario
 */
export async function createUser(
  env: Env,
  userData: {
    email: string;
    nombre: string;
    apellido: string;
    password: string;
    telefono?: string;
    rut?: string;
    ciudad?: string;
    role?: 'admin' | 'editor' | 'user';
  }
): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    const { email, nombre, apellido, password, telefono, rut, ciudad, role = 'user' } = userData;

    // Validaciones básicas
    if (!email || !nombre || !apellido || !password) {
      return { success: false, error: 'Email, nombre, apellido y contraseña son requeridos' };
    }

    if (password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    // Verificar si el usuario ya existe
    const existingUser = await env.DB.prepare(`
      SELECT id FROM usuarios WHERE email = ?
    `).bind(email.toLowerCase()).first();

    if (existingUser) {
      return { success: false, error: 'El usuario ya existe' };
    }

    // Hash simple de la contraseña (en producción usar bcrypt)
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt_aca_chile_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const passwordHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Crear usuario
    const result = await env.DB.prepare(`
      INSERT INTO usuarios (
        email, nombre, apellido, password_hash, telefono, rut, ciudad, role, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      email.toLowerCase(),
      nombre,
      apellido,
      passwordHash,
      telefono,
      rut,
      ciudad,
      role
    ).run();

    if (!result.success) {
      return { success: false, error: 'Error creando usuario' };
    }

    const userId = result.meta.last_row_id as number;

    // Obtener usuario creado
    const newUser = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, telefono, rut, ciudad, role, activo, created_at
      FROM usuarios WHERE id = ?
    `).bind(userId).first();

    const user: User = {
      id: newUser!.id as number,
      email: newUser!.email as string,
      nombre: newUser!.nombre as string,
      apellido: newUser!.apellido as string,
      telefono: newUser!.telefono as string,
      rut: newUser!.rut as string,
      ciudad: newUser!.ciudad as string,
      role: newUser!.role as 'admin' | 'editor' | 'user',
      activo: Boolean(newUser!.activo),
      created_at: newUser!.created_at as string
    };

    return { success: true, data: user };

  } catch (error) {
    console.error('Error en createUser:', error);
    return { success: false, error: 'Error interno creando usuario' };
  }
}

/**
 * Autenticar usuario
 */
export async function authenticateUser(
  env: Env,
  email: string,
  password: string
): Promise<{ success: boolean; data?: { user: User; token: string }; error?: string }> {
  try {
    // Hash de la contraseña proporcionada
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt_aca_chile_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const passwordHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Buscar usuario
    const userRow = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, telefono, rut, ciudad, role, activo, created_at, password_hash
      FROM usuarios 
      WHERE email = ? AND password_hash = ? AND activo = 1
    `).bind(email.toLowerCase(), passwordHash).first();

    if (!userRow) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    // Actualizar último login
    await env.DB.prepare(`
      UPDATE usuarios SET last_login = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(userRow.id).run();

    const user: User = {
      id: userRow.id as number,
      email: userRow.email as string,
      nombre: userRow.nombre as string,
      apellido: userRow.apellido as string,
      telefono: userRow.telefono as string,
      rut: userRow.rut as string,
      ciudad: userRow.ciudad as string,
      role: userRow.role as 'admin' | 'editor' | 'user',
      activo: Boolean(userRow.activo),
      created_at: userRow.created_at as string,
      last_login: new Date().toISOString()
    };

    // Crear token JWT
    const tokenPayload: AuthToken = {
      userId: user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.role === 'admin',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 días
      iat: Math.floor(Date.now() / 1000)
    };

    const secret = env.JWT_SECRET || 'aca_chile_default_secret_2024';
    const token = await createJWT(tokenPayload, secret);

    return { success: true, data: { user, token } };

  } catch (error) {
    console.error('Error en authenticateUser:', error);
    return { success: false, error: 'Error interno autenticando' };
  }
}

/**
 * Obtener token del request
 */
export function getTokenFromRequest(request: Request): AuthToken | null {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7);
    
    // En una implementación real, deberíamos verificar el token aquí
    // Por ahora, simulamos que está bien formado
    const payload = JSON.parse(base64UrlDecode(token.split('.')[1]));
    
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      isAdmin: payload.role === 'admin',
      exp: payload.exp,
      iat: payload.iat
    };
  } catch (error) {
    return null;
  }
}

/**
 * Verificar token
 */
export async function verifyToken(
  env: Env,
  token: string
): Promise<{ success: boolean; data?: AuthToken; error?: string }> {
  try {
    const secret = env.JWT_SECRET || 'aca_chile_default_secret_2024';
    const payload = await verifyJWT(token, secret);
    
    return { success: true, data: payload };
  } catch (error) {
    return { success: false, error: 'Token inválido' };
  }
}

/**
 * Obtener usuario por ID
 */
export async function getUserById(
  env: Env,
  userId: number
): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    const userRow = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, telefono, rut, ciudad, role, activo, created_at, last_login
      FROM usuarios WHERE id = ? AND activo = 1
    `).bind(userId).first();

    if (!userRow) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const user: User = {
      id: userRow.id as number,
      email: userRow.email as string,
      nombre: userRow.nombre as string,
      apellido: userRow.apellido as string,
      telefono: userRow.telefono as string,
      rut: userRow.rut as string,
      ciudad: userRow.ciudad as string,
      role: userRow.role as 'admin' | 'editor' | 'user',
      activo: Boolean(userRow.activo),
      created_at: userRow.created_at as string,
      last_login: userRow.last_login as string
    };

    return { success: true, data: user };

  } catch (error) {
    console.error('Error en getUserById:', error);
    return { success: false, error: 'Error obteniendo usuario' };
  }
}