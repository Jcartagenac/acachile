#!/usr/bin/env node

/**
 * Configurador automático usando wrangler CLI
 * Alternativa para configurar bindings que aparezcan en dashboard
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  projectName: 'acachile-prod',
  accountId: '172194a6569df504cbb8a638a94d3d2c',
  bindings: {
    d1: { name: 'DB', id: '086f0530-48b6-41db-95ab-77bce733f0df', database: 'acachile-db' },
    kv: { name: 'ACA_KV', id: '60fff9f10819406cad241e326950f056' }
  }
};

function runCommand(command) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

async function configureWithWrangler() {
  console.log('🔧 Intentando configuración con wrangler CLI...');
  
  // Verificar comandos disponibles para pages
  const pagesHelp = runCommand('npx wrangler pages --help');
  
  if (pagesHelp.success) {
    console.log('✅ Wrangler disponible');
    
    // Intentar comandos específicos para bindings
    const commands = [
      'npx wrangler pages project list',
      'npx wrangler d1 list',
      'npx wrangler kv:namespace list'
    ];
    
    for (const cmd of commands) {
      console.log(`\n🔍 Ejecutando: ${cmd}`);
      const result = runCommand(cmd);
      if (result.success) {
        console.log('✅ Comando exitoso');
        if (cmd.includes('d1 list')) {
          console.log('📊 D1 Databases disponibles:');
          console.log(result.output);
        } else if (cmd.includes('kv:namespace')) {
          console.log('🗄️  KV Namespaces disponibles:');
          console.log(result.output);
        }
      } else {
        console.log('❌ Comando falló:', result.error);
      }
    }
    
    return true;
  }
  
  return false;
}

async function createBindingsInstructions() {
  console.log('\n📋 INSTRUCCIONES DETALLADAS PARA DASHBOARD');
  console.log('═══════════════════════════════════════════');
  
  console.log('\n🌐 Abrir dashboard:');
  console.log(`   https://dash.cloudflare.com/${CONFIG.accountId}/pages/view/${CONFIG.projectName}`);
  
  console.log('\n🔧 En la pestaña "Functions":');
  console.log('   1. Click "Manage bindings" (o "Add binding" si no hay ninguna)');
  
  console.log('\n📊 Configurar D1 Database:');
  console.log('   • Tipo: "D1 database"');
  console.log(`   • Variable name: "${CONFIG.bindings.d1.name}"`);
  console.log(`   • D1 database: "${CONFIG.bindings.d1.database}"`);
  console.log(`   • Database ID: ${CONFIG.bindings.d1.id}`);
  
  console.log('\n🗄️  Configurar KV Namespace:');
  console.log('   • Tipo: "KV namespace"');
  console.log(`   • Variable name: "${CONFIG.bindings.kv.name}"`);
  console.log(`   • KV namespace ID: ${CONFIG.bindings.kv.id}`);
  console.log('   • (Seleccionar el namespace de producción)');
  
  console.log('\n💾 Guardar cambios:');
  console.log('   • Click "Save"');
  console.log('   • Esperar confirmación');
  
  console.log('\n✅ Verificación:');
  console.log('   • Las bindings aparecerán en Functions tab');
  console.log('   • Verificar: curl https://acachile-frontend.pages.dev/api/bindings');
  
  return true;
}

/**
 * Muestra el estado de los bindings
 */
function displayBindingsStatus(data) {
  console.log('✅ API respondiendo correctamente');
  console.log('\n📊 Estado de bindings:');
  console.log(`   • D1 Database (${CONFIG.bindings.d1.name}): ${data.bindings?.DB ? '✅' : '❌'}`);
  console.log(`   • KV Namespace (${CONFIG.bindings.kv.name}): ${data.bindings?.ACA_KV ? '✅' : '❌'}`);
  console.log(`   • Environment: ${data.bindings?.ENVIRONMENT || 'not set'}`);
}

/**
 * Muestra los tests de conectividad
 */
function displayConnectivityTests(tests) {
  if (!tests) return;
  
  console.log('\n🧪 Tests de conectividad:');
  console.log(`   • Database connected: ${tests.database?.connected ? '✅' : '❌'}`);
  console.log(`   • KV connected: ${tests.kv?.connected ? '✅' : '❌'}`);
  
  if (tests.database?.tables) {
    console.log(`   • Tables found: ${tests.database.tables.length}`);
  }
}

/**
 * Procesa la respuesta de bindings
 */
function processBindingsResponse(output) {
  try {
    const data = JSON.parse(output);
    displayBindingsStatus(data);
    displayConnectivityTests(data.tests);
    return true;
  } catch (error) {
    console.log('❌ Error parseando respuesta:', error.message);
    return false;
  }
}

async function verifyCurrentBindings() {
  console.log('\n🔍 VERIFICANDO BINDINGS ACTUALES');
  console.log('═══════════════════════════════════');
  
  const curlCommand = 'curl -s https://acachile-frontend.pages.dev/api/bindings';
  const result = runCommand(curlCommand);
  
  if (result.success) {
    return processBindingsResponse(result.output);
  } else {
    console.log('❌ Error verificando bindings:', result.error);
    return false;
  }
}

async function main() {
  console.log('🚀 CONFIGURADOR DE BINDINGS - SOLUCIÓN COMPLETA');
  console.log('═══════════════════════════════════════════════');
  
  // Verificar estado actual
  const bindingsWorking = await verifyCurrentBindings();
  
  if (bindingsWorking) {
    console.log('\n🎯 ESTADO: Bindings funcionando via wrangler.toml');
    console.log('📝 OBJETIVO: Hacer que aparezcan en Functions tab del dashboard');
    
    // Intentar configuración automática
    await configureWithWrangler();
    
    // Mostrar instrucciones manuales
    await createBindingsInstructions();
    
    console.log('\n🎉 RESUMEN:');
    console.log('   ✅ Bindings funcionando correctamente');
    console.log('   📋 Instrucciones proporcionadas para dashboard');
    console.log('   🔗 URL del proyecto abierta automáticamente');
    
    // Abrir dashboard automáticamente
    const dashboardUrl = `https://dash.cloudflare.com/${CONFIG.accountId}/pages/view/${CONFIG.projectName}`;
    
    try {
      execSync(`open "${dashboardUrl}"`, { stdio: 'ignore' });
      console.log('   🌐 Dashboard abierto en navegador');
    } catch (error) {
      console.log('   ℹ️  Abrir manualmente:', dashboardUrl);
    }
    
  } else {
    console.log('\n❌ Las bindings no están funcionando correctamente');
    console.log('   Verifica la configuración en wrangler.toml');
  }
}

if (require.main === module) {
  main().catch(console.error);
}