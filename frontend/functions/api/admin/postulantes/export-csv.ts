import { errorResponse, requireAdminOrDirector, authErrorResponse } from '../_middleware';
import { ensurePostulacionesSchema, isDirectorRole } from '../../_utils/postulaciones';

/**
 * Calcula la edad a partir de una fecha de nacimiento
 */
function calculateAge(birthdate: string | null): number | null {
  if (!birthdate) return null;
  
  try {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    return null;
  }
}

/**
 * Formatea una fecha en formato DD/MM/YYYY
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateString;
  }
}

/**
 * Escapa valores para CSV (maneja comillas, saltos de línea, etc.)
 */
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) return '';
  
  const strValue = String(value);
  
  // Si contiene comillas, saltos de línea o comas, encerrar en comillas y escapar comillas internas
  if (strValue.includes('"') || strValue.includes(',') || strValue.includes('\n') || strValue.includes('\r')) {
    return `"${strValue.replace(/"/g, '""')}"`;
  }
  
  return strValue;
}

/**
 * Formatea RUT chileno con guión y sin puntos (ej: 12345678-9)
 */
function formatRut(rut: string | null): string {
  if (!rut) return '';
  
  // Remover puntos y guiones existentes
  const cleanRut = rut.replace(/[.-]/g, '');
  
  // Si tiene al menos 2 caracteres, separar dígito verificador
  if (cleanRut.length >= 2) {
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);
    return `${body}-${dv}`;
  }
  
  return cleanRut;
}

export const onRequestGet = async ({ request, env }: any) => {
  try {
    let auth;
    try {
      auth = await requireAdminOrDirector(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const user = await env.DB.prepare(`
      SELECT id, role
      FROM usuarios
      WHERE id = ?
    `)
      .bind(auth.userId)
      .first();

    if (!user || !isDirectorRole(user.role)) {
      return errorResponse('No tienes permisos para exportar postulaciones', 403);
    }

    await ensurePostulacionesSchema(env.DB);

    // Obtener postulantes en estado pendiente
    const result = await env.DB.prepare(`
      SELECT 
        id,
        full_name,
        email,
        phone,
        rut,
        birthdate,
        region,
        city,
        address,
        occupation,
        experience_level,
        specialties,
        motivation,
        contribution,
        has_competition_experience,
        competition_details,
        sponsor_1,
        sponsor_2,
        instagram,
        other_networks,
        references_info,
        photo_url,
        previous_aca_member,
        previous_association,
        still_in_association,
        exit_reason,
        created_at
      FROM postulaciones
      WHERE status = 'pendiente'
      ORDER BY created_at DESC
    `).all();

    const postulaciones = result.results || [];

    // Columnas del CSV según especificación
    const headers = [
      'Fecha postulación',
      'Nombre Completo (Nombres y Apellidos)',
      'Mail de Contacto',
      'Cedula de Identidad (Con digito verificador, sin puntos y con guion)',
      'Fecha de Nacimiento',
      'Edad',
      'Telefono Celular',
      'Direccion Particular',
      'Comuna',
      'Ciudad',
      'Instagram',
      'A que te dedicas principalmente? Cargo o profesion',
      'Perteneces a algun equipo de competencia de asadores? Cual?',
      'Patrocinador 1',
      'Patrocinador 2',
      'Te queremos conocer. Envianos una foto.',
      'Ha pertenecido anteriormente a la ACA?',
      'Ha pertenecido o perteneces a otra asociacion similar (Asadores)? Cual?',
      'Aun pertenece a dicha asociacion?',
      'Si su respuesta es "NO", indique los motivos de su salida de su anterior asociacion',
      'Indique los motivos que lo llevan a postular a esta asociacion',
    ];

    // Generar filas del CSV
    const rows = postulaciones.map((p: any) => {
      const age = calculateAge(p.birthdate);
      
      return [
        formatDate(p.created_at),                                    // Fecha postulación
        p.full_name || '',                                           // Nombre Completo
        p.email || '',                                               // Mail de Contacto
        formatRut(p.rut),                                            // Cedula de Identidad
        formatDate(p.birthdate),                                     // Fecha de Nacimiento
        age !== null ? age.toString() : '',                          // Edad
        p.phone || '',                                               // Telefono Celular
        p.address || '',                                             // Direccion Particular
        p.region || '',                                              // Comuna (usando region)
        p.city || '',                                                // Ciudad
        p.instagram || '',                                           // Instagram
        p.occupation || '',                                          // Cargo o profesion
        p.has_competition_experience ? (p.competition_details || 'Sí') : 'No', // Equipo de competencia
        p.sponsor_1 || '',                                           // Patrocinador 1
        p.sponsor_2 || '',                                           // Patrocinador 2
        p.photo_url || '',                                           // Foto
        p.previous_aca_member ? 'Sí' : 'No',                         // Ha pertenecido a ACA?
        p.previous_association || '',                                // Otra asociación
        p.still_in_association ? 'Sí' : 'No',                        // Aun pertenece?
        p.exit_reason || '',                                         // Motivos salida
        p.motivation || '',                                          // Motivos postulación
      ].map(escapeCsvValue);
    });

    // Construir CSV
    const csvLines = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map((row: string[]) => row.join(',')),
    ];

    const csvContent = csvLines.join('\n');

    // Agregar BOM para que Excel reconozca UTF-8
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    // Generar nombre de archivo con fecha
    const now = new Date();
    const filename = `postulantes_pendientes_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.csv`;

    return new Response(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[admin/postulantes/export-csv] Error:', error);
    return errorResponse('Error al generar CSV', 500);
  }
};
