/**
 * Script de migración de KV a D1
 * Migra usuarios, eventos e inscripciones existentes
 */

export interface Env {
  DB: D1Database;
  ACA_KV: KVNamespace;
}

/**
 * Migrar datos de usuarios desde KV a D1
 */
export async function migrateUsersToD1(env: Env): Promise<void> {
  try {
    console.log('🔄 Migrando usuarios desde KV a D1...');
    
    // Los usuarios están en el sistema legacy, vamos a crear usuarios básicos
    const defaultUsers = [
      {
        id: 1,
        name: 'admin',
        email: 'jcartagenac@gmail.com',
        region: 'Metropolitana',
        is_admin: true
      },
      {
        id: 2,
        name: 'Organizador',
        email: 'organizador@acachile.com',
        region: 'Metropolitana',
        is_admin: false
      }
    ];

    for (const user of defaultUsers) {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO users (id, name, email, region, is_admin, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(user.id, user.name, user.email, user.region, user.is_admin).run();
    }

    console.log('✅ Usuarios migrados');
  } catch (error) {
    console.error('❌ Error migrando usuarios:', error);
  }
}

/**
 * Migrar eventos desde KV a D1
 */
export async function migrateEventsToD1(env: Env): Promise<void> {
  try {
    console.log('🔄 Migrando eventos desde KV a D1...');
    
    // Obtener eventos desde KV
    const eventosKV = await env.ACA_KV.get('eventos');
    if (!eventosKV) {
      console.log('📝 No hay eventos en KV, creando eventos de ejemplo...');
      return;
    }

    const eventos = JSON.parse(eventosKV);
    
    for (const evento of eventos) {
      // Convertir formato KV a D1
      await env.DB.prepare(`
        INSERT OR REPLACE INTO events (
          id, title, description, date, time, location, image, type,
          registration_open, max_participants, current_participants, price,
          requirements, tags, contact_info, organizer_id, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        evento.id,
        evento.title,
        evento.description,
        evento.date,
        evento.time || null,
        evento.location,
        evento.image,
        evento.type,
        evento.registrationOpen ? 1 : 0,
        evento.maxParticipants || null,
        evento.currentParticipants || 0,
        evento.price || 0,
        JSON.stringify(evento.requirements || []),
        JSON.stringify(evento.tags || []),
        JSON.stringify(evento.contactInfo || {}),
        evento.organizerId || 1,
        evento.status || 'published',
        evento.createdAt || new Date().toISOString(),
        evento.updatedAt || new Date().toISOString()
      ).run();
    }

    console.log(`✅ ${eventos.length} eventos migrados`);
  } catch (error) {
    console.error('❌ Error migrando eventos:', error);
  }
}

/**
 * Migrar inscripciones desde KV a D1
 */
export async function migrateInscriptionsToD1(env: Env): Promise<void> {
  try {
    console.log('🔄 Migrando inscripciones desde KV a D1...');
    
    // Las inscripciones en KV pueden estar dispersas
    // Vamos a buscar todas las claves que empiecen con "insc_"
    const inscriptionKeys = await env.ACA_KV.list({ prefix: 'insc_' });
    
    for (const key of inscriptionKeys.keys) {
      try {
        const inscriptionData = await env.ACA_KV.get(key.name);
        if (inscriptionData) {
          const inscription = JSON.parse(inscriptionData);
          
          await env.DB.prepare(`
            INSERT OR REPLACE INTO inscriptions (
              id, user_id, event_id, status, inscription_date,
              payment_status, payment_amount, notes, waitlist_position,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            inscription.id,
            inscription.userId,
            inscription.eventId,
            inscription.status,
            inscription.inscriptionDate,
            inscription.paymentStatus || 'pending',
            inscription.paymentAmount || 0,
            inscription.notes || null,
            inscription.waitlistPosition || null,
            inscription.createdAt,
            inscription.updatedAt
          ).run();
        }
      } catch (itemError) {
        console.warn(`⚠️ Error migrando inscripción ${key.name}:`, itemError);
      }
    }

    console.log(`✅ ${inscriptionKeys.keys.length} inscripciones procesadas`);
  } catch (error) {
    console.error('❌ Error migrando inscripciones:', error);
  }
}

/**
 * Ejecutar migración completa
 */
export async function runMigration(env: Env): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🚀 Iniciando migración de KV a D1...');
    
    await migrateUsersToD1(env);
    await migrateEventsToD1(env);
    await migrateInscriptionsToD1(env);
    
    console.log('🎉 Migración completada exitosamente');
    return { success: true, message: 'Migración completada exitosamente' };
  } catch (error) {
    console.error('💥 Error en migración:', error);
    return { success: false, message: `Error en migración: ${error}` };
  }
}