/**
 * POST /api/auth/find-user-by-rut
 * Busca un usuario por RUT y retorna su email (enmascarado)
 */

interface FindUserRequest {
  rut: string;
}

// Función para enmascarar email
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
}

export const onRequestPost = async (context: any) => {
  try {
    const body = await context.request.json() as FindUserRequest;

    if (!body.rut) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'RUT es requerido'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Buscar usuario por RUT
    const result = await context.env.DB.prepare(
      'SELECT email FROM usuarios WHERE rut = ? AND activo = 1'
    )
      .bind(body.rut)
      .first();

    if (!result || !result.email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No se encontró un usuario con ese RUT'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Retornar email enmascarado
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          email: maskEmail(result.email as string)
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error finding user by RUT:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error al buscar usuario'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
